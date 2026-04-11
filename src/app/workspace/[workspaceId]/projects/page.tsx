"use client";

import { MOCK_PROJECTS } from "@/modules/project/mock-projects";
import ProjectCard from "@/components/project/ProjectCard";
import { FolderKanban, Plus, Search, LayoutGrid, List, Filter, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import CreateProjectModal from "@/components/project/CreateProjectModal";

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* Projects Header */}
      <div className="px-10 py-10 border-b border-white/[0.04] bg-[#0c0c0f]/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] text-zinc-500 flex items-center gap-2 mt-0.5">
                Workspace Central <span className="w-1 h-1 rounded-full bg-zinc-800" />{" "}
                {MOCK_PROJECTS.length} Total Projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-lg h-9">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md transition-all ${viewMode === "grid" ? "bg-white/[0.08] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-md transition-all ${viewMode === "list" ? "bg-white/[0.08] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-white/[0.08] mx-1" />

            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Search projects..."
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all w-[280px]"
              />
            </div>

            <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[13px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all border-dashed">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
              Sort:
            </span>
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
              Last updated
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid Container */}
      <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10">
            {MOCK_PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {/* Empty State / Add New Placeholder */}
            <button
              onClick={() => setIsModalOpen(true)}
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
        ) : (
          <div className="max-w-6xl mx-auto space-y-1 pb-10">
            {/* List Header */}
            <div className="flex items-center gap-4 px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/[0.03] mb-2">
              <div className="w-8" />
              <div className="flex-1">Project</div>
              <div className="w-24">Status</div>
              <div className="w-40">Progress</div>
              <div className="w-20 text-right">Team</div>
            </div>

            {MOCK_PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
