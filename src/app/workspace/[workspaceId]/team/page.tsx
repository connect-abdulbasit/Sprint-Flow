"use client";

import { useState, useEffect, useMemo } from "react";
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
  LogOut,
  UserMinus,
} from "lucide-react";
import InviteModal from "@/components/InviteModal";
import RoleGate from "@/components/RoleGate";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Skeleton, TeamDataSkeleton } from "@/components/ui/skeleton";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import type { WorkspaceRole } from "@/lib/auth/rbac";

const ASSIGNABLE_ROLES: { value: WorkspaceRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "member", label: "Member" },
];

type WorkspaceMember = {
  userId: string;
  role: string;
  joinedAt: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

const roleConfig: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  admin: { icon: Shield, color: "var(--color-accent2)", label: "Admin" },
  project_manager: { icon: Briefcase, color: "var(--color-warning)", label: "Project Manager" },
  member: { icon: UserCircle, color: "var(--color-accent)", label: "Member" },
  owner: { icon: Crown, color: "var(--color-warning)", label: "Owner" },
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

function avatarColor(name: string) {
  const colors = [
    "var(--color-accent)",
    "var(--color-accent2)",
    "var(--color-success)",
    "var(--color-warning)",
    "var(--color-danger)",
    "var(--color-info)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function extractItems<T>(payload: T[] | { items?: T[] }) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
}

export default function TeamPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspace, setWorkspace] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const hasSearch = query.length > 0;

  // AUD-012 / AUD-013: member removal and role changes were fully implemented server-side
  // but had no UI to trigger them, and there was no way to leave a workspace at all.
  const { role: myRole } = useWorkspaceRole(workspaceId);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<WorkspaceMember | null>(null);

  const loadMembers = async () => {
    try {
      const membersRes = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (membersRes.ok) {
        const data = extractItems<WorkspaceMember>(await membersRes.json());
        setMembers(data);
      } else {
        const data = await membersRes.json();
        setError(data.error || "Failed to load members.");
      }
    } catch {
      setError("Network error. Could not load team data.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [membersRes, wsRes, meRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/members`),
          fetch(`/api/workspaces/${workspaceId}`),
          fetch("/api/auth/me", { cache: "no-store" }),
        ]);

        if (membersRes.ok) {
          const data = extractItems<WorkspaceMember>(await membersRes.json());
          setMembers(data);
        } else {
          const data = await membersRes.json();
          setError(data.error || "Failed to load members.");
        }

        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setWorkspace({ name: wsData.name });
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUserId(meData.user?.id ?? null);
        }
      } catch {
        setError("Network error. Could not load team data.");
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleRoleChange = async (member: WorkspaceMember, role: WorkspaceRole) => {
    setOpenMenuUserId(null);
    setActionError(null);
    setRoleUpdatingId(member.userId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${member.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update role.");
      }
      await loadMembers();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update role.");
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const isSelfRemoval = memberPendingRemoval?.userId === currentUserId;

  const handleConfirmRemove = async () => {
    if (!memberPendingRemoval) return;
    const res = await fetch(
      `/api/workspaces/${workspaceId}/members/${memberPendingRemoval.userId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to remove member.");
    }
    setMemberPendingRemoval(null);
    if (memberPendingRemoval.userId === currentUserId) {
      window.location.href = "/organizations";
      return;
    }
    await loadMembers();
  };

  const filtered = useMemo(() => {
    if (!hasSearch) return members;
    return members.filter((m) => {
      const roleLabel = roleConfig[m.role]?.label ?? m.role;
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        roleLabel.toLowerCase().includes(query)
      );
    });
  }, [members, hasSearch, query]);

  const adminCount = members.filter((m) => m.role === "admin").length;
  const projectManagerCount = members.filter((m) => m.role === "project_manager").length;
  const memberCount = members.filter((m) => m.role === "member").length;
  const wsName = workspace?.name ?? "Workspace";

  return (
    <>
      <div className="flex flex-col gap-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: "var(--color-accent)",
                  boxShadow: "0 0 8px var(--color-accent)",
                }}
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
              className="text-2xl font-extrabold tracking-[-0.02em] text-fg"
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
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5 shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
                boxShadow:
                  "0 4px 16px color-mix(in srgb, var(--color-accent) 25%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <TeamDataSkeleton />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Members",
                  value: members.length.toString(),
                  icon: Users,
                  color: "var(--color-accent)",
                },
                {
                  label: "Admins",
                  value: adminCount.toString(),
                  icon: Shield,
                  color: "var(--color-accent2)",
                },
                {
                  label: "Project Managers",
                  value: projectManagerCount.toString(),
                  icon: Briefcase,
                  color: "var(--color-warning)",
                },
                {
                  label: "Members",
                  value: memberCount.toString(),
                  icon: UserCircle,
                  color: "var(--color-success)",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group relative p-5 rounded-2xl bg-[var(--color-surface)] border border-border hover:border-border-hover transition-all duration-500 hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stat.color} 3%, transparent), transparent 70%)`,
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
                  <p className="text-3xl font-bold text-fg leading-none mb-1">{stat.value}</p>
                  <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members by name or email…"
                  className="w-full pl-11 pr-4 py-3 bg-[var(--color-surface)] border border-border rounded-xl text-sm text-fg placeholder-[var(--color-muted)] focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all duration-200"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--color-surface)] border border-border overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-3 border-b border-border text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-[0.1em]">
                <div className="w-10" />
                <div className="flex-1">Member</div>
                <div className="w-36 hidden sm:block">Role</div>
                <div className="w-28 hidden md:block">Joined</div>
                <div className="w-8" />
              </div>

              {error && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-danger" />
                  </div>
                  <p className="text-sm text-danger mb-1">{error}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Please try refreshing the page.
                  </p>
                </div>
              )}

              {!error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent2) 8%, transparent))",
                      border: "1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    }}
                  >
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  {hasSearch ? (
                    <>
                      <p className="text-sm text-fg font-medium mb-1">No matches found</p>
                      <p className="text-xs text-[var(--color-muted)] max-w-[240px]">
                        No team members match &quot;{search.trim()}&quot;. Try a different search
                        term.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-fg font-medium mb-1">No team members yet</p>
                      <p className="text-xs text-[var(--color-muted)] max-w-[240px] mb-5">
                        Invite your first team member to start collaborating in this workspace.
                      </p>
                      <RoleGate
                        workspaceId={workspaceId}
                        allowedRoles={["admin", "project_manager"]}
                      >
                        <button
                          onClick={() => setInviteOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-accent bg-accent/[0.08] border border-accent/20 rounded-xl hover:bg-accent/[0.12] transition-all duration-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Invite People
                        </button>
                      </RoleGate>
                    </>
                  )}
                </div>
              )}

              {!error &&
                filtered.map((member) => {
                  const rc = roleConfig[member.role] || roleConfig.member;
                  const color = avatarColor(member.name);
                  const isSelf = member.userId === currentUserId;
                  const canManage = myRole === "admin" || isSelf;
                  return (
                    <div
                      key={member.userId}
                      className="group relative flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-hover transition-all duration-300"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 border border-border"
                        style={{
                          background: `color-mix(in srgb, ${color} 18%, transparent)`,
                          color,
                        }}
                      >
                        {getInitials(member.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-fg truncate">{member.name}</div>
                        <div className="text-[11px] text-[var(--color-muted)] truncate flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          {member.email}
                        </div>
                      </div>

                      <div className="w-36 hidden sm:block">
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

                      <div className="w-28 hidden md:flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDate(member.joinedAt)}
                      </div>

                      <div className="w-8 flex items-center justify-center">
                        {canManage && (
                          <button
                            onClick={() =>
                              setOpenMenuUserId((prev) =>
                                prev === member.userId ? null : member.userId
                              )
                            }
                            disabled={roleUpdatingId === member.userId}
                            aria-haspopup="menu"
                            aria-expanded={openMenuUserId === member.userId}
                            aria-label={`Actions for ${member.name}`}
                            className="p-1.5 text-[var(--color-muted)] hover:text-fg hover:bg-hover rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 disabled:opacity-40"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {openMenuUserId === member.userId && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuUserId(null)}
                          />
                          <div
                            role="menu"
                            className="absolute right-6 top-14 z-20 w-56 rounded-xl border border-border bg-surface-2 py-1.5 shadow-2xl"
                          >
                            {myRole === "admin" && !isSelf && (
                              <>
                                <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                  Change role
                                </div>
                                {ASSIGNABLE_ROLES.filter((r) => r.value !== member.role).map(
                                  (r) => (
                                    <button
                                      key={r.value}
                                      role="menuitem"
                                      onClick={() => handleRoleChange(member, r.value)}
                                      className="w-full text-left px-3 py-2 text-[13px] text-fg hover:bg-hover-strong transition-colors"
                                    >
                                      Make {r.label}
                                    </button>
                                  )
                                )}
                                <div className="my-1 h-px bg-border" />
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuUserId(null);
                                    setMemberPendingRemoval(member);
                                  }}
                                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-[13px] text-danger hover:bg-danger/[0.08] transition-colors"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  Remove from workspace
                                </button>
                              </>
                            )}
                            {isSelf && (
                              <button
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  setMemberPendingRemoval(member);
                                }}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 text-[13px] text-danger hover:bg-danger/[0.08] transition-colors"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                Leave workspace
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>

            {!error && members.length > 0 && (
              <RoleGate workspaceId={workspaceId} allowedRoles={["admin", "project_manager"]}>
                <div
                  className="border border-dashed border-border rounded-2xl flex items-center justify-center py-10 group hover:border-accent/20 hover:bg-accent/[0.02] transition-all duration-300 cursor-pointer"
                  onClick={() => setInviteOpen(true)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-hover border border-border flex items-center justify-center text-[var(--color-muted)] group-hover:text-accent group-hover:scale-110 group-hover:border-accent/20 transition-all duration-300 mb-3">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-medium text-[var(--color-muted)] group-hover:text-fg transition-colors">
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

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaceId={workspaceId}
        workspaceName={wsName}
      />

      <ConfirmDialog
        isOpen={memberPendingRemoval !== null}
        onClose={() => setMemberPendingRemoval(null)}
        onConfirm={handleConfirmRemove}
        title={isSelfRemoval ? "Leave workspace?" : `Remove ${memberPendingRemoval?.name}?`}
        description={
          isSelfRemoval
            ? "You'll lose access to this workspace's projects, tickets, and settings immediately."
            : `${memberPendingRemoval?.name} will lose access to this workspace immediately. This cannot be undone.`
        }
        confirmLabel={isSelfRemoval ? "Leave workspace" : "Remove member"}
        variant="danger"
      />

      {actionError && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-[1200] max-w-sm rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger shadow-2xl"
        >
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-3 text-danger/70 hover:text-danger"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
