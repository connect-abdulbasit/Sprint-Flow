"use client";

import type { ProjectTicket } from "@/lib/projects-api";
import { initialsFromName } from "@/lib/initials";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Bug,
  Zap,
  PlusCircle,
} from "lucide-react";

const priorityConfig = {
  low: { icon: ArrowDown, color: "text-blue-400/60", bg: "bg-blue-400/10", label: "Low" },
  medium: { icon: Minus, color: "text-amber-400/60", bg: "bg-amber-400/10", label: "Medium" },
  high: { icon: ArrowUp, color: "text-orange-400", bg: "bg-orange-400/10", label: "High" },
  urgent: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Urgent" },
};

const typeConfig = {
  task: { icon: FileText, color: "text-blue-400", label: "Task" },
  bug: { icon: Bug, color: "text-red-400", label: "Bug" },
  feature: { icon: Zap, color: "text-purple-400", label: "Feature" },
  improvement: { icon: PlusCircle, color: "text-emerald-400", label: "Improvement" },
};

const statusConfig = {
  todo: { icon: Circle, color: "text-zinc-500" },
  in_progress: { icon: Clock, color: "text-blue-400" },
  review: { icon: CheckCircle2, color: "text-purple-400" },
  done: { icon: CheckCircle2, color: "text-emerald-400" },
};

export default function TicketItem({
  ticket,
  onSelect,
}: {
  ticket: ProjectTicket;
  onSelect?: (ticket: ProjectTicket) => void;
}) {
  const priority =
    priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
  const type = typeConfig[ticket.type];
  const status = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.todo;
  const PriorityIcon = priority.icon;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 border-b border-white/[0.03] px-4 py-2 transition-all hover:bg-white/[0.03]"
      onClick={() => onSelect?.(ticket)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(ticket);
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
    >
      {/* Status Icon */}
      <StatusIcon className={`w-4 h-4 shrink-0 ${status.color}`} />

      {/* Key */}
      <span className="text-[11px] font-mono text-zinc-600 w-[60px] shrink-0 group-hover:text-zinc-400 transition-colors">
        {ticket.key}
      </span>

      {/* Title */}
      <span className="text-[13px] text-zinc-300 flex-1 truncate group-hover:text-zinc-100 transition-colors">
        {ticket.title}
      </span>

      {/* Type Badge */}
      <div className="flex items-center gap-1 shrink-0">
        <TypeIcon className={`w-3 h-3 ${type.color}`} />
        <span className={`text-[10px] font-medium ${type.color}`}>{type.label}</span>
      </div>

      {/* Priority */}
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${priority.bg} ${priority.color}`}
      >
        <PriorityIcon className="w-3 h-3" />
        {priority.label}
      </div>

      {/* Story Points */}
      {ticket.storyPoints !== null && ticket.storyPoints !== undefined ? (
        <div className="w-6 h-6 rounded bg-zinc-800/80 flex items-center justify-center text-[10px] font-medium text-zinc-500 shrink-0">
          {ticket.storyPoints}
        </div>
      ) : (
        <div className="w-6 shrink-0" />
      )}

      {/* Assignee */}
      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[9px] font-semibold text-zinc-400 shrink-0">
        {initialsFromName(ticket.assigneeName)}
      </div>
    </div>
  );
}
