"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase,
  User,
  Shield,
  Check,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock,
  XCircle,
  X,
} from "lucide-react";
import { InviteCardSkeleton } from "@/components/ui/skeleton";

type InvitationData = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  workspaceName: string;
  workspaceId: string;
  organizationId: string;
  organizationName: string;
  invitedByName: string;
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<
    "expired" | "not_found" | "auth" | "email_mismatch" | "general"
  >("general");

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();

        if (!res.ok) {
          // AUD-066: previously fell through to a generic dead-end error instead of
          // prompting sign-in, even though the accept-click path already handled this
          // correctly with a callbackUrl redirect.
          if (res.status === 401) {
            router.push(`/signin?callbackUrl=/invite/${token}`);
            return;
          }
          setErrorType(res.status === 404 ? "not_found" : "general");
          setError(data.error || "This invitation could not be loaded.");
          setLoading(false);
          return;
        }

        if (data.status === "expired") {
          setErrorType("expired");
          setError("This invitation has expired. Please ask for a new one.");
          setLoading(false);
          return;
        }

        if (data.status === "accepted") {
          setErrorType("general");
          setError("This invitation has already been accepted.");
          setLoading(false);
          return;
        }

        if (data.status === "declined") {
          setErrorType("general");
          setError("This invitation has been declined.");
          setLoading(false);
          return;
        }

        if (data.status === "revoked") {
          setErrorType("general");
          setError("This invitation has been revoked by a workspace admin.");
          setLoading(false);
          return;
        }

        setInvitation(data);
      } catch {
        setError("Network error. Please check your connection and try again.");
        setErrorType("general");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvitation();
    }
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");

    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/signin?callbackUrl=/invite/${token}`);
          return;
        }
        if (data.errorType === "email_mismatch") {
          setErrorType("email_mismatch");
        }
        setError(data.error || "Failed to accept invitation.");
        setAccepting(false);
        return;
      }

      setAccepted(true);

      setTimeout(() => {
        router.push(`/workspace/${data.workspaceId ?? invitation?.workspaceId}/dashboard`);
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setError("");

    try {
      const res = await fetch(`/api/invites/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/signin?callbackUrl=/invite/${token}`);
          return;
        }
        setError(data.error || "Failed to decline invitation.");
        setRejecting(false);
        return;
      }

      setRejected(true);
    } catch {
      setError("Network error. Please try again.");
      setRejecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-fg flex items-center justify-center p-6">
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, color-mix(in srgb, var(--color-accent2) 3%, transparent) 40%, transparent 70%)",
        }}
      />

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes acceptPulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-success) 30%, transparent); }
          50% { box-shadow: 0 0 0 16px transparent; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkScale {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="relative w-full max-w-md" style={{ animation: "cardIn 0.5s ease forwards" }}>
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent2)] flex items-center justify-center text-sm font-black text-white shadow-[0_0_24px_var(--color-accent-soft)]">
            SF
          </div>
          <span
            className="text-xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            SprintFlow
          </span>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%)",
            border: "1px solid var(--color-border)",
            boxShadow:
              "var(--shadow-xl), 0 0 0 1px var(--color-accent-soft), inset 0 1px 0 var(--color-border)",
          }}
        >
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 10%, var(--color-accent) 30%, var(--color-accent2) 70%, transparent 90%)",
            }}
          />

          <div className="p-8">
            {loading ? (
              <InviteCardSkeleton />
            ) : error && !invitation ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
                  }}
                >
                  {errorType === "not_found" || errorType === "expired" ? (
                    <XCircle className="w-6 h-6 text-danger" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-warning" />
                  )}
                </div>
                <h2
                  className="text-xl font-bold text-fg mb-2"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {errorType === "not_found"
                    ? "Invitation Not Found"
                    : errorType === "expired"
                      ? "Invitation Expired"
                      : "Invitation Unavailable"}
                </h2>
                <p className="text-sm text-muted mb-6 max-w-[280px]">{error}</p>
                <Link
                  href="/organizations"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-accent rounded-xl bg-accent/[0.08] border border-accent/20 hover:bg-accent/[0.12] transition-all duration-200 no-underline"
                >
                  Go to Organizations
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : rejected ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
                  }}
                >
                  <X className="w-7 h-7 text-danger" />
                </div>
                <h2
                  className="text-xl font-bold text-fg mb-2"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Invitation Declined
                </h2>
                <p className="text-sm text-muted mb-1">
                  You&apos;ve declined the invitation to{" "}
                  <span className="text-fg font-medium">{invitation?.workspaceName}</span>
                </p>
                <Link
                  href="/organizations"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-muted2 rounded-xl hover:bg-hover transition-all duration-200 no-underline mt-4"
                >
                  Go to Organizations
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : accepted ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--color-success) 12%, transparent), color-mix(in srgb, var(--color-success) 6%, transparent))",
                    border: "1px solid color-mix(in srgb, var(--color-success) 25%, transparent)",
                    animation: "acceptPulse 2s ease infinite",
                  }}
                >
                  <Check
                    className="w-7 h-7 text-success"
                    style={{ animation: "checkScale 0.4s ease forwards" }}
                  />
                </div>
                <h2
                  className="text-xl font-bold text-fg mb-2"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Welcome aboard!
                </h2>
                <p className="text-sm text-muted mb-1">
                  You&apos;re now a member of{" "}
                  <span className="text-fg font-medium">{invitation?.workspaceName}</span>
                </p>
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Redirecting you now…
                </p>
              </div>
            ) : invitation ? (
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold text-fg mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), color-mix(in srgb, var(--color-accent2) 8%, transparent))",
                    border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  }}
                >
                  {invitation.workspaceName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <h2
                  className="text-xl font-bold text-fg mb-1"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  You&apos;re invited!
                </h2>
                <p className="text-sm text-muted mb-6">
                  <span className="text-muted2 font-medium">{invitation.invitedByName}</span> has
                  invited you to join
                </p>

                <div
                  className="rounded-xl p-4 mb-6"
                  style={{
                    background: "var(--color-hover)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Briefcase className="w-4 h-4 text-accent" />
                    <h3 className="text-lg font-bold text-fg">{invitation.workspaceName}</h3>
                  </div>
                  <p className="text-xs text-muted2 mb-3">
                    Organization:{" "}
                    <span className="text-fg font-medium">{invitation.organizationName}</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      {invitation.role === "admin" ? (
                        <Shield className="w-3.5 h-3.5 text-accent2" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span
                        className="font-medium uppercase tracking-wider text-[10px]"
                        style={{
                          color:
                            invitation.role === "admin"
                              ? "var(--color-accent2)"
                              : "var(--color-accent)",
                        }}
                      >
                        {invitation.role}
                      </span>
                    </span>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted" />
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mb-5 text-left"
                    style={{
                      background: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
                    <p className="text-xs text-danger">{error}</p>
                  </div>
                )}

                {/* Accept Button */}
                <button
                  onClick={handleAccept}
                  disabled={accepting || rejecting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 mb-3"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))",
                    color: "white",
                    border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
                    boxShadow:
                      "0 4px 24px color-mix(in srgb, var(--color-accent) 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Accept Invitation
                    </>
                  )}
                </button>

                {/* Reject Button */}
                <button
                  onClick={handleReject}
                  disabled={accepting || rejecting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-60 text-muted2 hover:text-danger hover:bg-danger/[0.06] border border-transparent hover:border-danger/20"
                >
                  {rejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Declining…
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Reject Invitation
                    </>
                  )}
                </button>

                <p className="text-[11px] text-muted mt-4">
                  By accepting, you&apos;ll join as a{" "}
                  <span
                    className="font-medium"
                    style={{
                      color:
                        invitation.role === "admin"
                          ? "var(--color-accent2)"
                          : "var(--color-accent)",
                    }}
                  >
                    {invitation.role}
                  </span>
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted mt-6">
          Powered by <span className="font-semibold text-muted2">SprintFlow</span>
        </p>
      </div>
    </div>
  );
}
