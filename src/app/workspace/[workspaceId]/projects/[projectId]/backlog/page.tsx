"use client";

import SprintSection from "@/components/project/SprintSection";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import TicketDetailModal from "@/components/project/TicketDetailModal";
import TicketFormModal from "@/components/project/TicketFormModal";
import { Calendar, Rocket, Layers } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  fetchProjectMembers,
  fetchTickets,
  type ProjectMember,
  type ProjectTicket,
} from "@/lib/projects-api";

export default function ProjectBacklogPage() {
  const { projectId } = useParams();
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailPreview, setDetailPreview] = useState<ProjectTicket | null>(null);

  const load = useCallback(() => {
    if (!pid) return;
    Promise.all([fetchTickets(pid), fetchProjectMembers(pid)])
      .then(([t, m]) => {
        setTickets(t);
        setMembers(m);
      })
      .catch(() => setTickets([]));
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = useCallback(() => {
    setDetailTicketId(null);
    setDetailPreview(null);
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

  const handleSaved = useCallback((ticket: ProjectTicket) => {
    setTickets((prev) => {
      const i = prev.findIndex((t) => t.id === ticket.id);
      if (i === -1) return [...prev, ticket];
      const next = [...prev];
      next[i] = ticket;
      return next;
    });
    setDetailPreview(ticket);
  }, []);

  const handleDeleted = useCallback(
    (ticketId: string) => {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      closeDetail();
    },
    [closeDetail]
  );

  const backlog = {
    id: "backlog",
    name: "Backlog",
    status: "planning" as const,
    tickets,
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      {createModalOpen && (
        <TicketFormModal
          projectId={pid}
          members={members}
          mode="create"
          ticket={null}
          initialStatus="todo"
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSaved={handleSaved}
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
          onUpdated={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Sprint Roadmap</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Planned sprints will appear here when sprint data is available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/15 rounded-lg text-[12px] font-medium text-blue-400 hover:bg-blue-500/15 transition-all"
            >
              <Rocket className="w-3.5 h-3.5" />
              New Sprint
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.05] bg-[#111115]/30 px-4 py-6 text-center text-[13px] text-zinc-500">
          No planned sprints in the database yet.
        </div>

        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-200">Backlog</h2>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                {tickets.length} unplanned {tickets.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Archived
            </button>
          </div>

          <SprintSection
            sprint={backlog}
            isBacklog
            onCreateTask={openCreate}
            onTicketSelect={openDetail}
          />
        </div>

        <div className="flex flex-col items-center justify-center py-12 opacity-30">
          <Layers className="w-6 h-6 text-zinc-600 mb-2" />
          <p className="text-[11px] text-zinc-600 font-medium">End of backlog</p>
        </div>
      </div>
    </div>
  );
}
