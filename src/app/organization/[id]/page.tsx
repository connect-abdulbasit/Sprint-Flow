"use client";

import { useState } from "react";
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
} from "lucide-react";
import InviteModal from "@/components/InviteModal";

const ORGS: Record<string, { name: string; initials: string; desc: string }> = {
  "org-1": {
    name: "Acme Corporation",
    initials: "AC",
    desc: "Building digital experiences for the modern web.",
  },
  "org-2": {
    name: "Stark Industries",
    initials: "SI",
    desc: "Advanced R&D and defense technology.",
  },
  "org-3": { name: "Personal Projects", initials: "PP", desc: "Side projects and experiments." },
};

const members = [
  { id: 1, name: "Alice Johnson", role: "Frontend Lead", initials: "AJ" },
  { id: 2, name: "Bob Smith", role: "Backend Engineer", initials: "BS" },
  { id: 3, name: "Charlie Davis", role: "Product Manager", initials: "CD" },
  { id: 4, name: "Diana Prince", role: "UX Designer", initials: "DP" },
];

const workspaces = [
  {
    id: "engineering",
    name: "Engineering",
    desc: "Core product development",
    tasks: 42,
    members: 12,
    updated: "2 hours ago",
    color: "var(--color-accent)",
  },
  {
    id: "marketing",
    name: "Marketing",
    desc: "Campaigns and growth",
    tasks: 18,
    members: 6,
    updated: "5 hours ago",
    color: "var(--color-accent3)",
  },
  {
    id: "design",
    name: "Design System",
    desc: "Components and design tokens",
    tasks: 7,
    members: 4,
    updated: "1 day ago",
    color: "var(--color-accent2)",
  },
];

const stats = [
  { label: "Workspaces", value: "3", icon: FolderKanban, color: "var(--color-accent)" },
  { label: "Members", value: "24", icon: Users, color: "var(--color-accent2)" },
  { label: "Active Tasks", value: "67", icon: Activity, color: "var(--color-accent3)" },
];

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const org = ORGS[id] ?? { name: id, initials: id.slice(0, 2).toUpperCase(), desc: "" };
  const [inviteOpen, setInviteOpen] = useState(false);

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
              {org.initials}
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {org.name}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-0.5">{org.desc}</p>
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
            {workspaces.map((ws) => (
              <Link key={ws.id} href={`/workspace/${ws.id}/dashboard`} className="group block">
                <div className="relative h-full flex flex-col p-5 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
                  <div className="w-8 h-1 rounded-full mb-4" style={{ background: ws.color }} />
                  <h3 className="text-base font-bold text-[#f0f0f5] mb-1 group-hover:text-white transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] mb-5">{ws.desc}</p>

                  <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <div className="flex items-center gap-3">
                      <span>{ws.tasks} tasks</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-[var(--color-muted)]" />
                      <span>{ws.members} members</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                </div>
              </Link>
            ))}
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
