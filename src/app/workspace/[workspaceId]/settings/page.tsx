"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2,
  X,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

export default function WorkspaceSettings() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    loadData();
  }, [workspaceId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDirty) {
        cancelChanges();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDirty]);

  const loadData = async () => {
    if (workspaceId === "default") {
      setError("No workspace selected");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error ?? "Workspace not found");
        return;
      }
      const data = await res.json();
      setWorkspace(data);
      setEditName(data.name ?? "");
      setEditDesc(data.description ?? "");
    } catch {
      setError("Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const saveWorkspace = async () => {
    if (!editName.trim()) {
      setToast({ message: "Workspace name is required", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkspace(updated);
        setIsDirty(false);
        setToast({ message: "Workspace saved successfully", type: "success" });
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast({
          message: errData.error ?? "Failed to save workspace",
          type: "error",
        });
      }
    } catch {
      setToast({ message: "Failed to save workspace", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (!workspace) return;
    setEditName(workspace.name);
    setEditDesc(workspace.description ?? "");
    setIsDirty(false);
  };

  const deleteWorkspace = async () => {
    try {
      await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      router.push("/organizations");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] rounded-full animate-spin mb-4" />
        <p className="text-sm text-[var(--color-muted)] font-medium">
          Loading settings...
        </p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#f0f0f5] mb-2">
          Workspace Not Found
        </h2>
        <p className="text-sm text-[var(--color-muted)] max-w-xs mb-8">
          {error ?? "The workspace could not be loaded."}
        </p>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)]"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 pb-12 px-8 max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors w-fit"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          All organizations
        </Link>

        {/* Header */}
        <div className="border-l-2 border-l-[var(--color-accent)] pl-4">
          <h1
            className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#f0f0f5]"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Workspace Settings
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage {workspace.name}
          </p>
        </div>

        {/* Update Section */}
        <div className="bg-[var(--color-surface)] border border-white/[0.06] border-t-2 border-t-[var(--color-accent)] rounded-2xl p-6 md:p-8 space-y-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            <div>
              <h2 className="text-[15px] font-semibold text-[#f0f0f5]">
                Update Workspace
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Edit your workspace name and description
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                Name
              </label>
              <input
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f5] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all"
                placeholder="Workspace name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => {
                  setEditDesc(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all resize-none"
                rows={3}
                placeholder="Workspace description..."
              />
            </div>
          </div>

          {isDirty && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={cancelChanges}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--color-muted)] bg-transparent border border-white/10 rounded-xl hover:bg-white/5 hover:text-[#f0f0f5] transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveWorkspace}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(79,124,255,0.3)]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-[var(--color-surface)] border border-white/[0.06] border-t-2 border-t-red-500/50 rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[15px] font-semibold text-red-400">
                Danger Zone
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-1 max-w-sm">
                Once you delete a workspace, there is no going back. This action
                cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="relative w-full max-w-md bg-[var(--color-surface)] border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-[#f0f0f5] text-center mb-2">
              Delete Workspace
            </h3>
            <p className="text-sm text-[var(--color-muted)] text-center mb-8 leading-relaxed">
              This action cannot be undone. This will permanently delete the
              workspace and all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-2.5 text-sm font-semibold text-[var(--color-muted)] bg-[var(--color-surface2)] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteWorkspace}
                className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-red-500/90 hover:bg-red-500 rounded-xl transition-all"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[1001] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm transition-all"
          style={{
            backgroundColor:
              toast.type === "success"
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
            borderColor:
              toast.type === "success"
                ? "rgba(34, 197, 94, 0.25)"
                : "rgba(239, 68, 68, 0.25)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span
            className={`text-sm font-semibold ${toast.type === "success" ? "text-green-300" : "text-red-300"}`}
          >
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X
              className={`w-3.5 h-3.5 ${toast.type === "success" ? "text-green-400" : "text-red-400"}`}
            />
          </button>
        </div>
      )}
    </>
  );
}

