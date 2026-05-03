"use client";

import { useState, useEffect, useRef } from "react";
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
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setTimeout(() => inputRef.current?.focus(), 300);
      fetchInvitations();
    }
  }, [isOpen, workspaceId]);

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
      // silently fail - invitations list is non-critical
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

      // Refresh the invitations list
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
    // For now, remove from UI (revoke API can be added later)
    await new Promise((r) => setTimeout(r, 400));
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    setRevokingId(null);
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
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(0, 212, 170, 0); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .invite-shimmer {
          background: linear-gradient(90deg, transparent, rgba(79, 124, 255, 0.08), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s ease infinite;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          className={`relative w-full max-w-lg rounded-2xl overflow-hidden ${animClass}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            background:
              "linear-gradient(180deg, rgba(24, 24, 31, 0.98) 0%, rgba(17, 17, 24, 0.99) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(79, 124, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(79, 124, 255, 0.5), rgba(162, 89, 255, 0.5), transparent)",
            }}
          />

          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(79, 124, 255, 0.15), rgba(162, 89, 255, 0.15))",
                    border: "1px solid rgba(79, 124, 255, 0.2)",
                  }}
                >
                  <Mail className="w-[18px] h-[18px] text-[#4f7cff]" />
                </div>
                <div>
                  <h2
                    className="text-lg font-bold text-[#f0f0f5] tracking-tight"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    Invite People
                  </h2>
                  <p className="text-xs text-[#6b6b80] mt-0.5">to {workspaceName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6b80] hover:text-[#f0f0f5] hover:bg-white/[0.06] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="px-6 py-5">
            {!success ? (
              <form onSubmit={handleSendInvite} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#9090a8] mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80] pointer-events-none" />
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
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/[0.08] rounded-xl text-[#f0f0f5] text-sm placeholder-[#6b6b80] focus:outline-none focus:border-[#4f7cff]/50 focus:ring-1 focus:ring-[#4f7cff]/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#9090a8] mb-2">Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("member")}
                      className="relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background:
                          role === "member"
                            ? "linear-gradient(135deg, rgba(79, 124, 255, 0.12), rgba(79, 124, 255, 0.06))"
                            : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${role === "member" ? "rgba(79, 124, 255, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
                        color: role === "member" ? "#f0f0f5" : "#6b6b80",
                      }}
                    >
                      <User
                        className="w-4 h-4"
                        style={{
                          color: role === "member" ? "#4f7cff" : "#6b6b80",
                        }}
                      />
                      Member
                      {role === "member" && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#4f7cff]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("project_manager")}
                      className="relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background:
                          role === "project_manager"
                            ? "linear-gradient(135deg, rgba(255, 159, 67, 0.12), rgba(255, 159, 67, 0.06))"
                            : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${role === "project_manager" ? "rgba(255, 159, 67, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
                        color: role === "project_manager" ? "#f0f0f5" : "#6b6b80",
                      }}
                    >
                      <Shield
                        className="w-4 h-4"
                        style={{
                          color: role === "project_manager" ? "#ff9f43" : "#6b6b80",
                        }}
                      />
                      PM
                      {role === "project_manager" && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ff9f43]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className="relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background:
                          role === "admin"
                            ? "linear-gradient(135deg, rgba(162, 89, 255, 0.12), rgba(162, 89, 255, 0.06))"
                            : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${role === "admin" ? "rgba(162, 89, 255, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
                        color: role === "admin" ? "#f0f0f5" : "#6b6b80",
                      }}
                    >
                      <Shield
                        className="w-4 h-4"
                        style={{
                          color: role === "admin" ? "#a259ff" : "#6b6b80",
                        }}
                      />
                      Admin
                      {role === "admin" && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#a259ff]" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#6b6b80] mt-2">
                    {role === "member"
                      ? "Members can view projects and update task statuses."
                      : role === "project_manager"
                        ? "Project Managers can create/edit projects, tasks, and invite members."
                        : "Admins can manage members, settings, billing, and all projects."}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-500/[0.08] border border-red-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:
                      loading || !email
                        ? "rgba(79, 124, 255, 0.15)"
                        : "linear-gradient(135deg, #4f7cff, #6b93ff)",
                    color: "#fff",
                    border: "1px solid rgba(79, 124, 255, 0.3)",
                    boxShadow:
                      loading || !email
                        ? "none"
                        : "0 4px 16px rgba(79, 124, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  }}
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
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0, 212, 170, 0.12), rgba(0, 212, 170, 0.06))",
                    border: "1px solid rgba(0, 212, 170, 0.25)",
                    animation: "successPulse 2s ease infinite",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                    fill="none"
                    stroke="#00d4aa"
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
                  className="text-lg font-bold text-[#f0f0f5] mb-1"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Invitation Sent!
                </h3>
                <p className="text-sm text-[#6b6b80] mb-5">
                  Share this link with <span className="text-[#9090a8] font-medium">{email}</span>
                </p>

                <div
                  className="flex items-center gap-2 p-1 rounded-xl mb-5"
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 min-w-0">
                    <Link2 className="w-3.5 h-3.5 text-[#6b6b80] shrink-0" />
                    <span className="text-xs text-[#9090a8] truncate">{inviteLink}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-200"
                    style={{
                      background: copied ? "rgba(0, 212, 170, 0.15)" : "rgba(79, 124, 255, 0.15)",
                      color: copied ? "#00d4aa" : "#4f7cff",
                      border: `1px solid ${copied ? "rgba(0, 212, 170, 0.25)" : "rgba(79, 124, 255, 0.2)"}`,
                    }}
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
                  className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 text-sm font-medium text-[#9090a8] hover:text-[#f0f0f5] rounded-xl hover:bg-white/[0.04] transition-all duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Send another invite
                </button>
              </div>
            )}
          </div>

          {invitations.length > 0 && (
            <>
              <div className="h-px bg-white/[0.06]" />
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6b80]">
                    Pending Invitations
                  </h3>
                  <span className="text-[10px] font-medium text-[#6b6b80] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
                    {invitations.length}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {loadingInvitations ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6b6b80]" />
                    </div>
                  ) : (
                    invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                          style={{
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            color: "#6b6b80",
                          }}
                        >
                          {inv.email.split("@")[0].slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[#f0f0f5] truncate block">{inv.email}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] font-medium uppercase tracking-wider"
                              style={{
                                color: inv.role === "admin" ? "#a259ff" : "#4f7cff",
                              }}
                            >
                              {inv.role}
                            </span>
                            <span className="w-0.5 h-0.5 rounded-full bg-[#6b6b80]" />
                            <span className="text-[10px] text-[#6b6b80] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          disabled={revokingId === inv.id}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-[#6b6b80] hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 shrink-0 disabled:opacity-50"
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
