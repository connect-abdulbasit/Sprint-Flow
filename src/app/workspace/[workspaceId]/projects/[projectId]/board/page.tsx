"use client";

import { MOCK_TICKETS, MOCK_PROJECTS } from "@/modules/project/mock-projects";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Columns,
  GripVertical,
  Zap,
  Target,
  CircleAlert,
} from "lucide-react";
import { useParams } from "next/navigation";

const columns = [
  { id: "todo", title: "To Do", color: "bg-[#6b6b80]/20 text-[#6b6b80]", icon: Target },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500/20 text-blue-400", icon: Zap },
  {
    id: "review",
    title: "In Review",
    color: "bg-purple-500/20 text-purple-400",
    icon: CircleAlert,
  },
  { id: "done", title: "Done", color: "bg-emerald-500/20 text-emerald-400", icon: Columns },
];

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  return (
    <div className="flex flex-col h-full bg-[#0d0d12]">
      <ProjectPageHeader />

      {/* Board Columns Grid */}
      <div className="flex-1 overflow-x-auto p-8 flex gap-6 custom-scrollbar bg-black/5">
        {columns.map((column) => {
          const tickets = MOCK_TICKETS.filter((t) => t.status === column.id);
          return (
            <div
              key={column.id}
              className="flex flex-col w-[340px] shrink-0 bg-[#16161e]/40 border border-white/[0.04] rounded-[2.5rem] p-5 group/col hover:bg-[#16161e]/60 hover:border-white/[0.08] transition-all duration-300 shadow-2xl shadow-black/20"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-6 px-3">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-xl ${column.color}`}>
                    <column.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#f0f0f5] uppercase tracking-wider">
                      {column.title}
                    </h3>
                    <div className="text-[10px] font-bold text-[#333339] uppercase tracking-widest mt-0.5">
                      {tickets.length} Tasks Scheduled
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.06] text-[#333339] hover:text-white transition-all opacity-0 group-hover/col:opacity-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group/card relative bg-[#1c1c24] border border-white/[0.06] rounded-3xl p-5 shadow-xl shadow-black/30 hover:border-[var(--color-accent)]/30 hover:bg-[#22222a] transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-95"
                  >
                    {/* Card Handle */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-[#333339]" />
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          ticket.priority === "urgent"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : ticket.priority === "high"
                              ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                              : "bg-white/[0.04] text-[#6b6b80] border border-white/[0.04]"
                        }`}
                      >
                        {ticket.priority}
                      </div>
                      <span className="text-[10px] font-mono text-[#333339] group-hover/card:text-[#6b6b80] transition-colors">
                        {ticket.key}
                      </span>
                    </div>

                    <h4 className="text-[14px] font-bold text-[#d0d0db] mb-6 leading-relaxed group-hover/card:text-white transition-colors tracking-tight">
                      {ticket.title}
                    </h4>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border-2 border-[#1c1c24] flex items-center justify-center text-[9px] font-black text-[var(--color-accent)] group-hover/card:border-[#22222a] transition-all">
                          {ticket.assignee?.initials || "?"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ticket.storyPoints && (
                          <div className="px-2 py-0.5 rounded-lg bg-white/[0.03] text-[9px] font-black text-[#333339] group-hover/card:text-[#6b6b80] group-hover/card:bg-white/[0.05] transition-all">
                            {ticket.storyPoints} PTS
                          </div>
                        )}
                        <MoreHorizontal className="w-4 h-4 text-[#333339] group-hover/card:text-[#6b6b80] transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Card Button Section */}
                <button className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border border-dashed border-white/[0.06] text-[#333339] text-[12px] font-bold uppercase tracking-widest hover:border-white/[0.15] hover:text-[#6b6b80] hover:bg-white/[0.02] transition-all duration-300">
                  <Plus className="w-4 h-4" />
                  Add Issue
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Column Button */}
        <div className="w-[340px] shrink-0 border border-dashed border-white/[0.04] rounded-[2.5rem] flex flex-col items-center justify-center group/add hover:border-white/[0.1] hover:bg-white/[0.01] transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center text-[#333339] group-hover/add:text-[#6b6b80] group-hover/add:scale-110 transition-all mb-4 border border-white/[0.04]">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#333339] group-hover/add:text-[#6b6b80]">
            New Pipeline
          </span>
        </div>
      </div>
    </div>
  );
}
