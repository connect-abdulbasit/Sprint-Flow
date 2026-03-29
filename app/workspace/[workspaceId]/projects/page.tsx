"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban, Plus, Trash2, Loader2, AlertCircle, X,
  Calendar, ChevronRight,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
};

type ProjectStatus = "active" | "on_hold" | "archived";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  archived: "Archived",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "text-[#00d4aa] bg-[#00d4aa]/10 border-[#00d4aa]/20",
  on_hold: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
  archived: "text-[#9090a8] bg-[#9090a8]/10 border-[#9090a8]/20",
};

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New project form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState<ProjectStatus>("active");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/projects`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load projects");
      setProjects(data.projects);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");
      setProjects((prev) => [data.project, ...prev]);
      setShowModal(false);
      setNewName("");
      setNewDesc("");
      setNewStatus("active");
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await fetch(`/api/workspace/${workspaceId}/projects/${projectId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {
      alert("Failed to delete project.");
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5] font-syne">Projects</h1>
          <p className="text-[#9090a8] text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4f7cff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0_2px_10px_rgba(79,124,255,0.3)]"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-[#ff4f4f]/10 border border-[#ff4f4f]/20 rounded-xl text-[#ff4f4f] text-sm mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-40 text-[#9090a8]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading projects...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <FolderKanban className="w-12 h-12 text-[#333339] mb-4" />
          <p className="text-[#f0f0f5] font-semibold text-lg mb-2">No projects yet</p>
          <p className="text-[#9090a8] text-sm mb-6">Create your first project to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4f7cff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      )}

      {/* Project cards grid */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const status = project.status as ProjectStatus;
            return (
              <div
                key={project.id}
                className="group bg-[#111118] border border-[#333339] hover:border-[#4f7cff]/30 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(79,124,255,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#f0f0f5] truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-[#9090a8] text-sm mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg text-[#6b6b80] hover:text-[#ff4f4f] hover:bg-[#ff4f4f]/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.active}`}>
                    {STATUS_LABELS[status] ?? project.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#6b6b80]">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  href={`/workspace/${workspaceId}/projects/${project.id}/overview`}
                  className="flex items-center gap-1 text-xs font-medium text-[#4f7cff] hover:text-[#a259ff] transition-colors mt-auto"
                >
                  Open project <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111118] border border-[#333339] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#f0f0f5] font-syne">New Project</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-[#6b6b80] hover:text-[#f0f0f5] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">
                  Project Name <span className="text-[#ff4f4f]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing Website"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#18181f] border border-[#333339] focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[#6b6b80] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">
                  Description <span className="text-[#6b6b80] font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Brief description of the project..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#18181f] border border-[#333339] focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] placeholder-[#6b6b80] outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                  className="w-full bg-[#18181f] border border-[#333339] focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] rounded-xl px-4 py-3 text-sm text-[#f0f0f5] outline-none transition-all"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {createError && (
                <p className="text-[#ff4f4f] text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[#9090a8] hover:text-[#f0f0f5] bg-[#18181f] border border-[#333339] hover:border-[#4f7cff]/30 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#4f7cff] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
