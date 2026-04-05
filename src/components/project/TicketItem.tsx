"use client";

import { Ticket } from "@/modules/project/mock-projects";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ArrowUpCircle,
  FileText,
  Bug,
  PlusCircle,
  Zap,
} from "lucide-react";

const priorityIcons = {
  low: { icon: ArrowUpCircle, color: "text-blue-400/60", bg: "bg-blue-400/10" },
  medium: { icon: ArrowUpCircle, color: "text-yellow-400/60", bg: "bg-yellow-400/10" },
  high: { icon: ArrowUpCircle, color: "text-orange-400/80", bg: "bg-orange-400/10" },
  urgent: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

const typeIcons = {
  task: { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" },
  bug: { icon: Bug, color: "text-red-400", bg: "bg-red-400/10" },
  feature: { icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
  improvement: { icon: PlusCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  review: CheckCircle2,
  done: CheckCircle2,
};

export default function TicketItem({ ticket }: { ticket: Ticket }) {
  const PriorityIcon = priorityIcons[ticket.priority].icon;
  const TypeIcon = typeIcons[ticket.type].icon;
  const StatusIcon = statusIcons[ticket.status];

  return (
    <div className="group flex items-center gap-4 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border-b border-white/[0.04] transition-all duration-150 cursor-pointer">
      {/* Type & Key */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className={`p-1 rounded ${typeIcons[ticket.type].bg}`}>
          <TypeIcon className={`w-3 h-3 ${typeIcons[ticket.type].color}`} />
        </div>
        <span className="text-[11px] font-mono text-[#6b6b80] group-hover:text-[#9090a8] transition-colors">
          {ticket.key}
        </span>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <StatusIcon
          className={`w-3.5 h-3.5 shrink-0 ${
            ticket.status === "done"
              ? "text-emerald-400"
              : ticket.status === "in_progress"
                ? "text-blue-400"
                : "text-[#6b6b80]"
          }`}
        />
        <span className="text-[13px] text-[#d0d0db] truncate group-hover:text-white transition-colors">
          {ticket.title}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Story Points */}
        {ticket.storyPoints && (
          <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-[#6b6b80]">
            {ticket.storyPoints}
          </div>
        )}

        {/* Priority */}
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityIcons[ticket.priority].bg} ${priorityIcons[ticket.priority].color}`}
        >
          <PriorityIcon className="w-2.5 h-2.5" />
          {ticket.priority}
        </div>

        {/* Assignee */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-white/[0.08] flex items-center justify-center text-[9px] font-bold text-[var(--color-accent)]">
          {ticket.assignee?.initials || "?"}
        </div>
      </div>
    </div>
  );
}
