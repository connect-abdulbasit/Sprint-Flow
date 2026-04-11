"use client";

import { MOCK_SPRINTS, MOCK_BACKLOG, MOCK_PROJECTS } from "@/modules/project/mock-projects";
import SprintSection from "@/components/project/SprintSection";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { Calendar, Rocket, Layers } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProjectBacklogPage() {
  const { projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        {/* Sprint Roadmap Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Sprint Roadmap</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Active and planned sprints with their tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all">
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/15 rounded-lg text-[12px] font-medium text-blue-400 hover:bg-blue-500/15 transition-all">
              <Rocket className="w-3.5 h-3.5" />
              New Sprint
            </button>
          </div>
        </div>

        {/* Active & Planned Sprints */}
        <div className="space-y-2">
          {MOCK_SPRINTS.map((sprint) => (
            <SprintSection key={sprint.id} sprint={sprint} />
          ))}
        </div>

        {/* Global Backlog */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-200">Backlog</h2>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                {MOCK_BACKLOG.length} unplanned {MOCK_BACKLOG.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            <button className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              Archived
            </button>
          </div>

          <SprintSection
            sprint={{ id: "backlog", name: "Backlog", status: "planning", tickets: MOCK_BACKLOG }}
            isBacklog
          />
        </div>

        {/* End-of-content indicator */}
        <div className="flex flex-col items-center justify-center py-12 opacity-30">
          <Layers className="w-6 h-6 text-zinc-600 mb-2" />
          <p className="text-[11px] text-zinc-600 font-medium">End of backlog</p>
        </div>
      </div>
    </div>
  );
}
