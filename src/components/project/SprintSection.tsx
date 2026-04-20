"use client";

import { useState, useEffect } from "react";
import type { ProjectTicket, SprintGroup } from "@/lib/projects-api";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  MoreHorizontal,
  Play,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import TicketItem from "./TicketItem";

interface SprintSectionProps {
  sprint: SprintGroup;
  isBacklog?: boolean;
  onCreateTask?: () => void;
  onTicketSelect?: (_ticket: ProjectTicket) => void;
}

export default function SprintSection({
  sprint,
  isBacklog,
  onCreateTask,
  onTicketSelect,
}: SprintSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPoints = sprint.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const doneTickets = sprint.tickets.filter((t) => t.status === "done").length;

  return (
    <div className="mb-3 last:mb-0">
      {/* Header */}
      <div
        className="group flex cursor-pointer items-center gap-3 rounded-t-lg border border-white/[0.05] bg-[#111115] px-4 py-2.5 transition-all hover:bg-[#141418]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          )}

          <span className="text-[13px] font-semibold text-zinc-200 truncate">
            {isBacklog ? "Backlog" : sprint.name}
          </span>

          {!isBacklog && (
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                sprint.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
              }`}
            >
              {sprint.status}
            </span>
          )}

          <span className="text-[11px] text-zinc-600 shrink-0">
            {sprint.tickets.length} {sprint.tickets.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Sprint Metadata */}
        <div className="flex items-center gap-4 shrink-0">
          {!isBacklog && sprint.startDate && mounted && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Calendar className="w-3 h-3 text-zinc-600" />
              {new Date(sprint.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {" — "}
              {new Date(sprint.endDate!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}

          {!isBacklog && (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1 text-[11px] text-zinc-500"
                title="Story Points"
              >
                <Clock className="w-3 h-3 text-zinc-600" />
                {totalPoints} pts
              </div>
              <div
                className="flex items-center gap-1 text-[11px] text-emerald-400/80"
                title="Completed"
              >
                <CheckCircle2 className="w-3 h-3" />
                {doneTickets}/{sprint.tickets.length}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isBacklog && sprint.status === "planning" && (
              <button className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/15 text-[11px] font-medium text-blue-400 border border-blue-500/20 rounded-md transition-colors flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" />
                Start
              </button>
            )}
            <button className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-md transition-all">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      {isExpanded && (
        <div className="border-x border-b border-white/[0.04] bg-[#0c0c0f] rounded-b-lg overflow-hidden">
          {sprint.tickets.length > 0 ? (
            sprint.tickets.map((ticket) => (
              <TicketItem key={ticket.id} ticket={ticket} onSelect={onTicketSelect} />
            ))
          ) : (
            <div className="px-4 py-6 text-center text-[12px] text-zinc-600">
              No tasks yet. Drag tasks here or create a new one.
            </div>
          )}

          {/* Quick Create */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateTask?.();
            }}
            className="flex w-full items-center gap-2 border-t border-white/[0.03] px-4 py-2 text-left text-[12px] text-zinc-600 transition-all hover:bg-white/[0.02] hover:text-zinc-400"
          >
            <Plus className="w-3 h-3" />
            Create task
          </button>
        </div>
      )}
    </div>
  );
}
