"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import DeleteConfirmDialog from "@/components/project/DeleteConfirmDialog";
import { Settings, Trash2, ShieldAlert, Save, Info, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { deleteProject, fetchProject, updateProject, type Project } from "@/lib/projects-api";
import { projectKeyPrefix } from "@/lib/ticket-key";
import { ProjectSettingsBodySkeleton } from "@/components/ui/skeleton";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

export default function ProjectSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;
  const workspaceId = params.workspaceId;
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(wid);
  const canDeleteProject = !roleLoading && hasRole("admin");
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState("general");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);

  // AUD-010: the General section previously had no state at all — the inputs were
  // uncontrolled and the "Save Changes" button had no click handler, so edits were
  // silently discarded with no error shown.
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sections = {
    general: useRef<HTMLDivElement>(null),
    danger: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    setProjectLoaded(false);
    fetchProject(pid)
      .then((p) => {
        if (!cancelled) {
          setProject(p);
          setNameInput(p.name);
          setDescriptionInput(p.description ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) setProject(null);
      })
      .finally(() => {
        if (!cancelled) setProjectLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pid]);

  const scrollToSection = (id: keyof typeof sections) => {
    setActiveSection(id);
    sections[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const key = project ? projectKeyPrefix(project.name) : "";
  const hasUnsavedChanges =
    project !== null &&
    (nameInput.trim() !== project.name || descriptionInput.trim() !== (project.description ?? ""));

  const handleSaveGeneral = async () => {
    if (!pid || saving) return;
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setSaveError("Project name cannot be empty.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateProject(pid, {
        name: trimmedName,
        description: descriptionInput.trim(),
      });
      setProject(updated);
      setNameInput(updated.name);
      setDescriptionInput(updated.description ?? "");
      setSaveSuccess(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      {!projectLoaded ? (
        <ProjectSettingsBodySkeleton />
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <aside className="w-[280px] shrink-0 border-r border-border bg-surface-sunken/40 hidden lg:flex flex-col p-6">
            <div className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-4 px-3">
                Project Settings
              </h2>
              <nav className="space-y-1">
                {[
                  { id: "general" as const, label: "General", icon: Settings },
                  ...(canDeleteProject
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
                <span className="text-[11px] font-bold uppercase tracking-wider">Need help?</span>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">
                Managing large projects? Check our best practices for workspace organization.
              </p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto space-y-16 pb-24">
              <section ref={sections.general} className="space-y-8 animate-fade-up">
                <div className="flex items-end justify-between border-b border-border pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-fg tracking-tight">General</h2>
                    <p className="text-[14px] text-muted mt-1">
                      Fundamental settings for your project identity.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveGeneral()}
                    disabled={saving || !hasUnsavedChanges}
                    className="flex items-center gap-2 px-4 py-2 bg-fg hover:bg-fg-strong text-bg rounded-xl text-[13px] font-semibold transition-all active:scale-95 shadow-lg shadow-fg/5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>

                {saveError && (
                  <div className="rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-[13px] text-danger">
                    {saveError}
                  </div>
                )}
                {saveSuccess && !saveError && (
                  <div className="rounded-xl border border-success/20 bg-success/[0.06] px-4 py-3 text-[13px] text-success">
                    Changes saved.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-semibold text-fg">Identity</h3>
                    <p className="text-[12px] text-muted leading-relaxed">
                      Choose a clear name and description for your team.
                    </p>
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="project-name"
                        className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted"
                      >
                        Project Name
                      </label>
                      <input
                        id="project-name"
                        type="text"
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          setSaveSuccess(false);
                        }}
                        maxLength={255}
                        className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-3 text-[14px] text-fg focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all font-medium"
                        placeholder="Enter project name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="project-description"
                        className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted"
                      >
                        Description
                      </label>
                      <textarea
                        id="project-description"
                        value={descriptionInput}
                        onChange={(e) => {
                          setDescriptionInput(e.target.value);
                          setSaveSuccess(false);
                        }}
                        rows={4}
                        className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-3 text-[14px] text-fg focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all resize-none leading-relaxed"
                        placeholder="What is this project about?"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-semibold text-fg">Identifier</h3>
                    <p className="text-[12px] text-muted leading-relaxed">
                      This prefix is used for all issues within this project.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="space-y-2 max-w-sm">
                      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                        Issue Prefix
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          readOnly
                          value={key}
                          className="w-full bg-hover border border-border rounded-xl px-4 py-3 text-[14px] font-mono text-muted cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-surface-2 text-muted px-1.5 py-0.5 rounded border border-border">
                          LOCKED
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {canDeleteProject && (
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
                        Delete this project
                      </h3>
                      <p className="text-[13px] text-muted leading-relaxed">
                        Removing this project will delete all associated tickets, sprints, and
                        metrics. This action is{" "}
                        <span className="text-danger/80 font-bold italic">irreversible</span>.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!pid}
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteDialogOpen(true);
                      }}
                      className="shrink-0 px-6 py-3 bg-danger/10 text-danger hover:bg-danger/20 text-[13px] font-bold rounded-xl border border-danger/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </button>
                  </div>
                </section>
              )}

              <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                nameToConfirm={project?.name ?? ""}
                resourceLabel="project"
                error={deleteError}
                onClose={() => {
                  setDeleteDialogOpen(false);
                  setDeleteError(null);
                }}
                onConfirm={async () => {
                  if (!pid || !wid) {
                    setDeleteError("Missing workspace or project.");
                    throw new Error("Missing ids");
                  }
                  try {
                    await deleteProject(pid);
                    setDeleteError(null);
                    router.push(`/workspace/${wid}/projects`);
                    router.refresh();
                  } catch (e) {
                    const message = e instanceof Error ? e.message : "Failed to delete project";
                    setDeleteError(message);
                    throw e;
                  }
                }}
              />

              <div className="h-20" />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
