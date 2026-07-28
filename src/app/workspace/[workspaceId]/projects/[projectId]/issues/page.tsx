"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import TicketItem from "@/components/project/TicketItem";
import TicketDetailDrawer from "@/components/project/TicketDetailDrawer";
import TicketFormModal from "@/components/project/TicketFormModal";
import BulkActionBar from "@/components/project/BulkActionBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  deleteTicket,
  fetchEpics,
  fetchProject,
  fetchTickets,
  fetchWorkspaceMembers,
  type Epic,
  type Project,
  type ProjectMember,
  type ProjectTicket,
} from "@/lib/projects-api";
import { normalizeBoardColumns, statusOptionsFromColumns } from "@/lib/board-columns";
import { searchTickets } from "@/lib/search";
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITIES } from "@/lib/ticket-priority";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { Trash2 } from "lucide-react";

export default function AllIssuesPage() {
  const { workspaceId, projectId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [ready, setReady] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [epicFilter, setEpicFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(wid);
  const canManage = !roleLoading && hasRole("project_manager");
  const canDelete = !roleLoading && hasRole("admin");

  const load = useCallback(() => {
    if (!pid || !wid) return;
    setReady(false);
    fetchTickets(pid)
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setReady(true));
    fetchEpics(pid, { skipProgress: true })
      .then(setEpics)
      .catch(() => setEpics([]));
    fetchWorkspaceMembers(wid)
      .then(setMembers)
      .catch(() => setMembers([]));
    fetchProject(pid)
      .then(setProject)
      .catch(() => setProject(null));
  }, [pid, wid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreateModalOpen(true);
  }, [searchParams]);

  const statusFormOptions = useMemo(
    () => statusOptionsFromColumns(normalizeBoardColumns(project?.boardColumns ?? null)),
    [project?.boardColumns]
  );

  // Top-level issues only — subtasks are reachable via their parent's drawer.
  const topLevelTickets = useMemo(() => tickets.filter((t) => !t.parentTaskId), [tickets]);

  const filtered = useMemo(() => {
    let list = searchTickets(topLevelTickets, query);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
    if (typeFilter) list = list.filter((t) => t.type === typeFilter);
    if (epicFilter) {
      list = list.filter((t) => (epicFilter === "__none__" ? !t.epicId : t.epicId === epicFilter));
    }
    if (assigneeFilter) {
      list = list.filter((t) =>
        assigneeFilter === "__unassigned__" ? !t.assigneeId : t.assigneeId === assigneeFilter
      );
    }
    return list;
  }, [
    topLevelTickets,
    query,
    statusFilter,
    priorityFilter,
    typeFilter,
    epicFilter,
    assigneeFilter,
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const executeBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteTicket(pid, id)));
      setTickets((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      {createModalOpen && (
        <TicketFormModal
          projectId={pid}
          members={members}
          mode="create"
          ticket={null}
          statusOptions={statusFormOptions}
          linkableTickets={tickets}
          epics={epics}
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            router.replace(`/workspace/${wid}/projects/${pid}/issues`);
          }}
          onSaved={() => load()}
        />
      )}

      {detailTicketId && (
        <TicketDetailDrawer
          projectId={pid}
          workspaceId={wid}
          ticketId={detailTicketId}
          members={members}
          statusOptions={statusFormOptions}
          linkableTickets={tickets}
          epics={epics}
          allTickets={tickets}
          onNavigateToTicket={setDetailTicketId}
          isOpen={Boolean(detailTicketId)}
          onClose={() => setDetailTicketId(null)}
          onUpdated={() => load()}
          onDeleted={() => {
            setDetailTicketId(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        title={`Delete ${selectedIds.size} ticket${selectedIds.size === 1 ? "" : "s"}?`}
        description="This cannot be undone. Comments and attachments are removed with each ticket."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setBulkDeleteConfirm(false);
          void executeBulkDelete();
        }}
      />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">All Issues</h2>
          <p className="text-[12px] text-muted mt-0.5">
            Every story, task, and bug across this project — sprint-scheduled or not.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issues…"
              className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-[13px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
          >
            <option value="">All statuses</option>
            {statusFormOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
          >
            <option value="">All priorities</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TICKET_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg capitalize focus:border-accent/40 focus:outline-none"
          >
            <option value="">All types</option>
            {["story", "task", "bug", "feature", "improvement"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={epicFilter}
            onChange={(e) => setEpicFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
          >
            <option value="">All epics</option>
            <option value="__none__">No epic</option>
            {epics.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.name}
              </option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
          >
            <option value="">All assignees</option>
            <option value="__unassigned__">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {!ready ? (
          <div className="rounded-xl border border-border bg-surface/40 px-4 py-10 text-center text-[13px] text-muted">
            Loading issues…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface/30 px-4 py-10 text-center text-[13px] text-muted">
            {topLevelTickets.length === 0
              ? "No issues yet. Create one to get started."
              : "No issues match your search or filters."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
            {filtered.map((ticket) => (
              <TicketItem
                key={ticket.id}
                ticket={ticket}
                onSelect={(t) => setDetailTicketId(t.id)}
                members={members}
                statusOptions={statusFormOptions}
                canEdit={canManage}
                selectable
                selected={selectedIds.has(ticket.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        busy={bulkBusy}
        actions={[
          {
            label: "Delete",
            icon: <Trash2 className="h-3.5 w-3.5" />,
            variant: "danger",
            onClick: () => setBulkDeleteConfirm(true),
            disabled: !canDelete,
          },
        ]}
      />
    </div>
  );
}
