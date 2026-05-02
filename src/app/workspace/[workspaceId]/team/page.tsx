"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Plus,
  Shield,
  Crown,
  UserCircle,
  Mail,
  Calendar,
  MoreHorizontal,
  Search,
  UserPlus,
  Briefcase,
} from "lucide-react";
import InviteModal from "@/components/InviteModal";
import RoleGate from "@/components/RoleGate";
import { Skeleton, TeamDataSkeleton } from "@/components/ui/skeleton";

type WorkspaceMember = {
  userId: string;
  role: string;
  joinedAt: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

const roleConfig: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  admin: { icon: Shield, color: "#a259ff", label: "Admin" },
  project_manager: { icon: Briefcase, color: "#ff9f43", label: "Project Manager" },
  member: { icon: UserCircle, color: "#4f7cff", label: "Member" },
  owner: { icon: Crown, color: "#ff9f43", label: "Owner" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// Deterministic color from name
function avatarColor(name: string) {
  const colors = ["#4f7cff", "#a259ff", "#00d4aa", "#ff9f43", "#ff4f7c", "#00b4d8"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function TeamPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspace, setWorkspace] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [membersRes, wsRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/members`),
          fetch(`/api/workspaces/${workspaceId}`),
        ]);

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(Array.isArray(data) ? data : []);
        } else {
          const data = await membersRes.json();
          setError(data.error || "Failed to load members.");
        }

        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setWorkspace({ name: wsData.name });
        }
      } catch {
        setError("Network error. Could not load team data.");
      } finally {
        setLoading(false);
        setTimeout(() => setLoaded(true), 50);
      }
    }

    if (workspaceId) fetchData();
  }, [workspaceId]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = members.filter((m) => m.role === "admin").length;
  const memberCount = members.filter((m) => m.role === "member").length;
  const wsName = workspace?.name ?? "Workspace";

  return (
    <>
      <div className="flex flex-col gap-6 pb-12">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "#4f7cff", boxShadow: "0 0 8px #4f7cff" }}
              />
              <span className="text-xs font-medium text-[var(--color-muted)]">
                {loading ? (
                  <Skeleton className="inline-block h-3 w-36 rounded align-middle" />
                ) : (
                  `${wsName} workspace`
                )}
              </span>
            </div>
            <h1
              className="text-2xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Team
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              Manage members and invite collaborators to this workspace.
            </p>
          </div>

          <RoleGate workspaceId={workspaceId} allowedRoles={["admin", "project_manager"]}>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shrink-0"
              style={{
                background: "linear-gradient(135deg, #4f7cff, #6b93ff)",
                color: "#fff",
                border: "1px solid rgba(79, 124, 255, 0.3)",
                boxShadow:
                  "0 4px 16px rgba(79, 124, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              }}
            >
              <UserPlus className="w-4 h-4" />
              Invite People
            </button>
          </RoleGate>
        </div>

        {loading ? (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members by name or email…"
                disabled
                className="w-full pl-11 pr-4 py-3 bg-[var(--color-surface)] border border-white/[0.06] rounded-xl text-sm text-[#f0f0f5] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#4f7cff]/40 focus:ring-1 focus:ring-[#4f7cff]/15 transition-all duration-200 disabled:opacity-50"
              />
            </div>
            <TeamDataSkeleton />
          </>
        ) : (
          <>
            {/* ── Stat Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Total Members",
                  value: members.length.toString(),
                  icon: Users,
                  color: "#4f7cff",
                },
                {
                  label: "Admins",
                  value: adminCount.toString(),
                  icon: Shield,
                  color: "#a259ff",
                },
                {
                  label: "Members",
                  value: memberCount.toString(),
                  icon: UserCircle,
                  color: "#00d4aa",
                },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`group relative p-5 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${150 + i * 80}ms` }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${stat.color}08, transparent 70%)`,
                    }}
                  />
                  <div className="relative flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `color-mix(in srgb, ${stat.color} 12%, transparent)`,
                      }}
                    >
                      <stat.icon className="w-[18px] h-[18px]" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#f0f0f5] leading-none mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* ── Search Bar ─────────────────────────────────────── */}
            <div
              className={`transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "400ms" }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members by name or email…"
                  className="w-full pl-11 pr-4 py-3 bg-[var(--color-surface)] border border-white/[0.06] rounded-xl text-sm text-[#f0f0f5] placeholder-[var(--color-muted)] focus:outline-none focus:border-[#4f7cff]/40 focus:ring-1 focus:ring-[#4f7cff]/15 transition-all duration-200"
                />
              </div>
            </div>

            {/* ── Members List ───────────────────────────────────── */}
            <div
              className={`rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "500ms" }}
            >
              {/* Table Header */}
              <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.05] text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-[0.1em]">
                <div className="w-10" />
                <div className="flex-1">Member</div>
                <div className="w-24 hidden sm:block">Role</div>
                <div className="w-28 hidden md:block">Joined</div>
                <div className="w-8" />
              </div>

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-sm text-red-300 mb-1">{error}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Please try refreshing the page.
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(79, 124, 255, 0.1), rgba(162, 89, 255, 0.08))",
                      border: "1px solid rgba(79, 124, 255, 0.15)",
                    }}
                  >
                    <Users className="w-6 h-6 text-[#4f7cff]" />
                  </div>
                  {search ? (
                    <>
                      <p className="text-sm text-[#f0f0f5] font-medium mb-1">No matches found</p>
                      <p className="text-xs text-[var(--color-muted)] max-w-[240px]">
                        No team members match &quot;{search}&quot;. Try a different search term.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#f0f0f5] font-medium mb-1">No team members yet</p>
                      <p className="text-xs text-[var(--color-muted)] max-w-[240px] mb-5">
                        Invite your first team member to start collaborating in this workspace.
                      </p>
                      <RoleGate
                        workspaceId={workspaceId}
                        allowedRoles={["admin", "project_manager"]}
                      >
                        <button
                          onClick={() => setInviteOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#4f7cff] bg-[#4f7cff]/[0.08] border border-[#4f7cff]/20 rounded-xl hover:bg-[#4f7cff]/[0.12] transition-all duration-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Invite People
                        </button>
                      </RoleGate>
                    </>
                  )}
                </div>
              )}

              {/* Member Rows */}
              {!error &&
                filtered.map((member, i) => {
                  const rc = roleConfig[member.role] || roleConfig.member;
                  const color = avatarColor(member.name);
                  return (
                    <div
                      key={member.userId}
                      className={`group flex items-center gap-4 px-6 py-4 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-all duration-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                      style={{ transitionDelay: `${550 + i * 40}ms` }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 border border-white/[0.06]"
                        style={{
                          background: `color-mix(in srgb, ${color} 18%, transparent)`,
                          color,
                        }}
                      >
                        {getInitials(member.name)}
                      </div>

                      {/* Name & Email */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#f0f0f5] truncate">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-[var(--color-muted)] truncate flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          {member.email}
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="w-24 hidden sm:block">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            background: `color-mix(in srgb, ${rc.color} 12%, transparent)`,
                            color: rc.color,
                            border: `1px solid color-mix(in srgb, ${rc.color} 15%, transparent)`,
                          }}
                        >
                          <rc.icon className="w-3 h-3" />
                          {rc.label}
                        </span>
                      </div>

                      {/* Joined Date */}
                      <div className="w-28 hidden md:flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDate(member.joinedAt)}
                      </div>

                      {/* Actions */}
                      <div className="w-8 flex items-center justify-center">
                        <button className="p-1.5 text-[var(--color-muted)] hover:text-[#f0f0f5] hover:bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* ── Invite CTA Card ────────────────────────────────── */}
            {!error && members.length > 0 && (
              <RoleGate workspaceId={workspaceId} allowedRoles={["admin", "project_manager"]}>
                <div
                  className={`border border-dashed border-white/[0.06] rounded-2xl flex items-center justify-center py-10 group hover:border-[#4f7cff]/20 hover:bg-[#4f7cff]/[0.02] transition-all duration-300 cursor-pointer ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: "700ms" }}
                  onClick={() => setInviteOpen(true)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-[var(--color-muted)] group-hover:text-[#4f7cff] group-hover:scale-110 group-hover:border-[#4f7cff]/20 transition-all duration-300 mb-3">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-medium text-[var(--color-muted)] group-hover:text-[#f0f0f5] transition-colors">
                      Invite more team members
                    </span>
                    <p className="text-[11px] text-[var(--color-muted)] mt-1">
                      Grow your workspace by adding collaborators
                    </p>
                  </div>
                </div>
              </RoleGate>
            )}
          </>
        )}
      </div>

      {/* ── Invite Modal ──────────────────────────────────────── */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaceId={workspaceId}
        workspaceName={wsName}
      />
    </>
  );
}
