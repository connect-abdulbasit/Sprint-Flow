"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  Users,
  ChevronRight,
  Activity,
  Zap,
  AlertCircle,
  Timer,
  Circle,
  Sparkles,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/skeleton";

const MEMBER_COLORS = [
  "var(--color-accent)",
  "var(--color-accent2)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "var(--color-info)",
];
const ACTIVITY_COLORS = [
  "var(--color-accent)",
  "var(--color-accent2)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "var(--color-info)",
];

function getInitials(name: string | null | undefined) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getActivityMiddleText(entityType: string, action: string): string {
  switch (entityType) {
    case "project":
      return `${action} project`;
    case "sprint":
      return `${action} sprint`;
    case "member":
      return `${action} workspace`;
    case "task":
      return `${action} task`;
    default:
      return action;
  }
}

function StatusDot({ status }: { status: string }) {
  const s = status.toLowerCase();
  const colors: Record<string, string> = {
    done: "var(--color-success)",
    in_progress: "var(--color-accent)",
    "in-progress": "var(--color-accent)",
    review: "var(--color-accent2)",
    blocked: "var(--color-danger)",
    todo: "var(--color-muted)",
  };
  const color = colors[s] ?? "var(--color-muted)";
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{
        background: color,
        boxShadow: s === "done" ? `0 0 6px ${color}` : "none",
      }}
    />
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "var(--color-danger-soft)", text: "var(--color-danger)", label: "Critical" },
    high: { bg: "var(--color-warning-soft)", text: "var(--color-warning)", label: "High" },
    medium: { bg: "var(--color-info-soft)", text: "var(--color-info)", label: "Medium" },
    low: { bg: "var(--color-hover-strong)", text: "var(--color-muted2)", label: "Low" },
  };
  const c = config[priority.toLowerCase()] ?? config.low;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

function BurndownChart({
  actual,
  ideal,
  totalDays,
}: {
  actual: number[];
  ideal: number[];
  totalDays: number;
}) {
  const w = 400;
  const h = 140;
  const padX = 0;
  const padY = 8;
  const allVals = [...actual, ...ideal].filter((v) => typeof v === "number");
  const maxVal = allVals.length > 0 ? Math.max(...allVals) : 1;
  const steps = Math.max(totalDays, actual.length, ideal.length, 2);

  const toX = (i: number) => padX + (i / (steps - 1)) * (w - 2 * padX);
  const toY = (v: number) => padY + (1 - v / maxVal) * (h - 2 * padY);

  const actualPath = actual.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const idealPath = ideal.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const areaPath =
    actual.length > 0 ? actualPath + ` L ${toX(actual.length - 1)} ${h} L ${toX(0)} ${h} Z` : "";

  if (actual.length === 0 && ideal.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xs text-[var(--color-muted)]">No sprint data yet</p>
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="burndown-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="burndown-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent2)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={padX}
          y1={toY(maxVal * frac)}
          x2={w - padX}
          y2={toY(maxVal * frac)}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}
      {areaPath && <path d={areaPath} fill="url(#burndown-fill)" />}
      {ideal.length > 0 && (
        <path
          d={idealPath}
          fill="none"
          stroke="var(--color-border-hover)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      )}
      {actual.length > 0 && (
        <path
          d={actualPath}
          fill="none"
          stroke="url(#burndown-stroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {actual.length > 0 && (
        <circle
          cx={toX(actual.length - 1)}
          cy={toY(actual[actual.length - 1])}
          r="4"
          fill="var(--color-accent)"
          stroke="var(--color-surface)"
          strokeWidth="2"
        >
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "var(--color-accent)",
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(max === 0 ? circumference : circumference - (value / max) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, max, circumference]);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 31%, transparent))`,
        }}
      />
    </svg>
  );
}

type ActivityItem = {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityName: string;
  createdAt: string;
};

type RecentTask = {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  updatedAt: string;
};

type TeamMember = {
  assigneeId: string;
  assigneeName: string;
  totalTasks: number;
  completedTasks: number;
};

type SprintInfo = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  projectName: string;
};

type DashboardData = {
  activeSprint: SprintInfo | null;
  activeSprints?: SprintInfo[];
  stats: {
    completed: number;
    inProgress: number;
    todo: number;
    blocked: number;
    storyPointsCompleted: number;
    totalTasks: number;
  };
  recentTasks: RecentTask[];
  teamWorkload: TeamMember[];
  burndown: {
    actual: number[];
    ideal: number[];
    totalDays: number;
    currentDay: number;
  };
  memberCount: number;
};

function extractItems<T>(payload: T[] | { items?: T[] }) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
}

export default function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<{ name: string; color: string } | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loaded, setLoaded] = useState(false);
  // AUD-017: each response's .ok was checked individually, but there was no error state
  // anywhere in this component — a failed section just silently kept its default value,
  // rendering identically to "this workspace genuinely has zero data."
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      try {
        const [wsRes, actRes, dashRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}`),
          fetch(`/api/workspaces/${workspaceId}/activities`),
          fetch(`/api/workspaces/${workspaceId}/dashboard`),
        ]);
        if (cancelled) return;

        const failedRequests: string[] = [];

        if (wsRes.ok) {
          const data = await wsRes.json();
          setWorkspace({ name: data.name, color: data.color ?? "#4f7cff" });
        } else {
          failedRequests.push("workspace details");
        }
        if (actRes.ok) {
          const data = extractItems<ActivityItem>(await actRes.json());
          setActivities(data);
        } else {
          failedRequests.push("recent activity");
        }
        if (dashRes.ok) {
          const data = await dashRes.json();
          setDashboard(data);
        } else {
          failedRequests.push("dashboard metrics");
        }

        if (failedRequests.length > 0) {
          setLoadError(`Couldn't load ${failedRequests.join(", ")}. Showing what's available.`);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Dashboard load error:", err);
        setLoadError("Network error. Could not load this dashboard.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadToken]);

  const ws = workspace ?? { name: workspaceId, color: "#4f7cff" };
  const fallbackSprint = dashboard?.activeSprint ?? null;
  const activeSprints =
    dashboard?.activeSprints && dashboard.activeSprints.length > 0
      ? dashboard.activeSprints
      : fallbackSprint
        ? [fallbackSprint]
        : [];
  const sprint = activeSprints[0] ?? null;
  const hasMultipleSprints = activeSprints.length > 1;
  const sprintNamesPreview = activeSprints
    .slice(0, 2)
    .map((s) => s.name)
    .join(" · ");
  const remainingSprintsCount = Math.max(0, activeSprints.length - 2);
  const earliestSprintEndDays =
    activeSprints.length > 0 ? Math.min(...activeSprints.map((s) => s.daysLeft)) : null;
  const stats = dashboard?.stats ?? {
    completed: 0,
    inProgress: 0,
    todo: 0,
    blocked: 0,
    storyPointsCompleted: 0,
    totalTasks: 0,
  };
  const sprintProgress =
    stats.totalTasks > 0 ? Math.round((stats.completed / stats.totalTasks) * 100) : 0;

  const statCards = [
    {
      label: "Tasks Completed",
      value: String(stats.completed),
      icon: CheckSquare,
      color: "var(--color-success)",
      subtitle: sprint ? "this sprint" : "total done",
    },
    {
      label: "In Progress",
      value: String(stats.inProgress),
      icon: Clock,
      color: "var(--color-accent)",
      subtitle: "active right now",
    },
    {
      label: "Story Points",
      value: String(stats.storyPointsCompleted),
      icon: Zap,
      color: "var(--color-accent2)",
      subtitle: "velocity this sprint",
    },
    {
      label: "Blocked",
      value: String(stats.blocked),
      icon: AlertCircle,
      color: "var(--color-danger)",
      subtitle: "needs attention",
    },
  ];

  const burndown = dashboard?.burndown ?? { actual: [], ideal: [], totalDays: 0, currentDay: 0 };
  const recentTasks = dashboard?.recentTasks ?? [];
  const teamWorkload = dashboard?.teamWorkload ?? [];
  const burndownRemaining =
    burndown.actual.length > 0 ? burndown.actual[burndown.actual.length - 1] : 0;

  if (!loaded) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <DashboardPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => setReloadToken((n) => n + 1)}
            className="shrink-0 rounded-lg border border-danger/30 px-3 py-1.5 font-semibold text-danger hover:bg-danger/10"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end gap-4 transition-all duration-700 opacity-100 translate-y-0">
        {sprint && (
          <div className="flex items-center gap-3 sm:ml-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-border text-sm">
              <Timer className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="font-semibold text-fg">
                {hasMultipleSprints ? `${activeSprints.length} Active Sprints` : sprint.name}
              </span>
              <span className="text-[var(--color-muted)] text-xs">
                {hasMultipleSprints
                  ? `${sprintNamesPreview}${remainingSprintsCount > 0 ? ` +${remainingSprintsCount} more` : ""}`
                  : `${sprint.startDate} – ${sprint.endDate}`}
              </span>
              <span
                className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{
                  background:
                    (earliestSprintEndDays ?? sprint.daysLeft) <= 3
                      ? "var(--color-danger-soft)"
                      : "var(--color-accent-soft)",
                  color:
                    (earliestSprintEndDays ?? sprint.daysLeft) <= 3
                      ? "var(--color-danger)"
                      : "var(--color-accent)",
                }}
              >
                {hasMultipleSprints
                  ? `next ends in ${earliestSprintEndDays ?? 0}d`
                  : `${sprint.daysLeft}d left`}
              </span>
            </div>
          </div>
        )}
        {!sprint && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-border text-sm sm:ml-auto">
            <Timer className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="text-[var(--color-muted)] text-xs">No active sprint</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="group relative p-5 rounded-2xl bg-[var(--color-surface)] border border-border hover:border-border-hover transition-all duration-500 hover:shadow-card-hover hover:-translate-y-0.5 opacity-100 translate-y-0"
            style={{ transitionDelay: `${150 + i * 80}ms` }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${card.color}08, transparent 70%)`,
              }}
            />
            <div className="relative flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
              >
                <card.icon className="w-[18px] h-[18px]" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-fg leading-none mb-1">{card.value}</p>
            <p className="text-xs text-[var(--color-muted)]">{card.label}</p>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5 opacity-60">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="relative p-6 rounded-2xl bg-[var(--color-surface)] border border-border overflow-hidden transition-all duration-700 opacity-100 translate-y-0"
          style={{ transitionDelay: "500ms" }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${ws.color}10, transparent 70%)`,
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Sprint Progress
              </h2>
              <span className="text-[10px] font-medium text-[var(--color-muted)] bg-hover px-2 py-1 rounded-md">
                {hasMultipleSprints
                  ? `${activeSprints.length} sprints`
                  : (sprint?.name ?? "No sprint")}
              </span>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <ProgressRing
                  value={stats.completed}
                  max={stats.totalTasks}
                  size={130}
                  strokeWidth={10}
                  color={ws.color}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-fg">{sprintProgress}%</span>
                  <span className="text-[10px] text-[var(--color-muted)]">complete</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  label: "Completed",
                  value: stats.completed,
                  color: "var(--color-success)",
                  icon: CheckSquare,
                },
                {
                  label: "In Progress",
                  value: stats.inProgress,
                  color: "var(--color-accent)",
                  icon: Activity,
                },
                { label: "To Do", value: stats.todo, color: "var(--color-muted)", icon: Circle },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-[var(--color-muted2)]">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-fg">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="lg:col-span-2 p-6 rounded-2xl bg-[var(--color-surface)] border border-border transition-all duration-700 opacity-100 translate-y-0"
          style={{ transitionDelay: "600ms" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Burndown Chart
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full bg-gradient-to-r from-accent to-accent2" />
                <span className="text-[10px] text-[var(--color-muted)]">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-0.5 rounded-full bg-border-hover"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, var(--color-border-hover) 0, var(--color-border-hover) 3px, transparent 3px, transparent 6px)",
                  }}
                />
                <span className="text-[10px] text-[var(--color-muted)]">Ideal</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mb-4">
            {hasMultipleSprints && sprint
              ? `${burndownRemaining} tasks remaining in ${sprint.name}`
              : `${stats.totalTasks - stats.completed} tasks remaining`}
            {sprint && sprint.daysLeft > 0 ? ` · ${sprint.daysLeft}d left` : ""}
          </p>
          <div className="h-[180px]">
            <BurndownChart
              actual={burndown.actual}
              ideal={burndown.ideal}
              totalDays={burndown.totalDays}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--color-muted)]">
            <span>Day 1</span>
            {burndown.totalDays > 0 && <span>Day {Math.ceil(burndown.totalDays / 2)}</span>}
            {burndown.totalDays > 0 && <span>Day {burndown.totalDays}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-2xl bg-[var(--color-surface)] border border-border overflow-hidden transition-all duration-700 opacity-100 translate-y-0"
          style={{ transitionDelay: "700ms" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Recent Tasks
            </h2>
            <button className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors">
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentTasks.length === 0 ? (
              <p className="px-6 py-4 text-xs text-[var(--color-muted)]">No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-4 px-6 py-3.5 hover:bg-hover transition-colors cursor-pointer"
                >
                  <StatusDot status={task.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-[var(--color-muted)]">
                        {task.key}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p className="text-sm text-fg truncate group-hover:text-fg-strong transition-colors">
                      {task.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {task.assigneeName && (
                      <div className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[9px] font-bold text-[var(--color-muted2)]">
                        {getInitials(task.assigneeName)}
                      </div>
                    )}
                    <span className="text-[10px] text-[var(--color-muted)] whitespace-nowrap">
                      {timeAgo(task.updatedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl bg-[var(--color-surface)] border border-border overflow-hidden transition-all duration-700 opacity-100 translate-y-0"
            style={{ transitionDelay: "800ms" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Activity
              </h2>
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            </div>
            <div className="px-5 py-3 space-y-4 max-h-[240px] overflow-auto">
              {activities.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] py-2">No activity yet</p>
              ) : (
                activities.slice(0, 5).map((item, i) => {
                  const initials = getInitials(item.userName);
                  const firstName = item.userName?.split(" ")[0] ?? "Unknown";
                  const color = ACTIVITY_COLORS[i % ACTIVITY_COLORS.length];
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative flex flex-col items-center">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{
                            background: `color-mix(in srgb, ${color} 15%, transparent)`,
                            color: color,
                          }}
                        >
                          {initials}
                        </div>
                        {i < Math.min(activities.length, 5) - 1 && (
                          <div className="w-px flex-1 bg-hover mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs text-[var(--color-muted2)] leading-relaxed">
                          <span className="font-semibold text-fg">{firstName}</span>{" "}
                          {getActivityMiddleText(item.entityType, item.action)}{" "}
                          {item.entityType !== "member" && (
                            <span className="font-medium text-fg">{item.entityName}</span>
                          )}
                        </p>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="rounded-2xl bg-[var(--color-surface)] border border-border overflow-hidden transition-all duration-700 opacity-100 translate-y-0"
            style={{ transitionDelay: "900ms" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Team Workload
              </h2>
              <Users className="w-3.5 h-3.5 text-[var(--color-accent2)]" />
            </div>
            <div className="px-5 py-3 space-y-3">
              {teamWorkload.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] py-2">
                  {sprint ? "No assigned tasks in sprint" : "No active sprint"}
                </p>
              ) : (
                teamWorkload.map((member, i) => {
                  const pct =
                    member.totalTasks > 0
                      ? Math.round((member.completedTasks / member.totalTasks) * 100)
                      : 0;
                  const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
                  return (
                    <div key={member.assigneeId} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                            style={{
                              background: `color-mix(in srgb, ${color} 15%, transparent)`,
                              color: color,
                            }}
                          >
                            {getInitials(member.assigneeName)}
                          </div>
                          <span className="text-xs text-fg font-medium">
                            {member.assigneeName.split(" ")[0]}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--color-muted)] tabular-nums">
                          {member.completedTasks}/{member.totalTasks}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-hover overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 80%, transparent))`,
                            transitionDelay: "1000ms",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
