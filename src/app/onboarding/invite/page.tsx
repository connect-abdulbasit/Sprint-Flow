"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Plus, X, ChevronDown, Check, Loader2, AlertTriangle } from "lucide-react";
import type { WorkspaceRole } from "@/lib/auth/rbac";

const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "member", label: "Member" },
];

interface Invite {
  id: string;
  email: string;
  role: WorkspaceRole;
}

export default function InviteTeamPage() {
  return (
    <Suspense fallback={null}>
      <InviteTeamPageContent />
    </Suspense>
  );
}

function InviteTeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const workspaceName = searchParams.get("workspaceName") ?? "your workspace";

  const [invites, setInvites] = useState<Invite[]>([{ id: "1", email: "", role: "member" }]);
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    // AUD-014: this page has no meaning without a workspace to invite people into —
    // send anyone who lands here directly (e.g. a stale bookmark) back to step 1.
    if (!workspaceId) {
      router.replace("/onboarding/workspace");
    }
  }, [workspaceId, router]);

  const handleEmailChange = (id: string, email: string) => {
    setInvites(invites.map((inv) => (inv.id === id ? { ...inv, email } : inv)));
  };

  const handleRoleSelect = (id: string, role: WorkspaceRole) => {
    setInvites(invites.map((inv) => (inv.id === id ? { ...inv, role } : inv)));
    setOpenRoleDropdownId(null);
  };

  const addInviteRow = () => {
    setInvites([...invites, { id: Math.random().toString(), email: "", role: "member" }]);
  };

  const removeInviteRow = (id: string) => {
    if (invites.length > 1) {
      setInvites(invites.filter((inv) => inv.id !== id));
    }
  };

  const goToDashboard = () => {
    router.push(`/workspace/${workspaceId}/dashboard`);
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    const toSend = invites
      .map((inv) => ({ ...inv, email: inv.email.trim() }))
      .filter((inv) => inv.email !== "");

    if (toSend.length === 0) {
      goToDashboard();
      return;
    }

    setSending(true);
    setSendError(null);

    // AUD-014: this previously called router.push("/dashboard") and never sent a single
    // invite, despite the button claiming "Send N Invites". Every entered email is now
    // actually POSTed to the real invite endpoint before moving on.
    const results = await Promise.allSettled(
      toSend.map((inv) =>
        fetch(`/api/workspaces/${workspaceId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inv.email, role: inv.role }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Failed to invite ${inv.email}`);
          }
        })
      )
    );

    const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    setSending(false);

    if (failures.length > 0) {
      setSendError(
        failures.length === toSend.length
          ? "Could not send any invitations. Please try again."
          : `${toSend.length - failures.length} of ${toSend.length} invitations sent. Some failed: ${failures.map((f) => (f.reason as Error).message).join("; ")}`
      );
      if (failures.length === toSend.length) return;
    }

    goToDashboard();
  };

  const activeInvitesCount = invites.filter((inv) => inv.email.trim() !== "").length;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center animate-fade-up">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-surface-2 border border-border-strong text-xs font-semibold tracking-wide text-muted2 uppercase mx-auto">
          Step 2 of 3
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-2xl border border-border-strong overflow-hidden w-full p-8 md:p-12 relative">
        {/* Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-14 w-14 bg-surface-2 text-accent rounded-2xl flex items-center justify-center mb-6 border border-border-strong shadow-sm transform rotate-3">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-fg mb-3 font-syne">
            Invite Your Team
          </h1>
          <p className="text-muted2 text-sm leading-relaxed max-w-md mx-auto">
            Sprint Flow works best when everyone is aligned. Add teammates to{" "}
            <span className="text-fg font-medium">{workspaceName}</span> to start collaborating
            instantly.
          </p>
        </div>

        <form onSubmit={handleSendInvites} className="space-y-4">
          <div className="space-y-3">
            <div className="flex font-medium text-xs text-muted2 px-1 mb-2">
              <div className="flex-1">Email Address</div>
              <div className="w-40">Role</div>
              <div className="w-8"></div>
            </div>

            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3">
                {/* Email Input */}
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={invite.email}
                    onChange={(e) => handleEmailChange(invite.id, e.target.value)}
                    disabled={sending}
                    className="w-full bg-surface-2 border border-border-strong hover:border-accent/50 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 text-sm text-fg placeholder:text-muted outline-none transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                {/* Custom Role Dropdown */}
                <div className="relative w-40">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRoleDropdownId(openRoleDropdownId === invite.id ? null : invite.id)
                    }
                    disabled={sending}
                    className="w-full flex items-center justify-between bg-surface-2 border border-border-strong hover:border-accent/50 rounded-xl px-4 py-3 text-sm font-medium text-fg outline-none transition-all duration-200 disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.find((r) => r.value === invite.role)?.label}
                    <ChevronDown className="h-4 w-4 text-muted" />
                  </button>

                  {/* Dropdown Menu */}
                  {openRoleDropdownId === invite.id && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-2 border border-border-strong rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                      {ROLE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleRoleSelect(invite.id, option.value)}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-surface-hover transition-colors"
                        >
                          <span
                            className={
                              invite.role === option.value ? "font-semibold text-fg" : "text-muted2"
                            }
                          >
                            {option.label}
                          </span>
                          {invite.role === option.value && (
                            <Check className="h-4 w-4 text-accent" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeInviteRow(invite.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  disabled={invites.length === 1 || sending}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Another Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={addInviteRow}
              disabled={sending}
              className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent2 py-2 px-1 transition-colors disabled:opacity-50"
            >
              <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </div>
              Add another
            </button>
          </div>

          {sendError && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-danger/[0.08] border border-danger/20">
              <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{sendError}</p>
            </div>
          )}

          <hr className="border-border-strong my-8" />

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={goToDashboard}
              disabled={sending}
              className="text-sm font-medium text-muted2 hover:text-fg px-4 py-2 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={sending}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed ${
                activeInvitesCount > 0
                  ? "bg-accent hover:opacity-90 text-white shadow-[0_2px_10px_var(--color-accent-soft)] hover:shadow-[0_4px_15px_var(--color-accent-soft)] transform hover:-translate-y-0.5 disabled:opacity-60"
                  : "bg-surface-2 text-fg border border-border-strong hover:bg-surface-hover"
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : activeInvitesCount > 0 ? (
                `Send ${activeInvitesCount} Invite${activeInvitesCount === 1 ? "" : "s"}`
              ) : (
                "Continue without Invites"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Click outside to close dropdowns handler overlay (simplified) */}
      {openRoleDropdownId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenRoleDropdownId(null)} />
      )}
    </div>
  );
}
