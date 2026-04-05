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
    <div className="flex flex-col h-full bg-[#0d0d12]">
      {/* Projects Header */}
      <div className="px-8 py-10 border-b border-white/[0.04] bg-[#111118]/40 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-inner flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <FolderKanban className="w-7 h-7 shadow-lg shadow-indigo-500/20" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#f0f0f5] tracking-tight font-syne uppercase">
                Projects
              </h1>
              <p className="text-[12px] font-bold text-[#6b6b80] uppercase tracking-[0.2em] flex items-center gap-2">
                Workspace Central <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />{" "}
                {MOCK_PROJECTS.length} Total Projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher */}
            <div className="flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl h-10 shadow-inner">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/[0.08] text-white shadow-lg" : "text-[#6b6b80] hover:text-[#9090a8]"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white/[0.08] text-white shadow-lg" : "text-[#6b6b80] hover:text-[#9090a8]"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-white/[0.08] mx-2" />

            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2.5 px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-[14px] font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[var(--color-accent)]/20"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              Create Project
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80] group-focus-within:text-[var(--color-accent)] transition-colors" />
              <input
                type="text"
                placeholder="Search projects..."
                className="bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-12 pr-6 py-2.5 text-[14px] text-[#f0f0f5] placeholder-[#6b6b80] focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/[0.06] transition-all w-[320px] shadow-inner"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-[13px] font-bold text-[#6b6b80] hover:text-[#f0f0f5] hover:bg-white/[0.06] transition-all group">
              <Filter className="w-4 h-4 group-hover:text-[var(--color-accent)]" />
              Filters
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-[#333339] uppercase tracking-widest">
              Sort By:
            </span>
            <button className="flex items-center gap-2 text-[11px] font-bold text-[#6b6b80] hover:text-[#f0f0f5] transition-colors">
              Recently Updated
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid Container */}
      <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
            {MOCK_PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {/* Empty State / Add New Placeholder */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-white/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center p-10 group hover:border-white/[0.12] hover:bg-white/[0.01] transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center text-[#333339] group-hover:text-indigo-400/60 group-hover:scale-110 transition-all mb-6 border border-white/[0.04]">
                <Plus className="w-7 h-7" />
              </div>
              <span className="text-lg font-black text-[#333339] group-hover:text-[#6b6b80] uppercase tracking-[0.2em] font-syne">
                New Project
              </span>
              <p className="text-[12px] font-bold text-[#333339] group-hover:text-[#6b6b80] mt-3 uppercase tracking-widest italic">
                Ignite your next journey
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-3 pb-10">
            {/* List Header */}
            <div className="flex items-center gap-4 px-6 py-3 text-[10px] font-black text-[#6b6b80] uppercase tracking-widest">
              <div className="w-10" />
              <div className="flex-1">Project Name</div>
              <div className="w-32">Status</div>
              <div className="w-48 text-center">Sprint Progress</div>
              <div className="w-24 text-right">Activity</div>
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
