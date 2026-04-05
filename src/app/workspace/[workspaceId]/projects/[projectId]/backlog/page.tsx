"use client";

import { MOCK_SPRINTS, MOCK_BACKLOG, MOCK_PROJECTS } from "@/modules/project/mock-projects";
import SprintSection from "@/components/project/SprintSection";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { Plus, Info, Calendar, LayoutList, Rocket } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProjectBacklogPage() {
  const { projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  return (
    <div className="flex flex-col h-full bg-[#0d0d12]">
      <ProjectPageHeader />

      {/* Backlog Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scroll-smooth custom-scrollbar">
        {/* Project Sprint Roadmap Header - Modern Look */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
                Lifecycle
              </span>
              <h2 className="text-sm font-black text-[#6b6b80] uppercase tracking-widest flex items-center gap-2">
                Sprint Roadmap
                <Info className="w-3.5 h-3.5 text-[#333339] cursor-help hover:text-[#6b6b80] transition-colors" />
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[12px] font-bold text-[#6b6b80] hover:text-[#f0f0f5] hover:bg-white/[0.05] transition-all">
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[12px] font-bold text-indigo-400 hover:bg-indigo-500/15 transition-all">
              <Rocket className="w-3.5 h-3.5" />
              New Sprint
            </button>
          </div>
        </div>

        {/* Active & Planned Sprints */}
        <div className="space-y-4">
          {MOCK_SPRINTS.map((sprint) => (
            <SprintSection key={sprint.id} sprint={sprint} />
          ))}
        </div>

        {/* Global Backlog */}
        <div className="pt-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
                Unplanned
              </span>
              <h2 className="text-sm font-black text-[#6b6b80] uppercase tracking-widest flex items-center gap-2">
                Global Backlog
                <span className="text-[11px] font-mono lowercase tracking-normal text-[#333339]">
                  ({MOCK_BACKLOG.length} tasks)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-[1px] bg-white/[0.04]" />
              <button className="p-1.5 text-[11px] font-bold text-[#333339] hover:text-[#6b6b80] uppercase tracking-widest transition-colors">
                Archived
              </button>
            </div>
          </div>

          <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20">
            <SprintSection
              sprint={{ id: "backlog", name: "Backlog", status: "planning", tickets: MOCK_BACKLOG }}
              isBacklog
            />
          </div>
        </div>

        {/* Empty State / Bottom Padding */}
        <div className="flex flex-col items-center justify-center pt-20 pb-40 opacity-20">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.02] flex items-center justify-center mb-6">
            <LayoutList className="w-8 h-8" />
          </div>
          <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#6b6b80]">
            Roadmap End Reached
          </p>
        </div>
      </div>
    </div>
  );
}
