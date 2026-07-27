"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  RefreshCw,
  Timer,
  Users,
} from "lucide-react";
import {
  fetchProjects,
  fetchSprints,
  fetchTickets,
  fetchWorkspaceMembers,
  type Project,
  type ProjectSprint,
  type ProjectTicket,
} from "@/lib/projects-api";

type WorkspaceMeta = {
  name: string;
  color?: string;
};

type ProjectDataset = {
  project: Project;
  tickets: ProjectTicket[];
  sprints: ProjectSprint[];
};

type StatusBucket = "todo" | "in_progress" | "review" | "blocked" | "done";
type PriorityBucket = "urgent" | "high" | "medium" | "low";

const STATUS_LABELS: Record<StatusBucket, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_COLORS: Record<StatusBucket, string> = {
  todo: "bg-muted",
  in_progress: "bg-accent",
  review: "bg-accent2",
  blocked: "bg-danger",
  done: "bg-success",
};

const PRIORITY_LABELS: Record<PriorityBucket, string> = {
  urgent: "Urgent / Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_COLORS: Record<PriorityBucket, string> = {
  urgent: "bg-danger",
  high: "bg-warning",
  medium: "bg-accent",
  low: "bg-muted",
};

function normalizeStatus(status: string): StatusBucket {
  const value = status.trim().toLowerCase();
  if (value === "done") return "done";
  if (value === "review" || value === "in_review" || value === "in-review") return "review";
  if (value === "blocked") return "blocked";
  if (value === "in_progress" || value === "in-progress" || value === "progress")
    return "in_progress";
  return "todo";
}

function normalizePriority(priority: string): PriorityBucket {
  const value = priority.trim().toLowerCase();
  if (value === "urgent" || value === "critical") return "urgent";
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  return "low";
}

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function isOverdue(ticket: ProjectTicket, today: Date) {
  if (!ticket.dueDate) return false;
  if (normalizeStatus(ticket.status) === "done") return false;
  return new Date(ticket.dueDate).getTime() < today.getTime();
}

function isDueSoon(ticket: ProjectTicket, now: Date, sevenDaysFromNow: Date) {
  if (!ticket.dueDate) return false;
  if (normalizeStatus(ticket.status) === "done") return false;
  const due = new Date(ticket.dueDate).getTime();
  return due >= now.getTime() && due <= sevenDaysFromNow.getTime();
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-8 w-8 rounded-lg bg-hover-strong animate-pulse mb-4" />
            <div className="h-7 w-16 rounded bg-hover-strong animate-pulse mb-2" />
            <div className="h-3 w-24 rounded bg-hover-strong animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6">
            <div className="h-4 w-40 rounded bg-hover-strong animate-pulse mb-5" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j}>
                  <div className="h-3 w-full rounded bg-hover-strong animate-pulse mb-2" />
                  <div className="h-1.5 w-full rounded-full bg-hover-strong animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<WorkspaceMeta | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [datasets, setDatasets] = useState<ProjectDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const [workspaceRes, projects, members] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}`),
          fetchProjects(workspaceId),
          fetchWorkspaceMembers(workspaceId),
        ]);

        if (!workspaceRes.ok) {
          throw new Error("Failed to load workspace details");
        }

        const workspaceData = (await workspaceRes.json()) as WorkspaceMeta;
        const datasetsLoaded = await Promise.all(
          projects.map(async (project) => {
            const [ticketRes, sprintRes] = await Promise.allSettled([
              fetchTickets(project.id),
              fetchSprints(project.id),
            ]);

            return {
              project,
              tickets: ticketRes.status === "fulfilled" ? ticketRes.value : [],
              sprints: sprintRes.status === "fulfilled" ? sprintRes.value : [],
            };
          })
        );

        if (cancelled) return;
        setWorkspace(workspaceData);
        setMembersCount(members.length);
        setDatasets(datasetsLoaded);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error)?.message ?? "Failed to load reports");
        setDatasets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadKey]);

  const allTickets = useMemo(() => datasets.flatMap((item) => item.tickets), [datasets]);
  const allSprints = useMemo(() => datasets.flatMap((item) => item.sprints), [datasets]);
  const today = useMemo(() => new Date(), []);

  const {
    totalProjects,
    totalTickets,
    inProgressTickets,
    blockedTickets,
    totalStoryPointsDone,
    completionRate,
    overdueCount,
    dueSoonCount,
    unassignedCount,
    activeSprints,
    statusCounts,
    priorityCounts,
    projectPerformance,
    recentCompletedSprints,
    doneLast14Days,
  } = useMemo(() => {
    const status: Record<StatusBucket, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      blocked: 0,
      done: 0,
    };

    const priority: Record<PriorityBucket, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const nextSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let done = 0;
    let inProgress = 0;
    let blocked = 0;
    let storyPointsDone = 0;
    let overdue = 0;
    let dueSoon = 0;
    let unassigned = 0;
    let doneRecent = 0;

    for (const ticket of allTickets) {
      const normalizedStatus = normalizeStatus(ticket.status);
      const normalizedPriority = normalizePriority(ticket.priority);

      status[normalizedStatus] += 1;
      priority[normalizedPriority] += 1;

      if (normalizedStatus === "done") {
        done += 1;
        storyPointsDone += ticket.storyPoints ?? 0;
        if (new Date(ticket.updatedAt).getTime() >= fourteenDaysAgo) {
          doneRecent += 1;
        }
      }

      if (normalizedStatus === "in_progress" || normalizedStatus === "review") {
        inProgress += 1;
      }

      if (normalizedStatus === "blocked") {
        blocked += 1;
      }

      if (isOverdue(ticket, today)) overdue += 1;
      if (isDueSoon(ticket, today, nextSevenDays)) dueSoon += 1;
      if (!ticket.assigneeId) unassigned += 1;
    }

    const projectsPerf = datasets
      .map((item) => {
        const projectDone = item.tickets.filter((t) => normalizeStatus(t.status) === "done").length;
        const projectBlocked = item.tickets.filter(
          (t) => normalizeStatus(t.status) === "blocked"
        ).length;
        const projectInProgress = item.tickets.filter((t) => {
          const s = normalizeStatus(t.status);
          return s === "in_progress" || s === "review";
        }).length;

        return {
          id: item.project.id,
          name: item.project.name,
          total: item.tickets.length,
          done: projectDone,
          blocked: projectBlocked,
          inProgress: projectInProgress,
          completion: getPercent(projectDone, item.tickets.length),
        };
      })
      .sort((a, b) => b.total - a.total);

    const completedSprints = allSprints
      .filter((s) => s.status === "completed")
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, 5);

    const active = allSprints.filter((s) => s.status === "active").length;
    const total = allTickets.length;

    return {
      totalProjects: datasets.length,
      totalTickets: total,
      inProgressTickets: inProgress,
      blockedTickets: blocked,
      totalStoryPointsDone: storyPointsDone,
      completionRate: getPercent(done, total),
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      unassignedCount: unassigned,
      activeSprints: active,
      statusCounts: status,
      priorityCounts: priority,
      projectPerformance: projectsPerf,
      recentCompletedSprints: completedSprints,
      doneLast14Days: doneRecent,
    };
  }, [allSprints, allTickets, datasets, today]);

  const workspaceName = workspace?.name ?? "Workspace";
  const workspaceColor = workspace?.color ?? "#4f7cff";

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <div className="px-10 py-8 border-b border-border bg-surface-sunken/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center border"
              style={{
                background: `${workspaceColor}14`,
                borderColor: `${workspaceColor}33`,
                color: workspaceColor,
              }}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Reports</h1>
              <p className="mt-1 text-[13px] text-muted">
                {workspaceName} analytics across projects, tasks, and sprints
              </p>
            </div>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-hover text-muted2 hover:text-fg hover:bg-hover transition-colors text-[13px] font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
        {loading ? (
          <ReportsSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/8 p-5 flex items-center gap-3 text-danger text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-3 py-1.5 rounded-md bg-danger/15 hover:bg-danger/25 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6 pb-10">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                {
                  label: "Projects",
                  value: totalProjects,
                  icon: FolderKanban,
                  color: "text-accent",
                },
                {
                  label: "Total Tasks",
                  value: totalTickets,
                  icon: Layers3,
                  color: "text-muted2",
                },
                {
                  label: "Completion Rate",
                  value: `${completionRate}%`,
                  icon: CheckCircle2,
                  color: "text-success",
                },
                {
                  label: "Active Sprints",
                  value: activeSprints,
                  icon: Timer,
                  color: "text-accent2",
                },
                {
                  label: "Overdue Tasks",
                  value: overdueCount,
                  icon: AlertCircle,
                  color: "text-danger",
                },
                { label: "Members", value: membersCount, icon: Users, color: "text-accent3" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-border bg-surface p-5">
                  <div
                    className={`w-9 h-9 rounded-lg bg-hover flex items-center justify-center mb-4 ${card.color}`}
                  >
                    <card.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
                  <div className="text-[11px] text-muted mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-[14px] font-semibold text-fg mb-5">Task Status Distribution</h2>
                <div className="space-y-4">
                  {(Object.keys(statusCounts) as StatusBucket[]).map((key) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-muted2">{STATUS_LABELS[key]}</span>
                        <span className="text-muted">
                          {statusCounts[key]} · {getPercent(statusCounts[key], totalTickets)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[key]} transition-all duration-700`}
                          style={{ width: `${getPercent(statusCounts[key], totalTickets)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-[14px] font-semibold text-fg mb-5">Priority Breakdown</h2>
                <div className="space-y-4">
                  {(Object.keys(priorityCounts) as PriorityBucket[]).map((key) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-muted2">{PRIORITY_LABELS[key]}</span>
                        <span className="text-muted">
                          {priorityCounts[key]} · {getPercent(priorityCounts[key], totalTickets)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${PRIORITY_COLORS[key]} transition-all duration-700`}
                          style={{ width: `${getPercent(priorityCounts[key], totalTickets)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-[14px] font-semibold text-fg mb-4">Project Performance</h2>
                {projectPerformance.length === 0 ? (
                  <p className="text-[12px] text-muted">No projects available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {projectPerformance.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-xl border border-border bg-surface-sunken px-4 py-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[13px] text-fg font-medium truncate">{project.name}</p>
                          <span className="text-[11px] text-muted">
                            {project.done}/{project.total} done
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-success transition-all duration-700"
                            style={{ width: `${project.completion}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted">
                          <span>{project.completion}% complete</span>
                          <span>
                            {project.inProgress} active · {project.blocked} blocked
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-fg">Delivery Snapshot</h2>
                <div className="rounded-xl border border-border bg-surface-sunken p-4">
                  <p className="text-[11px] text-muted">Completed Tasks (14 days)</p>
                  <p className="text-xl font-semibold text-success mt-1">{doneLast14Days}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-4">
                  <p className="text-[11px] text-muted">Story Points Delivered</p>
                  <p className="text-xl font-semibold text-accent2 mt-1">{totalStoryPointsDone}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-4">
                  <p className="text-[11px] text-muted">Current Flow</p>
                  <p className="text-xl font-semibold text-accent mt-1">
                    {inProgressTickets} in progress
                  </p>
                  <p className="text-[11px] text-muted mt-1">{blockedTickets} blocked</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-4">
                  <p className="text-[11px] text-muted">Upcoming / Unassigned</p>
                  <p className="text-sm text-muted2 mt-1">{dueSoonCount} due in next 7 days</p>
                  <p className="text-sm text-muted2">{unassignedCount} unassigned tasks</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock3 className="w-4 h-4 text-muted2" />
                <h2 className="text-[14px] font-semibold text-fg">Recent Completed Sprints</h2>
              </div>
              {recentCompletedSprints.length === 0 ? (
                <p className="text-[12px] text-muted">No completed sprints yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {recentCompletedSprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className="rounded-xl border border-border bg-surface-sunken px-4 py-3"
                    >
                      <p className="text-[13px] text-fg font-medium truncate">{sprint.name}</p>
                      <p className="text-[11px] text-muted mt-1">
                        {new Date(sprint.startDate).toLocaleDateString()} -{" "}
                        {new Date(sprint.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalTickets === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <h3 className="text-muted2 font-medium mb-1">No task data yet</h3>
                <p className="text-[12px] text-muted">
                  Create tasks in project boards to start generating workspace reports.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
