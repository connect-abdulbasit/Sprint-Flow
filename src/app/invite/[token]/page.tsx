"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  User,
  Shield,
  Check,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react";

type InvitationData = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  organizationName: string;
  organizationId: string;
  invitedByName: string;
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<
    "expired" | "not_found" | "auth" | "email_mismatch" | "general"
  >("general");

  useEffect(() => {
    const loadMockInvitation = async () => {
      await new Promise((r) => setTimeout(r, 600));
      setInvitation({
        id: "mock-inv-1",
        email: "colleague@company.com",
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        organizationName: "Acme Corporation",
        organizationId: "org-1",
        invitedByName: "Abdul Basit",
      });
      setLoading(false);
    };
    loadMockInvitation();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");

    await new Promise((r) => setTimeout(r, 1000));
    setAccepted(true);

    setTimeout(() => {
      window.location.href = `/organization/${invitation?.organizationId ?? "org-1"}`;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[#f0f0f5] flex items-center justify-center p-6">
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(79, 124, 255, 0.06) 0%, rgba(162, 89, 255, 0.03) 40%, transparent 70%)",
        }}
      />

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes acceptPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.3); }
          50% { box-shadow: 0 0 0 16px rgba(0, 212, 170, 0); }
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent2)] flex items-center justify-center text-sm font-black text-white shadow-[0_0_24px_rgba(79,124,255,0.25)]">
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
              "linear-gradient(180deg, rgba(24, 24, 31, 0.98) 0%, rgba(17, 17, 24, 0.99) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(79, 124, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          }}
        >
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 10%, #4f7cff 30%, #a259ff 70%, transparent 90%)",
            }}
          />

          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#4f7cff] mb-4" />
                <p className="text-sm text-[#6b6b80]">Loading invitation…</p>
              </div>
            ) : error && !invitation ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(255, 100, 100, 0.08)",
                    border: "1px solid rgba(255, 100, 100, 0.2)",
                  }}
                >
                  {errorType === "not_found" ? (
                    <XCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <h2
                  className="text-xl font-bold text-[#f0f0f5] mb-2"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {errorType === "not_found" ? "Invitation Not Found" : "Invitation Unavailable"}
                </h2>
                <p className="text-sm text-[#6b6b80] mb-6 max-w-[280px]">{error}</p>
                <Link
                  href="/organizations"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#4f7cff] rounded-xl bg-[#4f7cff]/[0.08] border border-[#4f7cff]/20 hover:bg-[#4f7cff]/[0.12] transition-all duration-200 no-underline"
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
                      "linear-gradient(135deg, rgba(0, 212, 170, 0.12), rgba(0, 212, 170, 0.06))",
                    border: "1px solid rgba(0, 212, 170, 0.25)",
                    animation: "acceptPulse 2s ease infinite",
                  }}
                >
                  <Check
                    className="w-7 h-7 text-[#00d4aa]"
                    style={{ animation: "checkScale 0.4s ease forwards" }}
                  />
                </div>
                <h2
                  className="text-xl font-bold text-[#f0f0f5] mb-2"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Welcome aboard!
                </h2>
                <p className="text-sm text-[#6b6b80] mb-1">
                  You&apos;re now a member of{" "}
                  <span className="text-[#f0f0f5] font-medium">{invitation?.organizationName}</span>
                </p>
                <p className="text-xs text-[#6b6b80] flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Redirecting you now…
                </p>
              </div>
            ) : invitation ? (
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold text-[#f0f0f5] mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(79, 124, 255, 0.12), rgba(162, 89, 255, 0.08))",
                    border: "1px solid rgba(79, 124, 255, 0.2)",
                  }}
                >
                  {invitation.organizationName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <h2
                  className="text-xl font-bold text-[#f0f0f5] mb-1"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  You&apos;re invited!
                </h2>
                <p className="text-sm text-[#6b6b80] mb-6">
                  <span className="text-[#9090a8] font-medium">{invitation.invitedByName}</span> has
                  invited you to join
                </p>

                <div
                  className="rounded-xl p-4 mb-6"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Building2 className="w-4 h-4 text-[#4f7cff]" />
                    <h3 className="text-lg font-bold text-[#f0f0f5]">
                      {invitation.organizationName}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-[#6b6b80]">
                    <span className="flex items-center gap-1.5">
                      {invitation.role === "admin" ? (
                        <Shield className="w-3.5 h-3.5 text-[#a259ff]" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-[#4f7cff]" />
                      )}
                      <span
                        className="font-medium uppercase tracking-wider text-[10px]"
                        style={{
                          color: invitation.role === "admin" ? "#a259ff" : "#4f7cff",
                        }}
                      >
                        {invitation.role}
                      </span>
                    </span>
                    <span className="w-0.5 h-0.5 rounded-full bg-[#6b6b80]" />
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
                      background:
                        errorType === "email_mismatch"
                          ? "rgba(255, 180, 50, 0.08)"
                          : "rgba(255, 100, 100, 0.08)",
                      border: `1px solid ${
                        errorType === "email_mismatch"
                          ? "rgba(255, 180, 50, 0.2)"
                          : "rgba(255, 100, 100, 0.2)"
                      }`,
                    }}
                  >
                    <AlertTriangle
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: errorType === "email_mismatch" ? "#ffb432" : "#ff6464",
                      }}
                    />
                    <p
                      className="text-xs"
                      style={{
                        color: errorType === "email_mismatch" ? "#ffcc66" : "#ff8888",
                      }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #4f7cff, #6b93ff)",
                    color: "#fff",
                    border: "1px solid rgba(79, 124, 255, 0.3)",
                    boxShadow:
                      "0 4px 24px rgba(79, 124, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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

                <p className="text-[11px] text-[#6b6b80] mt-4">
                  By accepting, you&apos;ll join as a{" "}
                  <span
                    className="font-medium"
                    style={{
                      color: invitation.role === "admin" ? "#a259ff" : "#4f7cff",
                    }}
                  >
                    {invitation.role}
                  </span>
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#6b6b80] mt-6">
          Powered by <span className="font-semibold text-[#9090a8]">SprintFlow</span>
        </p>
      </div>
    </div>
  );
}
