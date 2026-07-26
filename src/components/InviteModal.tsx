"use client";

import { useState, useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  X,
  Mail,
  Send,
  Check,
  Copy,
  Link2,
  Shield,
  User,
  Clock,
  Trash2,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  invitedByName: string | null;
};

type InviteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
};

function extractItems<T>(payload: T[] | { items?: T[] }) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
}

export default function InviteModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "project_manager" | "admin">("member");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState("");
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setTimeout(() => inputRef.current?.focus(), 300);
      fetchInvitations();
    }
  }, [isOpen, workspaceId]);

  // AUD-015 / AUD-056: this modal previously had no Escape-to-close handler at all.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const fetchInvitations = async () => {
    if (!workspaceId) return;
    setLoadingInvitations(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`);
      if (res.ok) {
        const data = extractItems<Invitation>(await res.json());
        setInvitations(data);
      }
    } catch {
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setEmail("");
      setRole("member");
      setSuccess(false);
      setInviteLink("");
      setError("");
      setRevokeError("");
      setCopied(false);
      setClosing(false);
    }, 200);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invitation.");
        setLoading(false);
        return;
      }

      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      setSuccess(true);

      if (data.alreadyPending) {
        setError(
          "An invitation was already pending for this email. The existing link has been shown."
        );
      }

      fetchInvitations();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    setRevokeError("");
    try {
      // AUD-011: this previously just faked a delay and removed the row from local
      // state — the token stayed valid server-side. It now calls the real revoke
      // endpoint, and only updates the UI once the invite is actually unusable.
      const res = await fetch(`/api/workspaces/${workspaceId}/invites/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to revoke invitation.");
      }
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e) {
      setRevokeError(e instanceof Error ? e.message : "Failed to revoke invitation.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleSendAnother = () => {
    setEmail("");
    setSuccess(false);
    setInviteLink("");
    setCopied(false);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!isOpen) return null;

  const animClass = closing
    ? "animate-[modalOut_0.2s_ease_forwards]"
    : "animate-[modalIn_0.3s_ease_forwards]";

  const backdropClass = closing
    ? "animate-[fadeOut_0.2s_ease_forwards]"
    : "animate-[fadeIn_0.2s_ease_forwards]";

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-success) 40%, transparent); }
          50% { box-shadow: 0 0 0 12px color-mix(in srgb, var(--color-success) 0%, transparent); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .invite-shimmer {
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s ease infinite;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-overlay backdrop-blur-sm" />

        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
          className={`relative w-full max-w-lg rounded-2xl overflow-hidden bg-surface border border-border shadow-xl ${animClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-accent-soft border border-accent/20">
                  <Mail className="w-[18px] h-[18px] text-accent" />
                </div>
                <div>
                  <h2
                    id="invite-modal-title"
                    className="text-lg font-bold text-fg tracking-tight"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    Invite People
                  </h2>
                  <p className="text-xs text-muted mt-0.5">to {workspaceName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-hover-strong transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="px-6 py-5">
            {!success ? (
              <form onSubmit={handleSendInvite} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-muted2 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="colleague@company.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-surface-sunken border border-border rounded-xl text-fg text-sm placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-muted2 mb-2">Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("member")}
                      className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        role === "member"
                          ? "bg-accent-soft border border-accent/30 text-fg"
                          : "bg-hover border border-border text-muted"
                      }`}
                    >
                      <User
                        className={`w-4 h-4 ${role === "member" ? "text-accent" : "text-muted"}`}
                      />
                      Member
                      {role === "member" && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("project_manager")}
                      className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        role === "project_manager"
                          ? "bg-warning-soft border border-warning/30 text-fg"
                          : "bg-hover border border-border text-muted"
                      }`}
                    >
                      <Shield
                        className={`w-4 h-4 ${
                          role === "project_manager" ? "text-warning" : "text-muted"
                        }`}
                      />
                      PM
                      {role === "project_manager" && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-warning" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        role === "admin"
                          ? "bg-[color-mix(in_srgb,var(--color-accent2)_12%,transparent)] border border-accent2/30 text-fg"
                          : "bg-hover border border-border text-muted"
                      }`}
                    >
                      <Shield
                        className={`w-4 h-4 ${role === "admin" ? "text-accent2" : "text-muted"}`}
                      />
                      Admin
                      {role === "admin" && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent2" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted mt-2">
                    {role === "member"
                      ? "Members can view projects and update task statuses."
                      : role === "project_manager"
                        ? "Project Managers can create/edit projects, tasks, and invite members."
                        : "Admins can manage members, settings, billing, and all projects."}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-danger-soft border border-danger/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0" />
                    <p className="text-xs text-danger">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-accent to-accent-strong text-white border border-accent/30 hover:opacity-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending invitation…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-2">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5 bg-success-soft border border-success/25"
                  style={{
                    animation: "successPulse 2s ease infinite",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                    fill="none"
                    stroke="var(--color-success)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline
                      points="20 6 9 17 4 12"
                      style={{
                        strokeDasharray: 24,
                        animation: "checkDraw 0.4s 0.2s ease forwards",
                        strokeDashoffset: 24,
                      }}
                    />
                  </svg>
                </div>

                <h3
                  className="text-lg font-bold text-fg mb-1"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Invitation Sent!
                </h3>
                <p className="text-sm text-muted mb-5">
                  Share this link with <span className="text-muted2 font-medium">{email}</span>
                </p>

                <div className="flex items-center gap-2 p-1 rounded-xl mb-5 bg-surface-sunken border border-border">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 min-w-0">
                    <Link2 className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="text-xs text-muted2 truncate">{inviteLink}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-200 border ${
                      copied
                        ? "bg-success-soft text-success border-success/25"
                        : "bg-accent-soft text-accent border-accent/20"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleSendAnother}
                  className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 text-sm font-medium text-muted2 hover:text-fg rounded-xl hover:bg-hover transition-all duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Send another invite
                </button>
              </div>
            )}
          </div>

          {invitations.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Pending Invitations
                  </h3>
                  <span className="text-[10px] font-medium text-muted bg-hover border border-border px-2 py-0.5 rounded-md">
                    {invitations.length}
                  </span>
                </div>
                {revokeError && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-danger-soft border border-danger/20 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0" />
                    <p className="text-xs text-danger">{revokeError}</p>
                  </div>
                )}
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {loadingInvitations ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    </div>
                  ) : (
                    invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-hover transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold bg-hover border border-border text-muted">
                          {inv.email.split("@")[0].slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-fg truncate block">{inv.email}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wider ${
                                inv.role === "admin" ? "text-accent2" : "text-accent"
                              }`}
                            >
                              {inv.role}
                            </span>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted" />
                            <span className="text-[10px] text-muted flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          disabled={revokingId === inv.id}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft transition-all duration-200 shrink-0 disabled:opacity-50"
                          title="Revoke invitation"
                        >
                          {revokingId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
