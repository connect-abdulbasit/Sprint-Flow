"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { FolderKanban, Plus, Search, Filter, AlertCircle, X } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import ProjectCard from "@/components/project/ProjectCard";
import ProjectModal from "@/components/project/ProjectModal";
import DeleteConfirmDialog from "@/components/project/DeleteConfirmDialog";
import type { Project } from "@/lib/projects-api";

export default function ProjectsPage() {
  const { workspaceId } = useParams() as { workspaceId: string };
  const { projects, loading, error, createProject, updateProject, deleteProject, dismissError } =
    useProjects(workspaceId);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Search
  const [search, setSearch] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteOpen(true);
  };

  const handleModalSubmit = async (data: { name: string; description: string }) => {
    if (projectToEdit) {
      await updateProject(projectToEdit.id, data);
    } else {
      await createProject(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
    }
  };

  // Filter by search
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-10 py-10 border-b border-white/[0.04] bg-[#0c0c0f]/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Projects</h1>
              <p className="text-[13px] text-zinc-500 flex items-center gap-2 mt-0.5">
                Workspace Central <span className="w-1 h-1 rounded-full bg-zinc-800" />{" "}
                {projects.length} {projects.length === 1 ? "Project" : "Projects"}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="group flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all w-[280px]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[13px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all border-dashed">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div
          className="mx-10 mt-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={dismissError}
            aria-label="Dismiss error"
            className="p-1 hover:text-red-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
        {loading && projects.length === 0 ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#111115] border border-white/[0.05] rounded-2xl p-5 animate-pulse"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                  <div className="w-14 h-5 rounded-full bg-zinc-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-zinc-800" />
                  <div className="h-4 w-full rounded bg-zinc-800/60" />
                  <div className="h-4 w-2/3 rounded bg-zinc-800/40" />
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.03]">
                  <div className="h-3 w-24 rounded bg-zinc-800/40" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 && !loading ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-600 mb-6">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
              {search ? "No projects match your search" : "No projects yet"}
            </h3>
            <p className="text-[13px] text-zinc-500 mb-6 max-w-xs">
              {search
                ? "Try adjusting your search query."
                : "Create your first project to start organizing your work."}
            </p>
            {!search && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-[13px] font-semibold rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}

            {/* New project placeholder tile */}
            <button
              onClick={handleOpenCreate}
              className="border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center p-8 group hover:border-white/[0.15] hover:bg-white/[0.01] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 group-hover:scale-105 transition-all mb-4 border border-zinc-800/50">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[14px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                New Project
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        projectToEdit={projectToEdit}
      />
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        projectName={projectToDelete?.name ?? ""}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
