"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import TicketDetailModal from "@/components/project/TicketDetailModal";
import TicketFormModal from "@/components/project/TicketFormModal";
import { Plus, GripVertical, Circle, Loader2, Eye, CheckCircle2 } from "lucide-react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  fetchWorkspaceMembers,
  fetchTickets,
  updateTicket,
  type ProjectMember,
  type ProjectTicket,
} from "@/lib/projects-api";
import { initialsFromName } from "@/lib/initials";

const columns = [
  { id: "todo", title: "To Do", icon: Circle, dotColor: "bg-zinc-500" },
  { id: "in_progress", title: "In Progress", icon: Loader2, dotColor: "bg-blue-500" },
  { id: "review", title: "In Review", icon: Eye, dotColor: "bg-purple-500" },
  { id: "done", title: "Done", icon: CheckCircle2, dotColor: "bg-emerald-500" },
] as const;

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

type ColumnId = (typeof columns)[number]["id"];

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<string>("todo");

  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailPreview, setDetailPreview] = useState<ProjectTicket | null>(null);

  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const loadData = useCallback(() => {
    if (!pid || !wid) return;
    Promise.all([fetchTickets(pid), fetchWorkspaceMembers(wid)])
      .then(([t, m]) => {
        setTickets(t);
        setMembers(m);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load board"));
  }, [pid, wid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setDetailTicketId(null);
      setDetailPreview(null);
      setCreateInitialStatus("todo");
      setCreateModalOpen(true);
    }
  }, [searchParams]);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    router.replace(pathname);
  }, [router, pathname]);

  const openCreate = useCallback((status: string = "todo") => {
    setDetailTicketId(null);
    setDetailPreview(null);
    setCreateInitialStatus(status);
    setCreateModalOpen(true);
  }, []);

  const openDetail = useCallback((ticket: ProjectTicket) => {
    setCreateModalOpen(false);
    setDetailTicketId(ticket.id);
    setDetailPreview(ticket);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailTicketId(null);
    setDetailPreview(null);
  }, []);

  const handleTicketSaved = useCallback((ticket: ProjectTicket) => {
    setTickets((prev) => {
      const idx = prev.findIndex((t) => t.id === ticket.id);
      if (idx === -1) return [...prev, ticket];
      const next = [...prev];
      next[idx] = ticket;
      return next;
    });
    setDetailPreview(ticket);
  }, []);

  const handleTicketDeleted = useCallback(
    (ticketId: string) => {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      closeDetail();
    },
    [closeDetail]
  );

  const handleDragStart = useCallback((e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ticketId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTicketId(null);
    setDragOverColumn(null);
    setDropTargetIndex(null);
    dragCounterRef.current = {};
  }, []);

  const handleColumnDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] ?? 0) + 1;
    setDragOverColumn(columnId);
  }, []);

  const handleColumnDragLeave = useCallback((columnId: string) => {
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] ?? 1) - 1;
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
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropTargetIndex(e.clientY < midY ? index : index + 1);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, columnId: ColumnId) => {
      e.preventDefault();
      const ticketId = e.dataTransfer.getData("text/plain");
      if (!ticketId || !pid) return;

      const prev = tickets;
      setTickets((cur) => {
        const updated = cur.map((t) => (t.id === ticketId ? { ...t, status: columnId } : t));
        if (dropTargetIndex !== null) {
          const moved = updated.find((t) => t.id === ticketId);
          if (moved) {
            const without = updated.filter((t) => t.id !== ticketId);
            const inCol = without.filter((t) => t.status === columnId);
            const rest = without.filter((t) => t.status !== columnId);
            const idx = Math.min(dropTargetIndex, inCol.length);
            inCol.splice(idx, 0, moved);
            return [...rest, ...inCol];
          }
        }
        return updated;
      });

      setDraggedTicketId(null);
      setDragOverColumn(null);
      setDropTargetIndex(null);
      dragCounterRef.current = {};

      try {
        await updateTicket(pid, ticketId, { status: columnId });
      } catch {
        setTickets(prev);
      }
    },
    [dropTargetIndex, pid, tickets]
  );

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      {loadError && (
        <div className="px-10 py-2 text-[12px] text-amber-400/90 bg-amber-500/5 border-b border-amber-500/10">
          {loadError}
        </div>
      )}

      {createModalOpen && (
        <TicketFormModal
          projectId={pid}
          members={members}
          mode="create"
          ticket={null}
          initialStatus={createInitialStatus}
          isOpen={createModalOpen}
          onClose={closeCreateModal}
          onSaved={handleTicketSaved}
        />
      )}

      {detailTicketId && (
        <TicketDetailModal
          projectId={pid}
          ticketId={detailTicketId}
          preview={detailPreview}
          members={members}
          isOpen={Boolean(detailTicketId)}
          onClose={closeDetail}
          onUpdated={handleTicketSaved}
          onDeleted={handleTicketDeleted}
        />
      )}

      <div className="flex-1 overflow-x-auto p-6 flex gap-4 custom-scrollbar">
        {columns.map((column) => {
          const columnTickets = tickets.filter((t) => t.status === column.id);
          const isOver = dragOverColumn === column.id && draggedTicketId !== null;

          return (
            <div key={column.id} className="flex flex-col w-[300px] shrink-0 group/col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                  <h3 className="text-[13px] font-semibold text-zinc-300">{column.title}</h3>
                  <span className="text-[11px] font-medium text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                    {columnTickets.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(column.id)}
                  className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-md transition-all opacity-0 group-hover/col:opacity-100"
                  aria-label={`Add ticket to ${column.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className={`flex-1 space-y-2 overflow-y-auto custom-scrollbar rounded-xl p-2 border transition-all duration-200 min-h-[120px] ${
                  isOver
                    ? "bg-blue-500/[0.04] border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                    : "bg-zinc-900/30 border-white/[0.03]"
                }`}
                onDragEnter={(e) => handleColumnDragEnter(e, column.id)}
                onDragLeave={() => handleColumnDragLeave(column.id)}
                onDragOver={handleColumnDragOver}
                onDrop={(e) => void handleDrop(e, column.id)}
              >
                {columnTickets.map((ticket, index) => (
                  <div key={ticket.id}>
                    {isOver && dropTargetIndex === index && (
                      <div className="h-0.5 bg-blue-500 rounded-full mx-1 mb-1 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, index)}
                      onDrop={(e) => void handleDrop(e, column.id)}
                      onClick={() => openDetail(ticket)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetail(ticket);
                        }
                      }}
                      tabIndex={0}
                      className={`group/card relative cursor-pointer rounded-lg border border-white/[0.05] bg-[#111115] p-3.5 pr-10 shadow-sm transition-all select-none hover:border-white/[0.1] hover:bg-[#141418] active:cursor-grabbing ${
                        draggedTicketId === ticket.id ? "opacity-40 scale-[0.98]" : ""
                      }`}
                    >
                      <div
                        className="pointer-events-none absolute top-2.5 right-2.5 text-zinc-600"
                        aria-hidden
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>

                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${typeColors[ticket.type] || typeColors.task}`}
                        >
                          {ticket.type}
                        </span>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${priorityColors[ticket.priority] || priorityColors.medium}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <div className="mb-1 font-mono text-[11px] text-zinc-600">{ticket.key}</div>

                      <h4 className="mb-4 text-[13px] font-medium leading-snug text-zinc-300 group-hover/card:text-zinc-100">
                        {ticket.title}
                      </h4>

                      <div className="flex items-center justify-between">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800 text-[9px] font-semibold text-zinc-400">
                          {initialsFromName(ticket.assigneeName)}
                        </div>
                        {ticket.storyPoints !== null && ticket.storyPoints !== undefined && (
                          <div className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                            {ticket.storyPoints} pts
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isOver && dropTargetIndex === columnTickets.length && (
                  <div className="h-0.5 bg-blue-500 rounded-full mx-1 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                )}

                <button
                  type="button"
                  onClick={() => openCreate(column.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-transparent py-2.5 text-[12px] font-medium text-zinc-600 transition-all hover:border-white/[0.06] hover:bg-white/[0.02] hover:text-zinc-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add task
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex w-[300px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.04] transition-all hover:border-white/[0.1] hover:bg-white/[0.01]">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800/50 bg-white/[0.02] text-zinc-600">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-[12px] font-medium text-zinc-600">Add column</span>
        </div>
      </div>
    </div>
  );
}
