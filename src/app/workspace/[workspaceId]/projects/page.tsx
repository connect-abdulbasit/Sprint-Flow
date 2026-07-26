"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { FolderKanban, Plus, Search, AlertCircle, X } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import ProjectCard from "@/components/project/ProjectCard";
import ProjectModal from "@/components/project/ProjectModal";
import { ProjectGridSkeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const { workspaceId } = useParams() as { workspaceId: string };
  const { projects, loading, error, createProject, dismissError } = useProjects(workspaceId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const hasSearch = query.length > 0;

  const handleOpenCreate = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: { name: string; description: string }) => {
    await createProject(data);
  };

  const filteredProjects = projects.filter((p) => {
    if (!hasSearch) return true;
    return (
      p.name.toLowerCase().includes(query) || (p.description ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <div className="px-10 py-8 border-b border-border bg-surface-sunken/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-fg tracking-tight">Projects</h1>
              <p className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                Workspace Central <span className="w-1 h-1 rounded-full bg-surface-2" />{" "}
                {projects.length} {projects.length === 1 ? "Project" : "Projects"}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="group flex items-center gap-2 px-4 py-2 bg-fg hover:bg-fg-strong text-bg text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="bg-hover border border-border rounded-lg pl-9 pr-4 py-2 text-[13px] text-fg placeholder:text-muted focus:outline-none focus:border-accent/50 focus:bg-hover transition-all w-[280px]"
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mx-10 mt-6 flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[13px] font-medium"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={dismissError}
            aria-label="Dismiss error"
            className="p-1 hover:text-danger"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
        {loading && projects.length === 0 ? (
          <ProjectGridSkeleton count={6} />
        ) : filteredProjects.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-hover border border-border flex items-center justify-center text-muted mb-6">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-muted2 mb-2">
              {hasSearch ? "No projects match your search" : "No projects yet"}
            </h3>
            <p className="text-[13px] text-muted mb-6 max-w-xs">
              {hasSearch
                ? "Try adjusting your search query."
                : "Create your first project to start organizing your work."}
            </p>
            {!hasSearch && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-fg hover:bg-fg-strong text-bg text-[13px] font-semibold rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            <button
              onClick={handleOpenCreate}
              className="border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 group hover:border-border-hover hover:bg-hover transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-hover flex items-center justify-center text-muted group-hover:text-muted2 group-hover:scale-105 transition-all mb-4 border border-border-strong/50">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[14px] font-semibold text-muted group-hover:text-muted2 transition-colors">
                New Project
              </span>
            </button>
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        projectToEdit={null}
      />
    </div>
  );
}
