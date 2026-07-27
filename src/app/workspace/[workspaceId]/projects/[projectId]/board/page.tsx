"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import TicketDetailDrawer from "@/components/project/TicketDetailDrawer";
import TicketFormModal from "@/components/project/TicketFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Plus,
  GripVertical,
  Circle,
  ChevronRight,
  Loader2,
  Eye,
  CheckCircle2,
  LayoutGrid,
  Trash2,
  X,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  fetchWorkspaceMembers,
  fetchTickets,
  fetchSprints,
  fetchProject,
  fetchEpics,
  updateProject,
  updateTicket,
  ApiError,
  type BoardColumnConfig,
  type Epic,
  type Project,
  type ProjectMember,
  type ProjectSprint,
  type ProjectTicket,
} from "@/lib/projects-api";
import {
  normalizeBoardColumns,
  slugifyColumnId,
  statusOptionsFromColumns,
} from "@/lib/board-columns";
import { BoardColumnsSkeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/ui/user-avatar";
import BoardToolbar, { type GroupBy } from "@/components/project/BoardToolbar";
import type { LucideIcon } from "lucide-react";

function buildSprintPickerOptions(sprints: ProjectSprint[], currentSprintId: string | null) {
  const opts: { id: string | null; name: string }[] = [{ id: null, name: "Backlog" }];
  for (const s of sprints) {
    if (s.status === "planning" || s.status === "active") {
      opts.push({ id: s.id, name: s.name });
    }
  }
  if (currentSprintId && !opts.some((o) => o.id === currentSprintId)) {
    const cur = sprints.find((x) => x.id === currentSprintId);
    opts.push({
      id: currentSprintId,
      name: cur ? `${cur.name} (completed)` : "Sprint",
    });
  }
  return opts;
}

function getBoardFocusSprintId(sprints: ProjectSprint[]): string | null {
  const active = sprints.find((s) => s.status === "active");
  if (active) return active.id;
  const completed = sprints
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
  return completed[0]?.id ?? null;
}

const COLUMN_ICON_MAP: Record<string, LucideIcon> = {
  todo: Circle,
  in_progress: Loader2,
  review: Eye,
  done: CheckCircle2,
};

const priorityColors: Record<string, string> = {
  urgent: "bg-danger-soft text-danger border-danger/10",
  high: "bg-warning-soft text-warning border-warning/10",
  medium: "bg-accent-soft text-accent border-accent/10",
  low: "bg-hover text-muted border-border",
};

const typeColors: Record<string, string> = {
  feature: "bg-accent2/10 text-accent2",
  bug: "bg-danger-soft text-danger",
  task: "bg-accent-soft text-accent",
  improvement: "bg-success-soft text-success",
};

const COLUMN_DND_MIME = "application/x-sprintflow-board-column-index";

const PRIORITY_GROUP_ORDER = ["urgent", "high", "medium", "low"];
const TYPE_GROUP_ORDER = ["feature", "bug", "task", "improvement"];

interface TicketGroup {
  key: string;
  label: string;
  tickets: ProjectTicket[];
}

/** Splits a column's tickets into labeled sections for the "Group by" board mode.
 * "epic" grouping is what renders the board's epic swimlanes. */
function groupColumnTickets(
  tickets: ProjectTicket[],
  groupBy: GroupBy,
  epicNameById: Map<string, string>
): TicketGroup[] {
  if (groupBy === "none") {
    return [{ key: "all", label: "", tickets }];
  }

  const map = new Map<string, TicketGroup>();
  for (const t of tickets) {
    let key: string;
    let label: string;
    if (groupBy === "assignee") {
      key = t.assigneeId ?? "unassigned";
      label = t.assigneeName ?? "Unassigned";
    } else if (groupBy === "priority") {
      key = t.priority || "medium";
      label = key.charAt(0).toUpperCase() + key.slice(1);
    } else if (groupBy === "epic") {
      key = t.epicId ?? "no_epic";
      label = t.epicId ? (epicNameById.get(t.epicId) ?? "Unknown epic") : "No epic";
    } else {
      key = t.type || "task";
      label = key.charAt(0).toUpperCase() + key.slice(1);
    }
    const existing = map.get(key);
    if (existing) existing.tickets.push(t);
    else map.set(key, { key, label, tickets: [t] });
  }

  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    if (groupBy === "priority") {
      return PRIORITY_GROUP_ORDER.indexOf(a.key) - PRIORITY_GROUP_ORDER.indexOf(b.key);
    }
    if (groupBy === "type") {
      return TYPE_GROUP_ORDER.indexOf(a.key) - TYPE_GROUP_ORDER.indexOf(b.key);
    }
    if (groupBy === "epic") {
      if (a.key === "no_epic") return 1;
      if (b.key === "no_epic") return -1;
      return a.label.localeCompare(b.label);
    }
    // Assignee: named people first (alphabetical), unassigned last.
    if (a.key === "unassigned") return 1;
    if (b.key === "unassigned") return -1;
    return a.label.localeCompare(b.label);
  });
  return groups;
}

/** Strip index k = drop before column k; k === len = after last column. */
function columnInsertIndexAfterRemove(from: number, k: number, len: number): number {
  if (k >= len) return len - 1;
  if (from < k) return k - 1;
  return k;
}

function moveColumnToSlot(cols: BoardColumnConfig[], from: number, k: number): BoardColumnConfig[] {
  const n = cols.length;
  if (from < 0 || from >= n || n < 2) return cols;
  const insertAt = columnInsertIndexAfterRemove(from, k, n);
  const next = [...cols];
  const [item] = next.splice(from, 1);
  next.splice(insertAt, 0, item);
  return next;
}

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [sprints, setSprints] = useState<ProjectSprint[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [columnError, setColumnError] = useState<string | null>(null);
  const [boardReady, setBoardReady] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<string>("todo");

  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailPreview, setDetailPreview] = useState<ProjectTicket | null>(null);

  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [columnDropSlot, setColumnDropSlot] = useState<number | null>(null);

  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addColumnInsertIndex, setAddColumnInsertIndex] = useState<number | null>(null);
  const [savingColumns, setSavingColumns] = useState(false);

  const [removeCtx, setRemoveCtx] = useState<{
    column: BoardColumnConfig;
    migrateTo: string;
    ticketCount: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [epicFilter, setEpicFilter] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const epicNameById = useMemo(() => new Map(epics.map((e) => [e.id, e.name])), [epics]);

  const memberAvatarById = useMemo(
    () => new Map(members.map((m) => [m.userId, m.avatarUrl ?? null])),
    [members]
  );

  const toggleInList = useCallback(
    (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setAssigneeFilter([]);
    setTypeFilter([]);
    setPriorityFilter([]);
    setEpicFilter([]);
  }, []);

  const matchesFilters = useCallback(
    (t: ProjectTicket) => {
      const q = search.trim().toLowerCase();
      if (q && !`${t.key} ${t.title}`.toLowerCase().includes(q)) return false;
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(t.assigneeId ?? "unassigned")) {
        return false;
      }
      if (typeFilter.length > 0 && !typeFilter.includes(t.type)) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
      if (epicFilter.length > 0 && !epicFilter.includes(t.epicId ?? "")) return false;
      return true;
    },
    [search, assigneeFilter, typeFilter, priorityFilter, epicFilter]
  );

  const boardColumnDefs = useMemo(
    () => normalizeBoardColumns(project?.boardColumns ?? null),
    [project?.boardColumns]
  );

  const statusFormOptions = useMemo(
    () => statusOptionsFromColumns(boardColumnDefs),
    [boardColumnDefs]
  );

  const columnIdSet = useMemo(() => new Set(boardColumnDefs.map((c) => c.id)), [boardColumnDefs]);

  const loadData = useCallback(() => {
    if (!pid || !wid) return;
    setBoardReady(false);
    Promise.all([
      fetchTickets(pid),
      fetchWorkspaceMembers(wid),
      fetchSprints(pid),
      fetchProject(pid),
      fetchEpics(pid),
    ])
      .then(([t, m, sp, p, e]) => {
        setTickets(t);
        setMembers(m);
        setSprints(sp);
        setProject(p);
        setEpics(e);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load board"))
      .finally(() => setBoardReady(true));
  }, [pid, wid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!wid) return;
    const refreshMembers = () => {
      void fetchWorkspaceMembers(wid)
        .then(setMembers)
        .catch(() => {});
    };
    window.addEventListener("sf-profile-updated", refreshMembers);
    return () => window.removeEventListener("sf-profile-updated", refreshMembers);
  }, [wid]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setDetailTicketId(null);
      setDetailPreview(null);
      setCreateInitialStatus(boardColumnDefs[0]?.id ?? "todo");
      setCreateModalOpen(true);
    }
  }, [searchParams, boardColumnDefs]);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    router.replace(pathname);
  }, [router, pathname]);

  const sprintPickerForForm = useMemo(
    () =>
      sprints
        .filter((s) => s.status === "planning" || s.status === "active")
        .map((s) => ({ id: s.id, name: s.name })),
    [sprints]
  );

  const detailSprintId =
    detailPreview?.sprintId ?? tickets.find((t) => t.id === detailTicketId)?.sprintId ?? null;

  const sprintPickerOptions = useMemo(
    () => buildSprintPickerOptions(sprints, detailSprintId),
    [sprints, detailSprintId]
  );

  const boardFocusSprintId = useMemo(() => getBoardFocusSprintId(sprints), [sprints]);

  const boardFocusMeta = useMemo(() => {
    if (!boardFocusSprintId) {
      return {
        sprintId: null as string | null,
        title: "Empty board",
        subtitle:
          "Only tickets assigned to an active sprint or the most recently completed sprint appear here. If nothing has been started or finished yet, plan work in Backlog — unscheduled tickets stay off this board.",
        mode: "backlog" as const,
      };
    }
    const sp = sprints.find((s) => s.id === boardFocusSprintId);
    if (!sp) {
      return {
        sprintId: boardFocusSprintId,
        title: "Sprint",
        subtitle: "",
        mode: "active" as const,
      };
    }
    if (sp.status === "active") {
      return {
        sprintId: sp.id,
        title: sp.name,
        subtitle: "Active sprint — only tickets in this sprint appear on the board.",
        mode: "active" as const,
      };
    }
    return {
      sprintId: sp.id,
      title: sp.name,
      subtitle:
        "Last completed sprint — board stays here until you start the next sprint. Incomplete items are on the backlog.",
      mode: "last_completed" as const,
    };
  }, [sprints, boardFocusSprintId]);

  /** Sprint board never lists backlog-only tickets (`sprintId === null`). When no
   * active/completed sprint exists yet, show nothing. Subtasks are never independent
   * board cards — they're not sprint-scheduled and render nested inside their parent. */
  const boardTickets = useMemo(() => {
    if (boardFocusSprintId === null) return [];
    return tickets.filter((t) => t.sprintId === boardFocusSprintId && !t.parentTaskId);
  }, [tickets, boardFocusSprintId]);

  const orphanBoardTickets = useMemo(
    () => boardTickets.filter((t) => !columnIdSet.has(t.status)),
    [boardTickets, columnIdSet]
  );

  const persistBoardColumns = useCallback(
    async (cols: BoardColumnConfig[]) => {
      setSavingColumns(true);
      setColumnError(null);
      try {
        const updated = await updateProject(pid, { boardColumns: cols });
        setProject(updated);
      } catch (e) {
        setColumnError(e instanceof Error ? e.message : "Could not save columns");
      } finally {
        setSavingColumns(false);
      }
    },
    [pid]
  );

  const openCreate = useCallback(
    (status: string) => {
      setDetailTicketId(null);
      setDetailPreview(null);
      setCreateInitialStatus(status || boardColumnDefs[0]?.id || "todo");
      setCreateModalOpen(true);
    },
    [boardColumnDefs]
  );

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
    setDraggedColumnIndex(null);
    setColumnDropSlot(null);
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ticketId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTicketId(null);
    setDragOverColumn(null);
    setDropTargetIndex(null);
    dragCounterRef.current = {};
    setDraggedColumnIndex(null);
    setColumnDropSlot(null);
  }, []);

  const handleColumnHeaderDragStart = useCallback((e: React.DragEvent, columnIndex: number) => {
    setDraggedTicketId(null);
    setDragOverColumn(null);
    setDropTargetIndex(null);
    dragCounterRef.current = {};
    setDraggedColumnIndex(columnIndex);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(COLUMN_DND_MIME, String(columnIndex));
    try {
      e.dataTransfer.setData("text/plain", "");
    } catch {
      /* ignore */
    }
  }, []);

  const handleColumnSlotDragOver = useCallback((e: React.DragEvent, slotIndex: number) => {
    if (!e.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setColumnDropSlot(slotIndex);
  }, []);

  const handleColumnSlotDrop = useCallback(
    async (e: React.DragEvent, slotIndex: number) => {
      const raw = e.dataTransfer.getData(COLUMN_DND_MIME);
      if (raw === "") return;
      const from = Number(raw);
      if (!Number.isInteger(from) || from < 0 || from >= boardColumnDefs.length) return;
      e.preventDefault();
      e.stopPropagation();
      setColumnDropSlot(null);
      setDraggedColumnIndex(null);
      const next = moveColumnToSlot(boardColumnDefs, from, slotIndex);
      const same =
        next.length === boardColumnDefs.length &&
        next.every((c, i) => c.id === boardColumnDefs[i]?.id);
      if (same) return;
      await persistBoardColumns(next);
    },
    [boardColumnDefs, persistBoardColumns]
  );

  const openAddColumnAt = useCallback((insertIndex: number | null) => {
    setAddColumnInsertIndex(insertIndex);
    setNewColumnTitle("");
    setAddColumnOpen(true);
  }, []);

  const handleColumnDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    if (e.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
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
    if (e.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleCardDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (e.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropTargetIndex(e.clientY < midY ? index : index + 1);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, columnId: string) => {
      if (e.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
      e.preventDefault();
      const ticketId = e.dataTransfer.getData("text/plain");
      if (!ticketId || !pid) return;

      const focusId = boardFocusSprintId;
      const inBoardColumn = (t: ProjectTicket, col: string) =>
        t.status === col && t.sprintId === focusId;

      // AUD-035: previously snapshotted the *entire* tickets array and restored it
      // wholesale on failure. If a second drag succeeded while this one was still in
      // flight, that success was silently discarded by the rollback. Only this ticket's
      // own prior status is captured, and rollback is applied functionally against
      // whatever the current state is when it runs — so it can never clobber an
      // unrelated concurrent update.
      const originalTicket = tickets.find((t) => t.id === ticketId);
      const previousStatus = originalTicket?.status;

      setTickets((cur) => {
        const updated = cur.map((t) => (t.id === ticketId ? { ...t, status: columnId } : t));
        if (dropTargetIndex !== null) {
          const moved = updated.find((t) => t.id === ticketId);
          if (moved) {
            const without = updated.filter((t) => t.id !== ticketId);
            const inCol = without.filter((t) => inBoardColumn(t, columnId));
            const rest = without.filter((t) => !inBoardColumn(t, columnId));
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
        // AUD-036: send the last-known updatedAt so the server can detect if someone
        // else changed this ticket in between (e.g. another user dragging it to a
        // different column at the same time) instead of silently last-write-wins.
        await updateTicket(pid, ticketId, {
          status: columnId,
          expectedUpdatedAt: originalTicket?.updatedAt,
        });
      } catch (err) {
        if (previousStatus !== undefined) {
          setTickets((cur) =>
            cur.map((t) => (t.id === ticketId ? { ...t, status: previousStatus } : t))
          );
        }
        if (err instanceof ApiError && err.status === 409) {
          setConflictError(
            "Someone else updated this ticket at the same time. The board has been reverted — please try again."
          );
        }
      }
    },
    [dropTargetIndex, pid, tickets, boardFocusSprintId]
  );

  const handleAddColumn = useCallback(async () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    const ids = new Set(boardColumnDefs.map((c) => c.id));
    const id = slugifyColumnId(title, ids);
    const at =
      addColumnInsertIndex === null
        ? boardColumnDefs.length
        : Math.max(0, Math.min(addColumnInsertIndex, boardColumnDefs.length));
    const newCol: BoardColumnConfig = {
      id,
      title,
      dotColor: at % 2 === 0 ? "bg-sky-500" : "bg-violet-500",
    };
    const next = [...boardColumnDefs.slice(0, at), newCol, ...boardColumnDefs.slice(at)];
    setAddColumnOpen(false);
    setNewColumnTitle("");
    setAddColumnInsertIndex(null);
    await persistBoardColumns(next);
  }, [boardColumnDefs, newColumnTitle, persistBoardColumns, addColumnInsertIndex]);

  const openRemoveColumn = useCallback(
    (column: BoardColumnConfig) => {
      if (boardColumnDefs.length <= 2) return;
      const others = boardColumnDefs.filter((c) => c.id !== column.id);
      const affected = tickets.filter((t) => t.status === column.id).length;
      setRemoveCtx({
        column,
        migrateTo: others[0]?.id ?? "todo",
        ticketCount: affected,
      });
    },
    [boardColumnDefs, tickets]
  );

  const confirmRemoveColumn = useCallback(async () => {
    if (!removeCtx) return;
    const { column, migrateTo } = removeCtx;
    const nextCols = boardColumnDefs.filter((c) => c.id !== column.id);
    const affectedTickets = tickets.filter((t) => t.status === column.id);
    try {
      for (const t of affectedTickets) {
        await updateTicket(pid, t.id, { status: migrateTo });
      }
      setTickets((prev) =>
        prev.map((t) => (t.status === column.id ? { ...t, status: migrateTo } : t))
      );
      await persistBoardColumns(nextCols);
    } catch (e) {
      setColumnError(e instanceof Error ? e.message : "Could not remove column");
    } finally {
      setRemoveCtx(null);
    }
  }, [removeCtx, boardColumnDefs, tickets, pid, persistBoardColumns]);

  const renderTicketCard = (
    ticket: ProjectTicket,
    index: number,
    columnId: string,
    isOver: boolean,
    enableReorder: boolean
  ) => (
    <div key={ticket.id}>
      {enableReorder && isOver && dropTargetIndex === index && (
        <div className="h-0.5 bg-accent rounded-full mx-1 mb-1 animate-pulse shadow-[0_0_6px_var(--color-accent-soft)]" />
      )}
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, ticket.id)}
        onDragEnd={handleDragEnd}
        onDragOver={enableReorder ? (e) => handleCardDragOver(e, index) : undefined}
        onDrop={(e) => void handleDrop(e, columnId)}
        onClick={() => openDetail(ticket)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(ticket);
          }
        }}
        tabIndex={0}
        className={`group/card relative cursor-pointer rounded-lg border border-border bg-surface p-3.5 pr-10 shadow-sm transition-all select-none hover:border-border-hover hover:bg-surface-hover active:cursor-grabbing ${
          draggedTicketId === ticket.id ? "opacity-40 scale-[0.98]" : ""
        }`}
      >
        <div className="pointer-events-none absolute top-2.5 right-2.5 text-muted" aria-hidden>
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
          {ticket.blockedByOpenDependencies ? (
            <span
              className="inline-flex items-center gap-0.5 rounded border border-warning/20 bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning"
              title="Blocked by prerequisites not done yet"
            >
              <Link2 className="h-3 w-3" aria-hidden />
              Waiting
            </span>
          ) : null}
        </div>

        <div className="mb-1 font-mono text-[11px] text-muted">{ticket.key}</div>

        <h4 className="mb-4 text-[13px] font-medium leading-snug text-muted2 group-hover/card:text-fg">
          {ticket.title}
        </h4>

        <div className="flex items-center justify-between">
          <UserAvatar
            name={ticket.assigneeName}
            avatarUrl={ticket.assigneeId ? (memberAvatarById.get(ticket.assigneeId) ?? null) : null}
            size="xs"
            className="border border-border bg-surface-2 font-semibold text-muted2"
            title={ticket.assigneeName ?? "Unassigned"}
          />
          {ticket.storyPoints !== null && ticket.storyPoints !== undefined && (
            <div className="rounded bg-surface-2/80 px-1.5 py-0.5 text-[10px] font-medium text-muted">
              {ticket.storyPoints} pts
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderColumnCards = (
    column: BoardColumnConfig,
    columnTickets: ProjectTicket[],
    isOver: boolean
  ) => {
    if (groupBy === "none") {
      return (
        <>
          {columnTickets.map((ticket, index) =>
            renderTicketCard(ticket, index, column.id, isOver, true)
          )}
          {isOver && dropTargetIndex === columnTickets.length && (
            <div className="h-0.5 bg-accent rounded-full mx-1 animate-pulse shadow-[0_0_6px_var(--color-accent-soft)]" />
          )}
        </>
      );
    }

    const groups = groupColumnTickets(columnTickets, groupBy, epicNameById);
    return (
      <>
        {groups.map((g) => {
          const groupCollapseKey = `${column.id}:${g.key}`;
          const isCollapsed = collapsedGroups.has(groupCollapseKey);
          return (
            <div key={g.key} className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setCollapsedGroups((prev) => {
                    const next = new Set(prev);
                    if (next.has(groupCollapseKey)) next.delete(groupCollapseKey);
                    else next.add(groupCollapseKey);
                    return next;
                  })
                }
                className="flex w-full items-center gap-2 px-1 pt-1"
              >
                <ChevronRight
                  className={`h-3 w-3 shrink-0 text-muted transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {g.label}
                </span>
                <span className="shrink-0 rounded bg-surface-2/60 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {g.tickets.length}
                </span>
                <div className="h-px flex-1 bg-hover" />
              </button>
              {!isCollapsed &&
                g.tickets.map((ticket, index) =>
                  renderTicketCard(ticket, index, column.id, isOver, false)
                )}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      {loadError && (
        <div className="px-10 py-2 text-[12px] text-warning bg-warning-soft border-b border-warning/10">
          {loadError}
        </div>
      )}

      {conflictError && (
        <div className="px-10 py-2 text-[12px] text-danger bg-danger-soft border-b border-danger/10 flex justify-between gap-4">
          <span>{conflictError}</span>
          <button
            type="button"
            onClick={() => setConflictError(null)}
            className="text-danger/70 hover:text-danger"
          >
            Dismiss
          </button>
        </div>
      )}

      {columnError && (
        <div className="px-10 py-2 text-[12px] text-danger bg-danger-soft border-b border-danger/10 flex justify-between gap-4">
          <span>{columnError}</span>
          <button
            type="button"
            onClick={() => setColumnError(null)}
            className="shrink-0 text-muted2 hover:text-fg"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="shrink-0 border-b border-border bg-surface-sunken px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-[1600px] mx-auto">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Board scope
            </p>
            <p className="text-[13px] font-medium text-fg truncate">
              {boardFocusMeta.mode === "backlog" && boardFocusMeta.title}
              {boardFocusMeta.mode === "active" && `Active: ${boardFocusMeta.title}`}
              {boardFocusMeta.mode === "last_completed" && `Last sprint: ${boardFocusMeta.title}`}
            </p>
            <p className="text-[11px] text-muted mt-0.5 max-w-2xl">{boardFocusMeta.subtitle}</p>
          </div>
          <Link
            href={`/workspace/${wid}/projects/${pid}/backlog`}
            className="shrink-0 text-[12px] font-medium text-accent hover:text-accent-strong"
          >
            Open backlog
          </Link>
        </div>
      </div>

      {boardReady && boardFocusSprintId && (
        <BoardToolbar
          search={search}
          onSearchChange={setSearch}
          members={members}
          assigneeFilter={assigneeFilter}
          onToggleAssignee={(id) => toggleInList(id, setAssigneeFilter)}
          typeFilter={typeFilter}
          priorityFilter={priorityFilter}
          onToggleType={(t) => toggleInList(t, setTypeFilter)}
          onTogglePriority={(p) => toggleInList(p, setPriorityFilter)}
          epics={epics}
          epicFilter={epicFilter}
          onToggleEpic={(id) => toggleInList(id, setEpicFilter)}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          onClearFilters={clearFilters}
        />
      )}

      {addColumnOpen && (
        <div
          className="fixed inset-0 z-[1050] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
          onClick={() => {
            if (!savingColumns) {
              setAddColumnOpen(false);
              setAddColumnInsertIndex(null);
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border-hover bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-fg">Add column</h2>
              <button
                type="button"
                disabled={savingColumns}
                onClick={() => {
                  setAddColumnOpen(false);
                  setAddColumnInsertIndex(null);
                }}
                className="p-1 rounded-md text-muted hover:text-muted2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {addColumnInsertIndex !== null &&
              addColumnInsertIndex < boardColumnDefs.length &&
              boardColumnDefs[addColumnInsertIndex] && (
                <p className="mb-3 text-[11px] text-muted">
                  New column will be inserted before &ldquo;
                  {boardColumnDefs[addColumnInsertIndex].title}
                  &rdquo; (divider +).
                </p>
              )}
            <label className="mb-1 block text-[11px] font-medium text-muted">Column name</label>
            <input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="e.g. Blocked, QA"
              className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[14px] text-fg focus:border-accent/40 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={savingColumns}
                onClick={() => {
                  setAddColumnOpen(false);
                  setAddColumnInsertIndex(null);
                }}
                className="rounded-lg px-3 py-2 text-[13px] text-muted2 hover:bg-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingColumns || !newColumnTitle.trim()}
                onClick={() => void handleAddColumn()}
                className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg disabled:opacity-40"
              >
                {savingColumns && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add column
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={removeCtx !== null}
        onClose={() => !savingColumns && setRemoveCtx(null)}
        title={removeCtx ? `Remove “${removeCtx.column.title}”?` : ""}
        description={
          removeCtx ? (
            <div className="space-y-3">
              <p>
                {removeCtx.ticketCount > 0
                  ? `${removeCtx.ticketCount} ticket(s) use this status. Move them to:`
                  : "No tickets in this column. It will be removed from the board."}
              </p>
              {removeCtx.ticketCount > 0 && (
                <select
                  value={removeCtx.migrateTo}
                  onChange={(e) =>
                    setRemoveCtx((c) => (c ? { ...c, migrateTo: e.target.value } : null))
                  }
                  className="w-full rounded-lg border border-border-hover bg-surface-2/90 px-3 py-2 text-[13px] text-fg"
                >
                  {boardColumnDefs
                    .filter((c) => c.id !== removeCtx.column.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </select>
              )}
            </div>
          ) : null
        }
        confirmLabel="Remove column"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmRemoveColumn}
      />

      {createModalOpen && (
        <TicketFormModal
          projectId={pid}
          members={members}
          mode="create"
          ticket={null}
          initialStatus={createInitialStatus}
          sprintPickerSprints={sprintPickerForForm}
          defaultSprintId={boardFocusSprintId}
          statusOptions={statusFormOptions}
          linkableTickets={tickets}
          epics={epics}
          isOpen={createModalOpen}
          onClose={closeCreateModal}
          onSaved={handleTicketSaved}
        />
      )}

      {detailTicketId && (
        <TicketDetailDrawer
          projectId={pid}
          workspaceId={wid}
          ticketId={detailTicketId}
          preview={detailPreview}
          members={members}
          sprintPickerOptions={sprintPickerOptions}
          statusOptions={statusFormOptions}
          linkableTickets={tickets}
          epics={epics}
          allTickets={tickets}
          onNavigateToTicket={(id) => setDetailTicketId(id)}
          isOpen={Boolean(detailTicketId)}
          onClose={closeDetail}
          onUpdated={handleTicketSaved}
          onDeleted={handleTicketDeleted}
        />
      )}

      {!boardReady ? (
        <div className="flex-1 overflow-x-auto p-6 flex flex-nowrap items-stretch gap-0 custom-scrollbar min-h-[320px]">
          <BoardColumnsSkeleton />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-6 flex flex-nowrap items-stretch gap-0 custom-scrollbar">
          {boardColumnDefs.map((column, columnIndex) => {
            const columnTickets = boardTickets.filter(
              (t) => t.status === column.id && matchesFilters(t)
            );
            const isOver = dragOverColumn === column.id && draggedTicketId !== null;
            const ColIcon = COLUMN_ICON_MAP[column.id] ?? LayoutGrid;
            const slotActive = columnDropSlot === columnIndex && draggedColumnIndex !== null;

            return (
              <div key={column.id} className="flex flex-nowrap items-stretch shrink-0">
                <div
                  role="separator"
                  aria-orientation="vertical"
                  className={`group/slot relative flex w-3 shrink-0 flex-col items-center justify-stretch py-2 transition-colors ${
                    slotActive ? "bg-accent/15" : "hover:bg-hover"
                  }`}
                  onDragOver={(e) => handleColumnSlotDragOver(e, columnIndex)}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                      setColumnDropSlot(null);
                  }}
                  onDrop={(e) => void handleColumnSlotDrop(e, columnIndex)}
                >
                  <div
                    className={`mx-auto my-auto min-h-[48px] w-0.5 rounded-full transition-all ${
                      slotActive
                        ? "h-full min-h-[120px] bg-accent shadow-[0_0_12px_var(--color-accent-soft)]"
                        : "h-16 bg-hover-strong"
                    }`}
                  />
                  <button
                    type="button"
                    title="Add column here"
                    disabled={savingColumns || boardColumnDefs.length >= 12}
                    onClick={() => openAddColumnAt(columnIndex)}
                    className="absolute bottom-1 left-1/2 z-[1] -translate-x-1/2 rounded p-0.5 text-muted opacity-0 hover:text-muted2 group-hover/slot:opacity-100 hover:opacity-100 disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-col w-[300px] shrink-0 group/col px-1">
                  <div
                    className={`flex items-center justify-between mb-3 px-1 gap-1 rounded-lg border border-transparent ${
                      draggedColumnIndex === columnIndex ? "opacity-50 border-border" : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <div
                        className="shrink-0 cursor-grab rounded p-0.5 text-muted hover:bg-hover active:cursor-grabbing"
                        draggable
                        title="Drag to reorder column"
                        onDragStart={(e) => handleColumnHeaderDragStart(e, columnIndex)}
                        onDragEnd={handleDragEnd}
                      >
                        <GripVertical className="w-3.5 h-3.5" aria-hidden />
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className={`w-2 h-2 shrink-0 rounded-full ${column.dotColor ?? "bg-zinc-500"}`}
                        />
                        <ColIcon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                        <h3 className="truncate text-[13px] font-semibold text-muted2">
                          {column.title}
                        </h3>
                        <span className="shrink-0 rounded bg-surface-2/60 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                          {columnTickets.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {boardColumnDefs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => openRemoveColumn(column)}
                          disabled={savingColumns}
                          className="p-1 text-muted hover:text-danger hover:bg-hover rounded-md transition-all opacity-0 group-hover/col:opacity-100 disabled:opacity-30"
                          title="Remove column"
                          aria-label={`Remove column ${column.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openCreate(column.id)}
                        className="p-1 text-muted hover:text-muted2 hover:bg-hover rounded-md transition-all opacity-0 group-hover/col:opacity-100"
                        aria-label={`Add ticket to ${column.title}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`flex-1 space-y-2 overflow-y-auto custom-scrollbar rounded-xl p-2 border transition-all duration-200 min-h-[120px] ${
                      isOver
                        ? "bg-accent/[0.04] border-accent/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                        : "bg-surface-2/30 border-border"
                    }`}
                    onDragEnter={(e) => handleColumnDragEnter(e, column.id)}
                    onDragLeave={() => handleColumnDragLeave(column.id)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => void handleDrop(e, column.id)}
                  >
                    {renderColumnCards(column, columnTickets, isOver)}

                    <button
                      type="button"
                      onClick={() => openCreate(column.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-transparent py-2.5 text-[12px] font-medium text-muted transition-all hover:border-border hover:bg-hover hover:text-muted2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add task
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            role="separator"
            aria-orientation="vertical"
            className={`group/slot relative flex w-3 shrink-0 flex-col items-center justify-stretch py-2 transition-colors ${
              columnDropSlot === boardColumnDefs.length && draggedColumnIndex !== null
                ? "bg-accent/15"
                : "hover:bg-hover"
            }`}
            onDragOver={(e) => handleColumnSlotDragOver(e, boardColumnDefs.length)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                setColumnDropSlot(null);
            }}
            onDrop={(e) => void handleColumnSlotDrop(e, boardColumnDefs.length)}
          >
            <div
              className={`mx-auto my-auto min-h-[48px] w-0.5 rounded-full transition-all ${
                columnDropSlot === boardColumnDefs.length && draggedColumnIndex !== null
                  ? "h-full min-h-[120px] bg-accent shadow-[0_0_12px_var(--color-accent-soft)]"
                  : "h-16 bg-hover-strong"
              }`}
            />
            <button
              type="button"
              title="Add column at end"
              disabled={savingColumns || boardColumnDefs.length >= 12}
              onClick={() => openAddColumnAt(null)}
              className="absolute bottom-1 left-1/2 z-[1] -translate-x-1/2 rounded p-0.5 text-muted opacity-0 hover:text-muted2 group-hover/slot:opacity-100 hover:opacity-100 disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {orphanBoardTickets.length > 0 && (
            <div className="flex flex-col w-[280px] shrink-0 border border-warning/20 rounded-xl bg-warning-soft p-3">
              <p className="text-[11px] font-semibold text-warning mb-1">Other statuses</p>
              <p className="text-[10px] text-muted mb-2">
                These tickets do not match any board column. Drag them into a column or add a column
                with this status id.
              </p>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {orphanBoardTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => openDetail(ticket)}
                    className="w-full text-left rounded-lg border border-border bg-surface/80 px-3 py-2 hover:bg-surface-hover"
                  >
                    <span className="font-mono text-[10px] text-muted">{ticket.key}</span>
                    <span className="block text-[12px] text-muted2 truncate">{ticket.title}</span>
                    <span className="text-[10px] text-warning">status: {ticket.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => openAddColumnAt(null)}
            disabled={savingColumns || boardColumnDefs.length >= 12}
            className="flex w-[300px] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-border transition-all hover:border-border-hover hover:bg-hover disabled:opacity-40 disabled:pointer-events-none min-h-[160px]"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-hover text-muted">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-[12px] font-medium text-muted">Add column</span>
            {boardColumnDefs.length >= 12 && (
              <span className="text-[10px] text-muted mt-1">Max 12 columns</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
