"use client";

import { useState, useEffect } from "react";
import { Sprint, Ticket } from "@/modules/project/mock-projects";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  MoreHorizontal,
  Play,
  CheckCircle2,
  Clock,
} from "lucide-react";
import TicketItem from "./TicketItem";

interface SprintSectionProps {
  sprint: Sprint;
  isBacklog?: boolean;
}

export default function SprintSection({ sprint, isBacklog }: SprintSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPoints = sprint.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const doneTickets = sprint.tickets.filter((t) => t.status === "done").length;

  return (
    <div className="mb-6 last:mb-0">
      {/* Header */}
      <div
        className="group flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-t-xl cursor-pointer hover:bg-white/[0.05] transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#6b6b80]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#6b6b80]" />
          )}
          <span className="text-[14px] font-bold text-[#f0f0f5]">
            {isBacklog ? "Backlog" : sprint.name}
          </span>
          {!isBacklog && (
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                sprint.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {sprint.status}
            </div>
          )}
          <span className="text-[11px] text-[#6b6b80] ml-2">({sprint.tickets.length} tickets)</span>
        </div>

        {/* Sprint Metadata */}
        <div className="flex items-center gap-6">
          {!isBacklog && sprint.startDate && mounted && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#6b6b80]">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(sprint.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              <span> - </span>
              {new Date(sprint.endDate!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}

          {/* Progress Mini Stats */}
          {!isBacklog && (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1 text-[11px] text-[#6b6b80]"
                title="Total Points"
              >
                <Clock className="w-3.5 h-3.5" />
                {totalPoints} pts
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400/80" title="Done">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {doneTickets}/{sprint.tickets.length}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isBacklog && sprint.status === "planning" && (
              <button className="px-3 py-1 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[11px] font-bold text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded-lg transition-colors flex items-center gap-1.5">
                <Play className="w-3 h-3 fill-current" />
                Start Sprint
              </button>
            )}
            <button className="p-1.5 text-[#6b6b80] hover:text-[#f0f0f5] hover:bg-white/[0.05] rounded-lg transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      {isExpanded && (
        <div className="border-x border-b border-white/[0.04] bg-black/10 rounded-b-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {sprint.tickets.length > 0 ? (
            sprint.tickets.map((ticket) => <TicketItem key={ticket.id} ticket={ticket} />)
          ) : (
            <div className="px-4 py-8 text-center text-[12px] text-[#6b6b80] italic">
              No tickets in this section. Drag and drop tickets here or create a new one.
            </div>
          )}

          {/* Quick Create Link */}
          <button className="w-full text-left px-12 py-2.5 text-[12px] text-[#6b6b80] hover:text-[#f0f0f5] hover:bg-white/[0.03] transition-all flex items-center gap-2 group/add">
            <span className="text-[16px] text-emerald-500/50 group-hover/add:text-emerald-400">
              +
            </span>
            Create Ticket
          </button>
        </div>
      )}
    </div>
  );
}
