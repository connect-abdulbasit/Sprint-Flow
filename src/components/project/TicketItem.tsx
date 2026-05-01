"use client";

import { useRef } from "react";
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
  Link2,
  GripVertical,
} from "lucide-react";

export const TICKET_DRAG_MIME = "application/x-sprintflow-ticket";

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
  draggableTicketId,
}: {
  ticket: ProjectTicket;
  onSelect?: (_ticket: ProjectTicket) => void;
  /** When set, row can be dragged (backlog / sprint moves). */
  draggableTicketId?: string;
}) {
  const suppressClickRef = useRef(false);
  const priority =
    priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
  const type = typeConfig[ticket.type];
  const status = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.todo;
  const PriorityIcon = priority.icon;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;
  const isDraggable = Boolean(draggableTicketId);

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 border-b border-white/[0.03] px-4 py-2 transition-all hover:bg-white/[0.03]"
      draggable={isDraggable}
      onDragStart={(e) => {
        if (!draggableTicketId) return;
        e.dataTransfer.setData(TICKET_DRAG_MIME, draggableTicketId);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (suppressClickRef.current) return;
        onSelect?.(ticket);
      }}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(ticket);
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
    >
      {isDraggable ? (
        <span
          className="shrink-0 cursor-grab text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-hidden
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      ) : null}
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

      {ticket.blockedByOpenDependencies ? (
        <span
          className="flex shrink-0 text-amber-500/90"
          title="Waiting on linked tickets not done yet"
        >
          <Link2 className="h-3 w-3" aria-hidden />
        </span>
      ) : null}

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
