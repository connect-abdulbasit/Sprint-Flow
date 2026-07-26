"use client";

import SprintSection, { type TicketMoveOption } from "@/components/project/SprintSection";
import CreateSprintModal from "@/components/project/CreateSprintModal";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import TicketDetailModal from "@/components/project/TicketDetailModal";
import TicketFormModal from "@/components/project/TicketFormModal";
import AlertDialog from "@/components/ui/AlertDialog";
import { Calendar, Rocket, Layers } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchWorkspaceMembers,
  fetchTickets,
  fetchSprints,
  fetchProject,
  updateTicket,
  startSprint,
  completeSprint,
  deleteSprint,
  type Project,
  type ProjectMember,
  type ProjectSprint,
  type ProjectTicket,
  type SprintGroup,
} from "@/lib/projects-api";
import { normalizeBoardColumns, statusOptionsFromColumns } from "@/lib/board-columns";
import { BacklogSectionsSkeleton } from "@/components/ui/skeleton";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

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

function sortSprintsForBoard(list: ProjectSprint[]) {
  const rank = (s: ProjectSprint) => (s.status === "active" ? 0 : s.status === "planning" ? 1 : 2);
  return [...list].sort((a, b) => {
    const dr = rank(a) - rank(b);
    if (dr !== 0) return dr;
    if (a.status === "completed" && b.status === "completed") {
      return b.endDate.localeCompare(a.endDate);
    }
    return a.startDate.localeCompare(b.startDate);
  });
}

export default function ProjectBacklogPage() {
  const { workspaceId, projectId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [sprints, setSprints] = useState<ProjectSprint[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultSprintId, setCreateDefaultSprintId] = useState<string | null>(null);
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailPreview, setDetailPreview] = useState<ProjectTicket | null>(null);
  const [actionAlert, setActionAlert] = useState<{ title: string; message: string } | null>(null);
  const [backlogReady, setBacklogReady] = useState(false);
  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(wid);
  const canManageSprintAndTickets = !roleLoading && hasRole("project_manager");
  const canDelete = !roleLoading && hasRole("admin");

  const load = useCallback(() => {
    if (!pid || !wid) return;
    setBacklogReady(false);
    Promise.all([
      fetchTickets(pid),
      fetchSprints(pid),
      fetchWorkspaceMembers(wid),
      fetchProject(pid),
    ])
      .then(([t, sp, m, p]) => {
        setTickets(t);
        setSprints(sp);
        setMembers(m);
        setProject(p);
      })
      .catch(() => {
        setTickets([]);
        setSprints([]);
        setMembers([]);
        setProject(null);
      })
      .finally(() => setBacklogReady(true));
  }, [pid, wid]);

  useEffect(() => {
    load();
  }, [load]);

  const orderedSprints = useMemo(() => sortSprintsForBoard(sprints), [sprints]);

  const statusFormOptions = useMemo(
    () => statusOptionsFromColumns(normalizeBoardColumns(project?.boardColumns ?? null)),
    [project?.boardColumns]
  );

  const defaultTicketStatus = useMemo(
    () => normalizeBoardColumns(project?.boardColumns ?? null)[0]?.id ?? "todo",
    [project?.boardColumns]
  );

  const backlogTickets = useMemo(() => tickets.filter((t) => t.sprintId === null), [tickets]);

  const sprintGroups: SprintGroup[] = useMemo(
    () =>
      orderedSprints.map((s) => ({
        id: s.id,
        name: s.name,
        goal: s.goal,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        tickets: tickets.filter((t) => t.sprintId === s.id),
      })),
    [tickets, orderedSprints]
  );

  const activePlanningSprints = useMemo(
    () => sprints.filter((s) => s.status === "planning" || s.status === "active"),
    [sprints]
  );

  const sprintPickerForForm = useMemo(
    () => activePlanningSprints.map((s) => ({ id: s.id, name: s.name })),
    [activePlanningSprints]
  );

  const moveOptionsForBacklogTicket = useCallback((): TicketMoveOption[] => {
    return activePlanningSprints.map((s) => ({ sprintId: s.id, label: s.name }));
  }, [activePlanningSprints]);

  const moveOptionsForSprintTicket = useCallback(
    (sprintId: string): TicketMoveOption[] => {
      const opts: TicketMoveOption[] = [{ sprintId: null, label: "Backlog" }];
      for (const s of activePlanningSprints) {
        if (s.id !== sprintId) opts.push({ sprintId: s.id, label: s.name });
      }
      return opts;
    },
    [activePlanningSprints]
  );

  const openCreate = useCallback((defaultSprintId: string | null = null) => {
    setDetailTicketId(null);
    setDetailPreview(null);
    setCreateDefaultSprintId(defaultSprintId);
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
    router.replace(pathname);
  }, [router, pathname]);

  useEffect(() => {
    const queryTicketId = searchParams.get("ticketId");
    if (!queryTicketId) return;
    setCreateModalOpen(false);
    setDetailTicketId(queryTicketId);
    setDetailPreview(tickets.find((ticket) => ticket.id === queryTicketId) ?? null);
  }, [searchParams, tickets]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setDetailTicketId(null);
    setDetailPreview(null);
    setCreateDefaultSprintId(null);
    setCreateModalOpen(true);
  }, [searchParams]);

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

  const handleMoveTicket = useCallback(
    async (ticketId: string, sprintId: string | null) => {
      let previousSnapshot: ProjectTicket | undefined;
      setTickets((prev) => {
        const t = prev.find((x) => x.id === ticketId);
        if (!t || t.sprintId === sprintId) return prev;
        previousSnapshot = t;
        return prev.map((x) => (x.id === ticketId ? { ...x, sprintId } : x));
      });
      if (!previousSnapshot) return;

      setDetailPreview((p) => (p?.id === ticketId ? { ...p, sprintId } : p));

      try {
        const updated = await updateTicket(pid, ticketId, { sprintId });
        handleSaved(updated);
      } catch {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? previousSnapshot! : t)));
        setDetailPreview((p) => (p?.id === ticketId ? previousSnapshot! : p));
      }
    },
    [pid, handleSaved]
  );

  const handleStartSprint = useCallback(
    async (sprintId: string) => {
      try {
        await startSprint(pid, sprintId);
        await load();
      } catch (e) {
        setActionAlert({
          title: "Could not start sprint",
          message: e instanceof Error ? e.message : "Something went wrong.",
        });
      }
    },
    [pid, load]
  );

  const handleCompleteSprint = useCallback(
    async (sprintId: string) => {
      try {
        await completeSprint(pid, sprintId);
        await load();
      } catch (e) {
        setActionAlert({
          title: "Could not complete sprint",
          message: e instanceof Error ? e.message : "Something went wrong.",
        });
      }
    },
    [pid, load]
  );

  const handleDeleteSprint = useCallback(
    async (sprintId: string) => {
      try {
        await deleteSprint(pid, sprintId);
        await load();
      } catch (e) {
        setActionAlert({
          title: "Could not delete sprint",
          message: e instanceof Error ? e.message : "Something went wrong.",
        });
      }
    },
    [pid, load]
  );

  const detailSprintId =
    detailPreview?.sprintId ?? tickets.find((t) => t.id === detailTicketId)?.sprintId ?? null;

  const sprintPickerOptions = useMemo(
    () => buildSprintPickerOptions(sprints, detailSprintId),
    [sprints, detailSprintId]
  );

  const planningAndActive = sprintGroups.filter(
    (g) => g.status === "planning" || g.status === "active"
  );
  const completedGroups = sprintGroups.filter((g) => g.status === "completed");

  const backlog: SprintGroup = {
    id: "backlog",
    name: "Backlog",
    status: "planning",
    tickets: backlogTickets,
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <AlertDialog
        isOpen={actionAlert !== null}
        onClose={() => setActionAlert(null)}
        title={actionAlert?.title ?? ""}
        message={actionAlert?.message ?? ""}
        variant="error"
      />

      <ProjectPageHeader />

      {createModalOpen && (
        <TicketFormModal
          projectId={pid}
          members={members}
          mode="create"
          ticket={null}
          initialStatus={defaultTicketStatus}
          sprintPickerSprints={sprintPickerForForm}
          defaultSprintId={createDefaultSprintId}
          statusOptions={statusFormOptions}
          linkableTickets={tickets}
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            router.replace(pathname);
          }}
          onSaved={handleSaved}
        />
      )}

      {sprintModalOpen && (
        <CreateSprintModal
          projectId={pid}
          isOpen={sprintModalOpen}
          onClose={() => setSprintModalOpen(false)}
          onCreated={() => void load()}
        />
      )}

      {detailTicketId && (
        <TicketDetailModal
          projectId={pid}
          workspaceId={wid}
          ticketId={detailTicketId}
          preview={detailPreview}
          members={members}
          sprintPickerOptions={sprintPickerOptions}
          statusOptions={statusFormOptions}
          linkableTickets={tickets}
          focusCommentId={searchParams.get("commentId")}
          isOpen={Boolean(detailTicketId)}
          onClose={closeDetail}
          onUpdated={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Sprint roadmap</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Plan sprints, move work from the backlog, start the sprint, then complete it when done
              — same flow as Jira.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${wid}/projects/${pid}/sprints`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </Link>
            <button
              type="button"
              onClick={() => setSprintModalOpen(true)}
              disabled={!canManageSprintAndTickets}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/15 rounded-lg text-[12px] font-medium text-blue-400 hover:bg-blue-500/15 transition-all"
            >
              <Rocket className="w-3.5 h-3.5" />
              New sprint
            </button>
          </div>
        </div>

        {!backlogReady ? (
          <BacklogSectionsSkeleton />
        ) : (
          <>
            {planningAndActive.length === 0 ? (
              <div className="rounded-lg border border-white/[0.05] bg-[#111115]/30 px-4 py-6 text-center text-[13px] text-zinc-500">
                No planned or active sprints yet. Create a sprint, then drag tickets from the
                backlog into it (or use Move), then press Start when the team commits.
              </div>
            ) : (
              <div className="space-y-3">
                {planningAndActive.map((group) => (
                  <SprintSection
                    key={group.id}
                    sprint={group}
                    onCreateTask={
                      canManageSprintAndTickets ? () => openCreate(group.id) : undefined
                    }
                    onTicketSelect={openDetail}
                    onStartSprint={canManageSprintAndTickets ? handleStartSprint : undefined}
                    onCompleteSprint={canManageSprintAndTickets ? handleCompleteSprint : undefined}
                    onDeleteSprint={canDelete ? handleDeleteSprint : undefined}
                    ticketMoveOptions={
                      canManageSprintAndTickets ? moveOptionsForSprintTicket(group.id) : []
                    }
                    onMoveTicket={canManageSprintAndTickets ? handleMoveTicket : undefined}
                    enableTicketDrag={canManageSprintAndTickets}
                    onTicketDrop={
                      canManageSprintAndTickets
                        ? (ticketId) => {
                            const t = tickets.find((x) => x.id === ticketId);
                            if (t?.sprintId === group.id) return;
                            void handleMoveTicket(ticketId, group.id);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            <div className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-zinc-200">Backlog</h2>
                  <p className="text-[12px] text-zinc-500 mt-0.5">
                    {backlogTickets.length} unscheduled{" "}
                    {backlogTickets.length === 1 ? "ticket" : "tickets"}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                  disabled
                >
                  Archived
                </button>
              </div>

              <SprintSection
                sprint={backlog}
                isBacklog
                onCreateTask={canManageSprintAndTickets ? () => openCreate(null) : undefined}
                onTicketSelect={openDetail}
                ticketMoveOptions={canManageSprintAndTickets ? moveOptionsForBacklogTicket() : []}
                onMoveTicket={canManageSprintAndTickets ? handleMoveTicket : undefined}
                enableTicketDrag={canManageSprintAndTickets}
                onTicketDrop={
                  canManageSprintAndTickets
                    ? (ticketId) => {
                        const t = tickets.find((x) => x.id === ticketId);
                        if (!t || t.sprintId === null) return;
                        void handleMoveTicket(ticketId, null);
                      }
                    : undefined
                }
              />
            </div>

            {completedGroups.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-white/[0.03]" />
                  <span className="text-[11px] font-medium text-zinc-500">Completed sprints</span>
                  <div className="h-px flex-1 bg-white/[0.03]" />
                </div>
                <div className="space-y-3 opacity-90">
                  {completedGroups.map((group) => (
                    <SprintSection
                      key={group.id}
                      sprint={group}
                      onCreateTask={undefined}
                      onTicketSelect={openDetail}
                      // AUD-009: completed sprints are immutable — the server now rejects
                      // any ticket edit/move once its sprint is completed, so the drag/move
                      // affordances must never be offered here, regardless of role.
                      ticketMoveOptions={[]}
                      onMoveTicket={undefined}
                      enableTicketDrag={false}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <Layers className="w-6 h-6 text-zinc-600 mb-2" />
              <p className="text-[11px] text-zinc-600 font-medium">End of backlog</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
