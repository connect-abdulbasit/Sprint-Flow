"use client";

import { MOCK_TICKETS, MOCK_PROJECTS, Ticket } from "@/modules/project/mock-projects";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import {
  MoreHorizontal,
  Plus,
  GripVertical,
  Circle,
  Loader2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useRef, useCallback } from "react";

const columns = [
  { id: "todo", title: "To Do", icon: Circle, dotColor: "bg-zinc-500" },
  { id: "in_progress", title: "In Progress", icon: Loader2, dotColor: "bg-blue-500" },
  { id: "review", title: "In Review", icon: Eye, dotColor: "bg-purple-500" },
  { id: "done", title: "Done", icon: CheckCircle2, dotColor: "bg-emerald-500" },
];

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/10",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/10",
  low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/10",
};

const typeColors: Record<string, string> = {
  feature: "bg-purple-500/10 text-purple-400",
  bug: "bg-red-500/10 text-red-400",
  task: "bg-blue-500/10 text-blue-400",
  improvement: "bg-emerald-500/10 text-emerald-400",
};

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  const [tickets, setTickets] = useState<Ticket[]>(() => [...MOCK_TICKETS]);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const handleDragStart = useCallback((e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ticketId);

    const el = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      el.style.opacity = "0.4";
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    setDraggedTicketId(null);
    setDragOverColumn(null);
    setDropTargetIndex(null);
    dragCounterRef.current = {};
  }, []);

  const handleColumnDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!dragCounterRef.current[columnId]) {
      dragCounterRef.current[columnId] = 0;
    }
    dragCounterRef.current[columnId]++;
    setDragOverColumn(columnId);
  }, []);

  const handleColumnDragLeave = useCallback((columnId: string) => {
    if (dragCounterRef.current[columnId]) {
      dragCounterRef.current[columnId]--;
    }
    if (dragCounterRef.current[columnId] === 0) {
      setDragOverColumn((prev) => (prev === columnId ? null : prev));
    }
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleCardDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropTargetIndex(e.clientY < midY ? index : index + 1);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      const ticketId = e.dataTransfer.getData("text/plain");
      if (!ticketId) return;

      setTickets((prev) => {
        const updated = prev.map((t) =>
          t.id === ticketId ? { ...t, status: columnId as Ticket["status"] } : t
        );

        if (dropTargetIndex !== null) {
          const movedTicket = updated.find((t) => t.id === ticketId);
          if (movedTicket) {
            const withoutMoved = updated.filter((t) => t.id !== ticketId);
            const columnTickets = withoutMoved.filter((t) => t.status === columnId);
            const otherTickets = withoutMoved.filter((t) => t.status !== columnId);
            const clampedIndex = Math.min(dropTargetIndex, columnTickets.length);
            columnTickets.splice(clampedIndex, 0, movedTicket);
            return [...otherTickets, ...columnTickets];
          }
        }

        return updated;
      });

      setDraggedTicketId(null);
      setDragOverColumn(null);
      setDropTargetIndex(null);
      dragCounterRef.current = {};
    },
    [dropTargetIndex]
  );

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-x-auto p-6 flex gap-4 custom-scrollbar">
        {columns.map((column) => {
          const columnTickets = tickets.filter((t) => t.status === column.id);
          const isOver = dragOverColumn === column.id && draggedTicketId !== null;

          return (
            <div key={column.id} className="flex flex-col w-[300px] shrink-0 group/col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                  <h3 className="text-[13px] font-semibold text-zinc-300">{column.title}</h3>
                  <span className="text-[11px] font-medium text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                    {columnTickets.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                  <button className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-md transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-md transition-all">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Column Drop Zone */}
              <div
                className={`flex-1 space-y-2 overflow-y-auto custom-scrollbar rounded-xl p-2 border transition-all duration-200 min-h-[120px] ${
                  isOver
                    ? "bg-blue-500/[0.04] border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                    : "bg-zinc-900/30 border-white/[0.03]"
                }`}
                onDragEnter={(e) => handleColumnDragEnter(e, column.id)}
                onDragLeave={() => handleColumnDragLeave(column.id)}
                onDragOver={handleColumnDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnTickets.map((ticket, index) => (
                  <div key={ticket.id}>
                    {/* Drop indicator line */}
                    {isOver && dropTargetIndex === index && (
                      <div className="h-0.5 bg-blue-500 rounded-full mx-1 mb-1 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, index)}
                      className={`group/card relative bg-[#111115] border border-white/[0.05] rounded-lg p-3.5 shadow-sm hover:border-white/[0.1] hover:bg-[#141418] transition-all cursor-grab active:cursor-grabbing select-none ${
                        draggedTicketId === ticket.id ? "opacity-40 scale-[0.98]" : ""
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <GripVertical className="w-3.5 h-3.5 text-zinc-700" />
                      </div>

                      {/* Type & Priority Row */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${typeColors[ticket.type] || typeColors.task}`}
                        >
                          {ticket.type}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${priorityColors[ticket.priority]}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      {/* Ticket Key */}
                      <div className="text-[11px] font-mono text-zinc-600 mb-1">{ticket.key}</div>

                      {/* Title */}
                      <h4 className="text-[13px] font-medium text-zinc-300 mb-4 leading-snug group-hover/card:text-zinc-100 transition-colors">
                        {ticket.title}
                      </h4>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[9px] font-semibold text-zinc-400">
                          {ticket.assignee?.initials || "?"}
                        </div>

                        <div className="flex items-center gap-2">
                          {ticket.storyPoints && (
                            <div className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-[10px] font-medium text-zinc-500">
                              {ticket.storyPoints} pts
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Drop indicator at end of column */}
                {isOver && dropTargetIndex === columnTickets.length && (
                  <div className="h-0.5 bg-blue-500 rounded-full mx-1 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                )}

                {/* Add Card Button */}
                <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-zinc-600 text-[12px] font-medium hover:text-zinc-400 hover:bg-white/[0.02] transition-all border border-dashed border-transparent hover:border-white/[0.06]">
                  <Plus className="w-3.5 h-3.5" />
                  Add task
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Column Button */}
        <div className="w-[300px] shrink-0 border border-dashed border-white/[0.04] rounded-xl flex flex-col items-center justify-center group/add hover:border-white/[0.1] hover:bg-white/[0.01] transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center text-zinc-600 group-hover/add:text-zinc-400 group-hover/add:scale-105 transition-all mb-2 border border-zinc-800/50">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[12px] font-medium text-zinc-600 group-hover/add:text-zinc-400 transition-colors">
            Add column
          </span>
        </div>
      </div>
    </div>
  );
}
