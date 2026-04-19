"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  MoreHorizontal,
  Users,
  FolderKanban,
  Activity,
  Plus,
  Settings,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import InviteModal from "@/components/InviteModal";
import { writeSelectedOrgId, writeWorkspaceIdForOrg } from "@/lib/workspace-prefs";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const members = [
  { id: 1, name: "Alice Johnson", role: "Frontend Lead", initials: "AJ" },
  { id: 2, name: "Bob Smith", role: "Backend Engineer", initials: "BS" },
  { id: 3, name: "Charlie Davis", role: "Product Manager", initials: "CD" },
  { id: 4, name: "Diana Prince", role: "UX Designer", initials: "DP" },
];

type ApiWorkspace = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  organizationId: string;
  color?: string | null;
};

const statsBase = [
  { label: "Workspaces", value: "0", icon: FolderKanban, color: "var(--color-accent)" },
  { label: "Members", value: "24", icon: Users, color: "var(--color-accent2)" },
  { label: "Active Tasks", value: "67", icon: Activity, color: "var(--color-accent3)" },
];

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<any>(null);
  const [orgWorkspaces, setOrgWorkspaces] = useState<ApiWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    async function fetchOrgAndWorkspaces() {
      if (!id) return;
      try {
        const [orgRes, wsRes] = await Promise.all([
          fetch(`/api/organizations/${id}`),
          fetch("/api/workspaces"),
        ]);
        if (!orgRes.ok) {
          throw new Error("Failed to load organization details");
        }
        const orgData = await orgRes.json();
        setOrg(orgData);

        if (wsRes.ok) {
          const allWs: ApiWorkspace[] = await wsRes.json();
          setOrgWorkspaces(allWs.filter((w) => w.organizationId === id));
        } else {
          setOrgWorkspaces([]);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrgAndWorkspaces();
  }, [id]);

  const stats = statsBase.map((s) =>
    s.label === "Workspaces" ? { ...s, value: String(orgWorkspaces.length) } : s
  );

  const persistWorkspaceNav = (workspaceId: string) => {
    if (!id) return;
    writeSelectedOrgId(id);
    writeWorkspaceIdForOrg(id, workspaceId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] rounded-full animate-spin mb-4" />
        <p className="text-sm text-[var(--color-muted)] font-medium">Synchronizing brand data...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#f0f0f5] mb-2">Organization Not Found</h2>
        <p className="text-sm text-[var(--color-muted)] max-w-xs mb-8">
          The requested organization could not be loaded. Please verify the URL or check your
          membership.
        </p>
        <Link
          href="/organizations"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] bg-[#f0f0f5] rounded-xl hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 pb-12">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-muted2)] transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All organizations
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface2)] border border-white/[0.06] flex items-center justify-center text-lg font-bold text-[#f0f0f5]">
              {getInitials(org.name)}
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {org.name}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-0.5">
                {org.description || "Building something great."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-[var(--color-muted)] hover:text-[#f0f0f5] bg-[var(--color-surface)] border border-white/[0.06] rounded-xl transition-colors">
              <Settings className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--color-bg)] bg-[#f0f0f5] rounded-xl hover:bg-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Invite
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
              >
                <s.icon className="w-[18px] h-[18px]" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5] leading-none">{s.value}</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Workspaces
            </h2>
            <button className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              New workspace
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgWorkspaces.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] md:col-span-3 py-6 px-1">
                No workspaces yet. Create one from the switcher or onboarding to get started.
              </p>
            ) : (
              orgWorkspaces.map((ws) => {
                const accent = ws.color || "var(--color-accent)";
                return (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}/dashboard`}
                    onClick={() => persistWorkspaceNav(ws.id)}
                    className="group block"
                  >
                    <div className="relative h-full flex flex-col p-5 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
                      <div className="w-8 h-1 rounded-full mb-4" style={{ background: accent }} />
                      <h3 className="text-base font-bold text-[#f0f0f5] mb-1 group-hover:text-white transition-colors">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-[var(--color-muted)] mb-5 line-clamp-2">
                        {ws.description?.trim() ||
                          "Open this workspace to manage projects and tasks."}
                      </p>

                      <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-[var(--color-muted)]">
                        <span className="truncate">/{ws.slug}</span>
                        <ChevronRight className="w-4 h-4 text-[var(--color-muted)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Members
            </h2>
            <button className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors">
              View all
            </button>
          </div>
          <div className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] divide-y divide-white/[0.05] overflow-hidden">
            {members.map((m) => (
              <div
                key={m.id}
                className="group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--color-surface2)] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-[var(--color-muted2)] shrink-0">
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#f0f0f5] truncate block">
                    {m.name}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">{m.role}</span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organizationId={id}
        organizationName={org.name}
      />
    </>
  );
}
