"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DeleteConfirmDialog from "@/components/project/DeleteConfirmDialog";
import {
  Trash2,
  X,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Settings,
  ShieldAlert,
  Info,
} from "lucide-react";
import { SettingsFormSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

export default function WorkspaceSettings() {
  const params = useParams();
  const router = useRouter();
  const workspaceIdRaw = params.workspaceId;
  const workspaceId =
    typeof workspaceIdRaw === "string" ? workspaceIdRaw : (workspaceIdRaw?.[0] ?? "");
  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(workspaceId);
  const canManageWorkspace = !roleLoading && hasRole("admin");

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"general" | "danger">("general");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const sections = {
    general: useRef<HTMLDivElement>(null),
    danger: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!workspaceId) return;
    void loadData();
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

  const scrollToSection = (id: keyof typeof sections) => {
    setActiveSection(id);
    sections[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#09090b] min-h-0">
        <header className="shrink-0 border-b border-white/[0.04] px-6 lg:px-10 py-6 bg-[#0c0c0f]/60 backdrop-blur-xl">
          <Link
            href={`/workspace/${workspaceId}/dashboard`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Back to workspace
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Settings</h1>
              <Skeleton className="mt-2 h-[13px] w-48 max-w-full rounded" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <aside className="w-[280px] shrink-0 border-r border-white/[0.04] bg-[#0c0c0f]/40 hidden lg:flex flex-col p-6">
            <div className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-3">
                Workspace
              </h2>
              <nav className="space-y-1">
                {[
                  { id: "general" as const, label: "General", icon: Settings },
                  { id: "danger" as const, label: "Danger Zone", icon: ShieldAlert, danger: true },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium ${
                      item.id === "general" ? "bg-white/[0.06] text-white" : "text-zinc-500"
                    } ${item.danger && item.id === "danger" ? "" : ""}`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${
                        item.id === "general"
                          ? item.danger
                            ? "text-red-400"
                            : "text-blue-400"
                          : "text-zinc-600"
                      }`}
                    />
                    {item.label}
                  </div>
                ))}
              </nav>
            </div>

            <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/[0.04]">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Info className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tip</span>
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Workspace settings apply to all projects in this space.
              </p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
            <SettingsFormSkeleton variant="workspace" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col h-full bg-[#09090b] items-center justify-center min-h-[50vh] text-center px-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Workspace not found</h2>
        <p className="text-sm text-zinc-500 max-w-xs mb-8">
          {error ?? "The workspace could not be loaded."}
        </p>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b] min-h-0">
      <header className="shrink-0 border-b border-white/[0.04] px-6 lg:px-10 py-6 bg-[#0c0c0f]/60 backdrop-blur-xl">
        <Link
          href={`/workspace/${workspaceId}/dashboard`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Back to workspace
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Settings</h1>
            <p className="mt-1 text-[13px] text-zinc-500">{workspace.name}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <aside className="w-[280px] shrink-0 border-r border-white/[0.04] bg-[#0c0c0f]/40 hidden lg:flex flex-col p-6">
          <div className="mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-3">
              Workspace
            </h2>
            <nav className="space-y-1">
              {[
                { id: "general" as const, label: "General", icon: Settings },
                ...(canManageWorkspace
                  ? [
                      {
                        id: "danger" as const,
                        label: "Danger Zone",
                        icon: ShieldAlert,
                        danger: true,
                      },
                    ]
                  : []),
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                    activeSection === item.id
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                  } ${item.danger && activeSection === item.id ? "text-red-400" : ""}`}
                >
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      activeSection === item.id
                        ? item.danger
                          ? "text-red-400"
                          : "text-blue-400"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  />
                  {item.label}
                  {activeSection === item.id && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-current opacity-60" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/[0.04]">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Tip</span>
            </div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Workspace settings apply to all projects in this space.
            </p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
          <div className="max-w-4xl mx-auto space-y-16 pb-24">
            <section ref={sections.general} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">General</h2>
                  <p className="text-[14px] text-zinc-500 mt-1">
                    Name and description for this workspace.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-semibold text-zinc-200">Details</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Shown to members across the workspace.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                      Workspace name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => {
                        if (!canManageWorkspace) return;
                        setEditName(e.target.value);
                        setIsDirty(true);
                      }}
                      readOnly={!canManageWorkspace}
                      className="w-full bg-[#0f0f12] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="Workspace name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                      Description
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => {
                        if (!canManageWorkspace) return;
                        setEditDesc(e.target.value);
                        setIsDirty(true);
                      }}
                      readOnly={!canManageWorkspace}
                      rows={4}
                      className="w-full bg-[#0f0f12] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none leading-relaxed"
                      placeholder="What is this workspace for?"
                    />
                  </div>
                  {!canManageWorkspace && (
                    <p className="text-[12px] text-zinc-500">
                      Only workspace admins can update these settings.
                    </p>
                  )}
                  {isDirty && canManageWorkspace && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelChanges}
                        className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-zinc-400 bg-transparent border border-white/10 rounded-xl hover:bg-white/[0.04] hover:text-zinc-200 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveWorkspace()}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 text-[13px] font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Save changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {canManageWorkspace && (
              <section ref={sections.danger} className="space-y-8 pt-8">
                <div className="border-b border-red-500/10 pb-6 text-red-400">
                  <h2 className="text-2xl font-bold tracking-tight">Danger Zone</h2>
                  <p className="text-[14px] text-red-500/60 mt-1">
                    Actions here are permanent and cannot be undone.
                  </p>
                </div>

                <div className="p-8 rounded-2xl bg-red-500/[0.03] border border-red-500/10 flex flex-col md:flex-row items-center gap-8 shadow-[0_0_30px_rgba(239,68,68,0.02)]">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-[16px] font-bold text-red-400 mb-2">
                      Delete this workspace
                    </h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">
                      Permanently remove this workspace and its projects. This action is{" "}
                      <span className="text-red-400/80 font-bold italic">irreversible</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteDialogOpen(true);
                    }}
                    className="shrink-0 px-6 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[13px] font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete workspace
                  </button>
                </div>
              </section>
            )}

            <div className="h-20" />
          </div>
        </main>
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        nameToConfirm={workspace.name}
        resourceLabel="workspace"
        error={deleteError}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={async () => {
          try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? "Failed to delete workspace");
            }
            setDeleteError(null);
            router.push("/organizations");
            router.refresh();
          } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to delete workspace";
            setDeleteError(message);
            throw e;
          }
        }}
      />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[1002] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm transition-all cursor-default"
          style={{
            backgroundColor:
              toast.type === "success" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
            borderColor:
              toast.type === "success" ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)",
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
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X
              className={`w-3.5 h-3.5 ${toast.type === "success" ? "text-green-400" : "text-red-400"}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
