"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  LayoutGrid,
  Plus,
  Search,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import EpicFormModal from "@/components/project/EpicFormModal";
import BulkActionBar, { type BulkAction } from "@/components/project/BulkActionBar";
import { ProgressBar, ProgressRing } from "@/components/project/detail/ProgressRing";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EpicsGridSkeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/ui/user-avatar";
import {
  archiveEpic,
  deleteEpic,
  fetchEpics,
  fetchWorkspaceMembers,
  unarchiveEpic,
  type Epic,
  type ProjectMember,
} from "@/lib/projects-api";
import { searchEpics } from "@/lib/search";
import {
  EPIC_COLOR_DOT_CLASS,
  EPIC_ICON_COMPONENT,
  EPIC_STATUS_LABELS,
  type EpicColor,
  type EpicIcon,
} from "@/lib/epic-style";
import { TICKET_PRIORITY_LABELS } from "@/lib/ticket-priority";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

type SortKey = "name" | "dueDate" | "progress" | "updatedAt";
type View = "cards" | "table";
type StatusFilter = "all" | "backlog" | "in_progress" | "done" | "archived";

function EpicIconBadge({ epic }: { epic: Epic }) {
  const IconComponent = epic.icon ? EPIC_ICON_COMPONENT[epic.icon as EpicIcon] : null;
  const dotClass = epic.color ? EPIC_COLOR_DOT_CLASS[epic.color as EpicColor] : "bg-accent";
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${dotClass}`}
    >
      {IconComponent ? <IconComponent className="h-4.5 w-4.5" /> : null}
    </div>
  );
}

function StatusPill({ epic }: { epic: Epic }) {
  if (epic.archivedAt) {
    return (
      <span className="rounded-full border border-border bg-hover px-2 py-0.5 text-[11px] font-medium text-muted">
        Archived
      </span>
    );
  }
  const styles: Record<string, string> = {
    backlog: "border-border bg-hover text-muted2",
    in_progress: "border-accent/25 bg-accent-soft text-accent",
    done: "border-success/25 bg-success-soft text-success",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[epic.status]}`}
    >
      {EPIC_STATUS_LABELS[epic.status]}
    </span>
  );
}

export default function EpicListPage() {
  const { workspaceId, projectId } = useParams();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [view, setView] = useState<View>("cards");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(wid);
  const canManage = !roleLoading && hasRole("project_manager");
  const canDelete = !roleLoading && hasRole("admin");

  const load = useCallback(() => {
    if (!pid || !wid) return;
    setReady(false);
    fetchEpics(pid, { includeArchived: true })
      .then(setEpics)
      .catch(() => setEpics([]))
      .finally(() => setReady(true));
    fetchWorkspaceMembers(wid)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [pid, wid]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = epics;
    if (statusFilter === "archived") {
      list = list.filter((e) => e.archivedAt);
    } else if (statusFilter !== "all") {
      list = list.filter((e) => !e.archivedAt && e.status === statusFilter);
    } else {
      list = list.filter((e) => !e.archivedAt);
    }
    list = searchEpics(list, query);
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "dueDate":
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
        case "progress":
          return b.progressPercent - a.progressPercent;
        case "updatedAt":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return sorted;
  }, [epics, statusFilter, query, sortKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulkOn = useCallback(
    async (filter: (_epic: Epic) => boolean, fn: (_id: string) => Promise<unknown>) => {
      const ids = epics.filter((e) => selectedIds.has(e.id) && filter(e)).map((e) => e.id);
      if (ids.length === 0) return;
      setBulkBusy(true);
      try {
        await Promise.all(ids.map((id) => fn(id)));
        setSelectedIds(new Set());
        load();
      } finally {
        setBulkBusy(false);
      }
    },
    [epics, selectedIds, load]
  );

  const bulkActions = useMemo(() => {
    const selected = epics.filter((e) => selectedIds.has(e.id));
    const hasActive = selected.some((e) => !e.archivedAt);
    const hasArchived = selected.some((e) => e.archivedAt);
    const actions: BulkAction[] = [];

    if (canManage && hasActive) {
      actions.push({
        label: "Archive",
        icon: <Archive className="h-3.5 w-3.5" />,
        onClick: () =>
          void runBulkOn(
            (e) => !e.archivedAt,
            (id) => archiveEpic(pid, id)
          ),
      });
    }
    if (canManage && hasArchived) {
      actions.push({
        label: "Unarchive",
        icon: <ArchiveRestore className="h-3.5 w-3.5" />,
        onClick: () =>
          void runBulkOn(
            (e) => Boolean(e.archivedAt),
            (id) => unarchiveEpic(pid, id)
          ),
      });
    }
    if (canDelete) {
      actions.push({
        label: "Delete",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        variant: "danger",
        onClick: () => setBulkDeleteConfirm(true),
      });
    }
    return actions;
  }, [canManage, canDelete, epics, selectedIds, pid, runBulkOn]);

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      <EpicFormModal
        projectId={pid}
        members={members}
        mode={editingEpic ? "edit" : "create"}
        epic={editingEpic}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingEpic(null);
        }}
        onSaved={() => load()}
        onDeleted={() => load()}
      />

      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        title={`Delete ${selectedIds.size} epic${selectedIds.size === 1 ? "" : "s"}?`}
        description="Issues and subtasks in these epics are kept — they just lose their epic link. This cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setBulkDeleteConfirm(false);
          void runBulkOn(
            () => true,
            (id) => deleteEpic(pid, id)
          );
        }}
      />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-fg">Epics</h2>
            <p className="text-[12px] text-muted mt-0.5">
              Group related work into epics to track progress at a glance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingEpic(null);
              setFormOpen(true);
            }}
            disabled={!canManage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fg hover:bg-fg-strong text-bg text-[13px] font-semibold rounded-lg transition-all disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            New epic
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search epics…"
              className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-[13px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
          >
            <option value="updatedAt">Last updated</option>
            <option value="name">Name</option>
            <option value="dueDate">Due date</option>
            <option value="progress">Progress</option>
          </select>
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium ${view === "cards" ? "bg-hover-strong text-fg" : "text-muted hover:text-muted2"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium ${view === "table" ? "bg-hover-strong text-fg" : "text-muted hover:text-muted2"}`}
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {!ready ? (
          <EpicsGridSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface/30 px-4 py-10 text-center text-[13px] text-muted">
            {epics.length === 0
              ? "No epics yet. Create one to start grouping related issues."
              : "No epics match your search or filters."}
          </div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((epic) => {
              const owner = members.find((m) => m.userId === epic.ownerId);
              return (
                <div
                  key={epic.id}
                  className="group relative rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-hover"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(epic.id)}
                    onChange={() => toggleSelect(epic.id)}
                    className="absolute left-3 top-3 rounded border-border-strong opacity-0 group-hover:opacity-100 checked:opacity-100"
                    aria-label={`Select ${epic.name}`}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <EpicIconBadge epic={epic} />
                    <ProgressRing percent={epic.progressPercent} size={36} strokeWidth={3.5} />
                  </div>
                  <Link
                    href={`/workspace/${wid}/projects/${pid}/epics/${epic.id}`}
                    className="block truncate text-[14px] font-semibold text-fg hover:text-accent"
                  >
                    {epic.name}
                  </Link>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusPill epic={epic} />
                    <span className="text-[11px] capitalize text-muted">
                      {TICKET_PRIORITY_LABELS[
                        epic.priority as keyof typeof TICKET_PRIORITY_LABELS
                      ] ?? epic.priority}
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar percent={epic.progressPercent} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                    <span>
                      {epic.completedIssueCount}/{epic.issueCount} issues
                    </span>
                    {owner ? <UserAvatar name={owner.name} size="xs" /> : <span>No owner</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2 font-medium">Epic</th>
                  <th className="px-3 py-2 font-medium">Progress</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Due date</th>
                  <th className="px-3 py-2 font-medium">Issues</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((epic) => {
                  const owner = members.find((m) => m.userId === epic.ownerId);
                  return (
                    <tr key={epic.id} className="hover:bg-hover/50">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(epic.id)}
                          onChange={() => toggleSelect(epic.id)}
                          className="rounded border-border-strong"
                          aria-label={`Select ${epic.name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/workspace/${wid}/projects/${pid}/epics/${epic.id}`}
                          className="flex items-center gap-2 font-medium text-fg hover:text-accent"
                        >
                          <EpicIconBadge epic={epic} />
                          <span className="truncate">{epic.name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 w-[140px]">
                        <ProgressBar percent={epic.progressPercent} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill epic={epic} />
                      </td>
                      <td className="px-3 py-2.5 text-muted2">{owner?.name ?? "Unassigned"}</td>
                      <td className="px-3 py-2.5 capitalize text-muted2">{epic.priority}</td>
                      <td className="px-3 py-2.5 text-muted2">{epic.dueDate ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted2">
                        {epic.completedIssueCount}/{epic.issueCount}
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {new Date(epic.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onClear={clearSelection}
        busy={bulkBusy}
        actions={bulkActions}
      />
    </div>
  );
}
