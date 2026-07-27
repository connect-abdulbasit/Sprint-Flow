"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Milestone,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import EpicFormModal from "@/components/project/EpicFormModal";
import TicketFormModal from "@/components/project/TicketFormModal";
import TicketDetailDrawer from "@/components/project/TicketDetailDrawer";
import CommentsPanel from "@/components/project/detail/CommentsPanel";
import ActivityPanel from "@/components/project/detail/ActivityPanel";
import AttachmentsPanel from "@/components/project/detail/AttachmentsPanel";
import { ProgressRing, ProgressBar } from "@/components/project/detail/ProgressRing";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EpicDetailSkeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/ui/user-avatar";
import {
  archiveEpic,
  createEpicAttachment,
  deleteAttachment,
  deleteEpic,
  duplicateEpic,
  fetchEpic,
  fetchEpicActivity,
  fetchEpicAttachments,
  fetchTickets,
  fetchWorkspaceMembers,
  unarchiveEpic,
  type Epic,
  type ProjectMember,
  type ProjectTicket,
} from "@/lib/projects-api";
import { groupIssuesWithSubtasks, type IssueWithSubtasks } from "@/lib/issue-hierarchy";
import {
  EPIC_COLOR_DOT_CLASS,
  EPIC_ICON_COMPONENT,
  EPIC_STATUS_LABELS,
  type EpicColor,
  type EpicIcon,
} from "@/lib/epic-style";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

function IssueTypeGroup({
  title,
  issues,
  onOpen,
}: {
  title: string;
  issues: IssueWithSubtasks[];
  onOpen: (_id: string) => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {title} ({issues.length})
      </h4>
      <div className="space-y-1.5">
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={() => onOpen(issue.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-hover/60"
            >
              <span className="font-mono text-[11px] text-muted">{issue.key}</span>
              <span
                className={`min-w-0 flex-1 truncate text-[13px] ${issue.status === "done" ? "text-muted line-through" : "text-fg"}`}
              >
                {issue.title}
              </span>
              {issue.subtasks.length > 0 && (
                <span className="shrink-0 text-[11px] text-muted">
                  {issue.subtasks.filter((s) => s.status === "done").length}/{issue.subtasks.length}
                </span>
              )}
              <span className="shrink-0 rounded-full border border-border bg-hover px-2 py-0.5 text-[10px] capitalize text-muted2">
                {issue.status.replace(/_/g, " ")}
              </span>
            </button>
            {issue.subtasks.length > 0 && (
              <div className="space-y-1 border-t border-border px-3 py-1.5 pl-8">
                {issue.subtasks.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onOpen(s.id)}
                    className={`block w-full truncate text-left text-[12px] hover:underline ${s.status === "done" ? "text-muted line-through" : "text-muted2"}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EpicDetailPage() {
  const { workspaceId, projectId, epicId } = useParams();
  const router = useRouter();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const eid = typeof epicId === "string" ? epicId : (epicId?.[0] ?? "");

  const [epic, setEpic] = useState<Epic | null>(null);
  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(wid);
  const canManage = !roleLoading && hasRole("project_manager");
  const canDelete = !roleLoading && hasRole("admin");

  // Resetting to the skeleton belongs to navigating to a *different* epic,
  // not to every background refresh — otherwise refreshing after a mutation
  // made through the open ticket drawer (e.g. adding a subtask) would
  // unmount the page's whole JSX tree, taking the drawer down with it and
  // snapping an in-progress edit back to a loading state.
  useEffect(() => {
    setReady(false);
  }, [eid]);

  const load = useCallback(() => {
    if (!pid || !eid || !wid) return;
    Promise.all([fetchEpic(pid, eid), fetchTickets(pid), fetchWorkspaceMembers(wid)])
      .then(([e, t, m]) => {
        setEpic(e);
        setTickets(t);
        setMembers(m);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setReady(true));
  }, [pid, eid, wid]);

  useEffect(() => {
    load();
  }, [load]);

  const issues = useMemo(
    () => groupIssuesWithSubtasks(tickets).filter((i) => i.epicId === eid),
    [tickets, eid]
  );

  const grouped = useMemo(
    () => ({
      story: issues.filter((i) => i.type === "story"),
      task: issues.filter(
        (i) => i.type === "task" || i.type === "feature" || i.type === "improvement"
      ),
      bug: issues.filter((i) => i.type === "bug"),
    }),
    [issues]
  );

  const owner = members.find((m) => m.userId === epic?.ownerId);
  const IconComponent = epic?.icon ? EPIC_ICON_COMPONENT[epic.icon as EpicIcon] : Milestone;
  const dotClass = epic?.color ? EPIC_COLOR_DOT_CLASS[epic.color as EpicColor] : "bg-accent";

  if (!ready) {
    return (
      <div className="flex flex-col h-full bg-surface-sunken">
        <ProjectPageHeader />
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          <EpicDetailSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !epic) {
    return (
      <div className="flex flex-col h-full bg-surface-sunken">
        <ProjectPageHeader />
        <div className="flex-1 flex items-center justify-center text-[13px] text-muted">
          Epic not found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      <EpicFormModal
        projectId={pid}
        members={members}
        mode="edit"
        epic={epic}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setEpic(updated);
          setRefreshTick((n) => n + 1);
        }}
        onDeleted={() => router.push(`/workspace/${wid}/projects/${pid}/epics`)}
      />

      <TicketFormModal
        projectId={pid}
        members={members}
        mode="create"
        ticket={null}
        defaultEpicId={eid}
        epics={[epic]}
        isOpen={createIssueOpen}
        onClose={() => setCreateIssueOpen(false)}
        onSaved={() => {
          setCreateIssueOpen(false);
          load();
        }}
      />

      {detailTicketId && (
        <TicketDetailDrawer
          projectId={pid}
          workspaceId={wid}
          ticketId={detailTicketId}
          members={members}
          linkableTickets={tickets}
          epics={[epic]}
          allTickets={tickets}
          onNavigateToTicket={(id) => setDetailTicketId(id)}
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
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={`Delete "${epic.name}"?`}
        description="Issues and subtasks in this epic are kept — they just lose their epic link. This cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          void deleteEpic(pid, eid).then(() =>
            router.push(`/workspace/${wid}/projects/${pid}/epics`)
          );
        }}
      />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        <Breadcrumbs
          items={[
            { label: "Epics", href: `/workspace/${wid}/projects/${pid}/epics` },
            { label: epic.name },
          ]}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${dotClass}`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg tracking-tight">{epic.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <span className="rounded-full border border-border bg-hover px-2 py-0.5 font-medium text-muted2">
                  {EPIC_STATUS_LABELS[epic.status]}
                </span>
                <span className="capitalize">{epic.priority} priority</span>
                {epic.dueDate && <span>Due {epic.dueDate}</span>}
                {epic.archivedAt && <span className="text-warning">Archived</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProgressRing percent={epic.progressPercent} size={48} />
            <button
              type="button"
              onClick={() => setCreateIssueOpen(true)}
              disabled={!canManage}
              className="flex items-center gap-1.5 rounded-lg bg-fg px-3 py-1.5 text-[13px] font-semibold text-bg hover:bg-fg-strong disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              New issue
            </button>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-surface p-2 text-muted marker:hidden hover:bg-hover [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </summary>
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border-hover bg-surface py-1 shadow-xl">
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg hover:bg-hover disabled:opacity-40"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit epic
                </button>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() =>
                    void duplicateEpic(pid, eid).then((created) =>
                      router.push(`/workspace/${wid}/projects/${pid}/epics/${created.id}`)
                    )
                  }
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg hover:bg-hover disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                {epic.archivedAt ? (
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => void unarchiveEpic(pid, eid).then(setEpic)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg hover:bg-hover disabled:opacity-40"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" /> Unarchive
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => void archiveEpic(pid, eid).then(setEpic)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg hover:bg-hover disabled:opacity-40"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                )}
                <button
                  type="button"
                  disabled={!canDelete}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </details>
          </div>
        </div>

        <ProgressBar percent={epic.progressPercent} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-2 text-[13px] font-semibold text-fg">Description</h3>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted2">
                {epic.description || "No description yet."}
              </p>
              {epic.labels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {epic.labels.map((l) => (
                    <span
                      key={l}
                      className="rounded-full border border-border bg-hover px-2 py-0.5 text-[11px] text-muted2"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-fg">
                  Issues ({epic.completedIssueCount}/{epic.issueCount})
                </h3>
              </div>
              {issues.length === 0 ? (
                <p className="text-[13px] text-muted">
                  No issues in this epic yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  <IssueTypeGroup
                    title="Stories"
                    issues={grouped.story}
                    onOpen={setDetailTicketId}
                  />
                  <IssueTypeGroup title="Tasks" issues={grouped.task} onOpen={setDetailTicketId} />
                  <IssueTypeGroup title="Bugs" issues={grouped.bug} onOpen={setDetailTicketId} />
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-fg">Comments</h3>
              <CommentsPanel workspaceId={wid} entityType="epic" entityId={eid} />
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-fg">Overview</h3>
              <dl className="space-y-3 text-[13px]">
                <div>
                  <dt className="text-[11px] text-muted">Owner</dt>
                  <dd className="mt-1 flex items-center gap-2 text-fg">
                    {owner ? (
                      <>
                        <UserAvatar name={owner.name} size="xs" />
                        {owner.name}
                      </>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Start date</dt>
                  <dd className="mt-1 text-fg">{epic.startDate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Due date</dt>
                  <dd className="mt-1 text-fg">{epic.dueDate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Last updated</dt>
                  <dd className="mt-1 text-fg">{new Date(epic.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-fg">Attachments</h3>
              <AttachmentsPanel
                refreshKey={refreshTick}
                fetchAttachments={() => fetchEpicAttachments(pid, eid)}
                createAttachment={(url, label) =>
                  createEpicAttachment(pid, eid, { fileUrl: url, label })
                }
                deleteAttachment={(id) => deleteAttachment(pid, id)}
                canDelete={() => canManage}
              />
            </section>

            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-fg">Activity</h3>
              <ActivityPanel
                refreshKey={refreshTick}
                fetchActivity={() => fetchEpicActivity(pid, eid)}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
