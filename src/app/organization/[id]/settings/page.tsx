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

interface Organization {
  id: string;
  name: string;
  description: string | null;
}

export default function OrganizationSettings() {
  const params = useParams();
  const router = useRouter();
  const orgIdRaw = params.id;
  const orgId = typeof orgIdRaw === "string" ? orgIdRaw : (orgIdRaw?.[0] ?? "");

  const [organization, setOrganization] = useState<Organization | null>(null);
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
    if (!orgId) return;
    void loadData();
  }, [orgId]);

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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error ?? "Organization not found");
        return;
      }
      const data = await res.json();
      setOrganization(data);
      setEditName(data.name ?? "");
      setEditDesc(data.description ?? "");
    } catch {
      setError("Failed to load organization");
    } finally {
      setLoading(false);
    }
  };

  const saveOrganization = async () => {
    if (!editName.trim()) {
      setToast({ message: "Organization name is required", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrganization(updated);
        setIsDirty(false);
        setToast({ message: "Organization saved successfully", type: "success" });
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast({
          message: errData.error ?? "Failed to save organization",
          type: "error",
        });
      }
    } catch {
      setToast({ message: "Failed to save organization", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (!organization) return;
    setEditName(organization.name);
    setEditDesc(organization.description ?? "");
    setIsDirty(false);
  };

  const scrollToSection = (id: keyof typeof sections) => {
    setActiveSection(id);
    sections[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-surface-sunken min-h-0">
        <header className="shrink-0 border-b border-border px-6 lg:px-10 py-5 bg-surface-sunken/60 backdrop-blur-xl">
          <Link
            href="/organizations"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:text-accent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            All organizations
          </Link>
          <h1 className="text-xl font-bold text-fg tracking-tight mt-3">Organization settings</h1>
          <Skeleton className="mt-2 h-[13px] w-48 max-w-full rounded" />
        </header>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <aside className="w-[280px] shrink-0 border-r border-border bg-surface-sunken/40 hidden lg:flex flex-col p-6">
            <div className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-4 px-3">
                Organization
              </h2>
              <nav className="space-y-1">
                {[
                  { id: "general" as const, label: "General", icon: Settings },
                  { id: "danger" as const, label: "Danger Zone", icon: ShieldAlert, danger: true },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium ${
                      item.id === "general" ? "bg-hover-strong text-fg-strong" : "text-muted"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${
                        item.id === "general"
                          ? item.danger
                            ? "text-danger"
                            : "text-accent"
                          : "text-muted"
                      }`}
                    />
                    {item.label}
                  </div>
                ))}
              </nav>
            </div>

            <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-accent/5 to-accent2/5 border border-border">
              <div className="flex items-center gap-2 text-accent mb-2">
                <Info className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tip</span>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">
                Organizations group workspaces and billing for your company.
              </p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
            <SettingsFormSkeleton variant="organization" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex flex-col h-full bg-surface-sunken items-center justify-center min-h-[50vh] text-center px-6">
        <div className="w-16 h-16 bg-danger/10 border border-danger/20 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-fg mb-2">Organization not found</h2>
        <p className="text-sm text-muted max-w-xs mb-8">
          {error ?? "The organization could not be loaded."}
        </p>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-sunken min-h-0">
      <header className="shrink-0 border-b border-border px-6 lg:px-10 py-5 bg-surface-sunken/60 backdrop-blur-xl">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:text-accent transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          All organizations
        </Link>
        <h1 className="text-xl font-bold text-fg tracking-tight mt-3">Organization settings</h1>
        <p className="text-[13px] text-muted mt-0.5">{organization.name}</p>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <aside className="w-[280px] shrink-0 border-r border-border bg-surface-sunken/40 hidden lg:flex flex-col p-6">
          <div className="mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-4 px-3">
              Organization
            </h2>
            <nav className="space-y-1">
              {[
                { id: "general" as const, label: "General", icon: Settings },
                { id: "danger" as const, label: "Danger Zone", icon: ShieldAlert, danger: true },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                    activeSection === item.id
                      ? "bg-hover-strong text-fg-strong"
                      : "text-muted hover:text-muted2 hover:bg-hover"
                  } ${item.danger && activeSection === item.id ? "text-danger" : ""}`}
                >
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      activeSection === item.id
                        ? item.danger
                          ? "text-danger"
                          : "text-accent"
                        : "text-muted group-hover:text-muted2"
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

          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-accent/5 to-accent2/5 border border-border">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Tip</span>
            </div>
            <p className="text-[12px] text-muted leading-relaxed">
              Organizations group workspaces and billing for your company.
            </p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
          <div className="max-w-4xl mx-auto space-y-16 pb-24">
            <section ref={sections.general} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-fg tracking-tight">General</h2>
                  <p className="text-[14px] text-muted mt-1">
                    Name and description for this organization.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-semibold text-fg">Details</h3>
                  <p className="text-[12px] text-muted leading-relaxed">
                    Shown wherever this organization is listed.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                      Organization name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-3 text-[14px] text-fg placeholder:text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                      placeholder="Organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                      Description
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => {
                        setEditDesc(e.target.value);
                        setIsDirty(true);
                      }}
                      rows={4}
                      className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-3 text-[14px] text-fg placeholder:text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all resize-none leading-relaxed"
                      placeholder="What is this organization for?"
                    />
                  </div>
                  {isDirty && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelChanges}
                        className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-muted2 bg-transparent border border-border-hover rounded-xl hover:bg-hover hover:text-fg transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveOrganization()}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-fg hover:bg-fg-strong disabled:opacity-50 disabled:cursor-not-allowed text-bg text-[13px] font-semibold rounded-xl transition-all cursor-pointer"
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

            <section ref={sections.danger} className="space-y-8 pt-8">
              <div className="border-b border-danger/10 pb-6 text-danger">
                <h2 className="text-2xl font-bold tracking-tight">Danger Zone</h2>
                <p className="text-[14px] text-danger/60 mt-1">
                  Actions here are permanent and cannot be undone.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-danger/[0.03] border border-danger/10 flex flex-col md:flex-row items-center gap-8 shadow-lg">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-[16px] font-bold text-danger mb-2">
                    Delete this organization
                  </h3>
                  <p className="text-[13px] text-muted leading-relaxed">
                    Permanently remove this organization and its workspaces. This action is{" "}
                    <span className="text-danger/80 font-bold italic">irreversible</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteDialogOpen(true);
                  }}
                  className="shrink-0 px-6 py-3 bg-danger/10 text-danger hover:bg-danger/20 text-[13px] font-bold rounded-xl border border-danger/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete organization
                </button>
              </div>
            </section>

            <div className="h-20" />
          </div>
        </main>
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        nameToConfirm={organization.name}
        resourceLabel="organization"
        error={deleteError}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={async () => {
          try {
            const res = await fetch(`/api/organizations/${orgId}`, { method: "DELETE" });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? "Failed to delete organization");
            }
            setDeleteError(null);
            router.push("/organizations");
            router.refresh();
          } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to delete organization";
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
              toast.type === "success" ? "var(--color-success-soft)" : "var(--color-danger-soft)",
            borderColor: toast.type === "success" ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger" />
          )}
          <span
            className={`text-sm font-semibold ${toast.type === "success" ? "text-success" : "text-danger"}`}
          >
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 p-1 hover:bg-hover-strong rounded-lg transition-colors cursor-pointer"
          >
            <X
              className={`w-3.5 h-3.5 ${toast.type === "success" ? "text-success" : "text-danger"}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
