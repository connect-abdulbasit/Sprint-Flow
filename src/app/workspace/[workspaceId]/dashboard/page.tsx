"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Flame,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  ChevronRight,
  Activity,
  Zap,
  Target,
  AlertCircle,
  MoreHorizontal,
  Timer,
  Circle,
  Sparkles,
} from "lucide-react";

const WORKSPACE_INFO: Record<string, { name: string; color: string }> = {
  engineering: { name: "Engineering", color: "#4f7cff" },
  marketing: { name: "Marketing", color: "#ff9f43" },
  design: { name: "Design System", color: "#7c5cff" },
  "r-and-d": { name: "R&D", color: "#ff6b6b" },
  operations: { name: "Operations", color: "#00d4aa" },
  "side-projects": { name: "Side Projects", color: "#00b4d8" },
};

const sprintData = {
  name: "Sprint 14",
  startDate: "Mar 18",
  endDate: "Mar 31",
  daysLeft: 2,
  totalTasks: 32,
  completed: 24,
  inProgress: 5,
  todo: 3,
};

const statCards = [
  {
    label: "Tasks Completed",
    value: "24",
    change: "+8",
    trend: "up" as const,
    icon: CheckSquare,
    color: "#00d4aa",
    subtitle: "this sprint",
  },
  {
    label: "In Progress",
    value: "5",
    change: "-2",
    trend: "down" as const,
    icon: Clock,
    color: "#4f7cff",
    subtitle: "active right now",
  },
  {
    label: "Story Points",
    value: "68",
    change: "+12",
    trend: "up" as const,
    icon: Zap,
    color: "#a259ff",
    subtitle: "velocity this sprint",
  },
  {
    label: "Blocked",
    value: "2",
    change: "+1",
    trend: "up" as const,
    icon: AlertCircle,
    color: "#ff4f7c",
    subtitle: "needs attention",
  },
];

const recentTasks = [
  {
    id: "ENG-421",
    title: "Implement OAuth2 flow for GitHub",
    status: "done",
    priority: "high",
    assignee: "AJ",
    time: "2h ago",
  },
  {
    id: "ENG-419",
    title: "Fix memory leak in WebSocket handler",
    status: "in-progress",
    priority: "critical",
    assignee: "BS",
    time: "4h ago",
  },
  {
    id: "ENG-418",
    title: "Add pagination to team members API",
    status: "in-progress",
    priority: "medium",
    assignee: "CD",
    time: "6h ago",
  },
  {
    id: "ENG-416",
    title: "Design system color tokens refactor",
    status: "todo",
    priority: "low",
    assignee: "DP",
    time: "1d ago",
  },
  {
    id: "ENG-415",
    title: "Write E2E tests for onboarding flow",
    status: "done",
    priority: "medium",
    assignee: "AJ",
    time: "1d ago",
  },
];

const activityFeed = [
  {
    id: 1,
    user: "Alice Johnson",
    initials: "AJ",
    action: "completed",
    target: "ENG-421",
    detail: "Implement OAuth2 flow",
    time: "2h ago",
    color: "#00d4aa",
  },
  {
    id: 2,
    user: "Bob Smith",
    initials: "BS",
    action: "started working on",
    target: "ENG-419",
    detail: "Fix memory leak",
    time: "4h ago",
    color: "#4f7cff",
  },
  {
    id: 3,
    user: "Charlie Davis",
    initials: "CD",
    action: "commented on",
    target: "ENG-418",
    detail: "Add pagination",
    time: "6h ago",
    color: "#a259ff",
  },
  {
    id: 4,
    user: "Diana Prince",
    initials: "DP",
    action: "created",
    target: "ENG-416",
    detail: "Design system tokens",
    time: "1d ago",
    color: "#ff9f43",
  },
  {
    id: 5,
    user: "Alice Johnson",
    initials: "AJ",
    action: "moved to review",
    target: "ENG-415",
    detail: "E2E tests",
    time: "1d ago",
    color: "#00d4aa",
  },
];

const burndownPoints = [32, 30, 28, 26, 23, 20, 17, 14, 11, 9, 8, 8, 8];
const idealPoints = [32, 29.7, 27.4, 25.1, 22.8, 20.5, 18.2, 15.9, 13.6, 11.3, 9, 6.7, 4.4];

const teamMembers = [
  { name: "Alice Johnson", initials: "AJ", tasks: 8, completed: 6, color: "#4f7cff" },
  { name: "Bob Smith", initials: "BS", tasks: 7, completed: 4, color: "#a259ff" },
  { name: "Charlie Davis", initials: "CD", tasks: 6, completed: 5, color: "#00d4aa" },
  { name: "Diana Prince", initials: "DP", tasks: 5, completed: 3, color: "#ff9f43" },
];

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    done: "#00d4aa",
    "in-progress": "#4f7cff",
    todo: "#6b6b80",
  };
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{
        background: colors[status] || "#6b6b80",
        boxShadow: status === "done" ? `0 0 6px ${colors[status]}` : "none",
      }}
    />
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "rgba(255,79,124,0.12)", text: "#ff4f7c", label: "Critical" },
    high: { bg: "rgba(255,159,67,0.12)", text: "#ff9f43", label: "High" },
    medium: { bg: "rgba(79,124,255,0.12)", text: "#4f7cff", label: "Medium" },
    low: { bg: "rgba(107,107,128,0.12)", text: "#9090a8", label: "Low" },
  };
  const c = config[priority] || config.low;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

function BurndownChart() {
  const w = 400;
  const h = 140;
  const padX = 0;
  const padY = 8;
  const maxVal = Math.max(...burndownPoints, ...idealPoints);
  const steps = burndownPoints.length;

  const toX = (i: number) => padX + (i / (steps - 1)) * (w - 2 * padX);
  const toY = (v: number) => padY + (1 - v / maxVal) * (h - 2 * padY);

  const actualPath = burndownPoints
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");
  const idealPath = idealPoints
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");
  const areaPath = actualPath + ` L ${toX(steps - 1)} ${h} L ${toX(0)} ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="burndown-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f7cff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4f7cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="burndown-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f7cff" />
          <stop offset="100%" stopColor="#a259ff" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={padX}
          y1={toY(maxVal * frac)}
          x2={w - padX}
          y2={toY(maxVal * frac)}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
      ))}
      <path d={areaPath} fill="url(#burndown-fill)" />
      <path
        d={idealPath}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <path
        d={actualPath}
        fill="none"
        stroke="url(#burndown-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={toX(burndownPoints.length - 1)}
        cy={toY(burndownPoints[burndownPoints.length - 1])}
        r="4"
        fill="#4f7cff"
        stroke="#0a0a0f"
        strokeWidth="2"
      >
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#4f7cff",
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
      setOffset(circumference - (value / max) * circumference);
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
        stroke="rgba(255,255,255,0.05)"
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
          filter: `drop-shadow(0 0 6px ${color}50)`,
        }}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<{ name: string; color: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkspace({
            name: data.name,
            color: data.color || "#4f7cff",
          });
        }
      } catch (err) {
        console.error("Error fetching workspace details:", err);
      } finally {
        setLoaded(true);
      }
    }

    fetchWorkspace();
  }, [workspaceId]);

  const ws = workspace ?? WORKSPACE_INFO[workspaceId] ?? { name: workspaceId, color: "#4f7cff" };
  const sprintProgress = Math.round((sprintData.completed / sprintData.totalTasks) * 100);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: ws.color, boxShadow: `0 0 8px ${ws.color}` }}
            />
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {ws.name} workspace
            </span>
          </div>
          <h1
            className="text-2xl md:text-3xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-white/[0.06] text-sm">
            <Timer className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="font-semibold text-[#f0f0f5]">{sprintData.name}</span>
            <span className="text-[var(--color-muted)] text-xs">
              {sprintData.startDate} – {sprintData.endDate}
            </span>
            <span
              className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{
                background:
                  sprintData.daysLeft <= 3 ? "rgba(255,79,124,0.12)" : "rgba(79,124,255,0.12)",
                color: sprintData.daysLeft <= 3 ? "#ff4f7c" : "#4f7cff",
              }}
            >
              {sprintData.daysLeft}d left
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`group relative p-5 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
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
              <div
                className={`flex items-center gap-0.5 text-xs font-semibold ${card.trend === "up" && card.label !== "Blocked" ? "text-[#00d4aa]" : card.label === "Blocked" && card.trend === "up" ? "text-[#ff4f7c]" : "text-[#00d4aa]"}`}
              >
                {card.trend === "up" ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {card.change}
              </div>
            </div>
            <p className="text-3xl font-bold text-[#f0f0f5] leading-none mb-1">{card.value}</p>
            <p className="text-xs text-[var(--color-muted)]">{card.label}</p>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5 opacity-60">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className={`relative p-6 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
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
              <span className="text-[10px] font-medium text-[var(--color-muted)] bg-white/[0.04] px-2 py-1 rounded-md">
                {sprintData.name}
              </span>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <ProgressRing
                  value={sprintData.completed}
                  max={sprintData.totalTasks}
                  size={130}
                  strokeWidth={10}
                  color={ws.color}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[#f0f0f5]">{sprintProgress}%</span>
                  <span className="text-[10px] text-[var(--color-muted)]">complete</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  label: "Completed",
                  value: sprintData.completed,
                  color: "#00d4aa",
                  icon: CheckSquare,
                },
                {
                  label: "In Progress",
                  value: sprintData.inProgress,
                  color: "#4f7cff",
                  icon: Activity,
                },
                { label: "To Do", value: sprintData.todo, color: "#6b6b80", icon: Circle },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-[var(--color-muted2)]">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[#f0f0f5]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`lg:col-span-2 p-6 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Burndown Chart
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full bg-gradient-to-r from-[#4f7cff] to-[#a259ff]" />
                <span className="text-[10px] text-[var(--color-muted)]">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-0.5 rounded-full bg-white/10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 3px, transparent 3px, transparent 6px)",
                  }}
                />
                <span className="text-[10px] text-[var(--color-muted)]">Ideal</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mb-4">
            8 tasks remaining · On track to complete{" "}
            {sprintData.daysLeft > 0 ? `in ${sprintData.daysLeft + 1} days` : "today"}
          </p>
          <div className="h-[180px]">
            <BurndownChart />
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--color-muted)]">
            <span>Day 1</span>
            <span>Day 7</span>
            <span>Day 13</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className={`lg:col-span-2 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "700ms" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Recent Tasks
            </h2>
            <button className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors">
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <StatusDot status={task.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--color-muted)]">
                      {task.id}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-sm text-[#f0f0f5] truncate group-hover:text-white transition-colors">
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-surface2)] border border-white/[0.06] flex items-center justify-center text-[9px] font-bold text-[var(--color-muted2)]">
                    {task.assignee}
                  </div>
                  <span className="text-[10px] text-[var(--color-muted)] whitespace-nowrap">
                    {task.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className={`rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "800ms" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Activity
              </h2>
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            </div>
            <div className="px-5 py-3 space-y-4 max-h-[240px] overflow-auto">
              {activityFeed.slice(0, 4).map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${item.color} 15%, transparent)`,
                        color: item.color,
                      }}
                    >
                      {item.initials}
                    </div>
                    {i < activityFeed.slice(0, 4).length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.05] mt-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs text-[var(--color-muted2)] leading-relaxed">
                      <span className="font-semibold text-[#f0f0f5]">
                        {item.user.split(" ")[0]}
                      </span>{" "}
                      {item.action}{" "}
                      <span className="font-medium text-[#f0f0f5]">{item.target}</span>
                    </p>
                    <span className="text-[10px] text-[var(--color-muted)]">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "900ms" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Team Workload
              </h2>
              <Users className="w-3.5 h-3.5 text-[var(--color-accent2)]" />
            </div>
            <div className="px-5 py-3 space-y-3">
              {teamMembers.map((member) => {
                const pct = Math.round((member.completed / member.tasks) * 100);
                return (
                  <div key={member.name} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                          style={{
                            background: `color-mix(in srgb, ${member.color} 15%, transparent)`,
                            color: member.color,
                          }}
                        >
                          {member.initials}
                        </div>
                        <span className="text-xs text-[#f0f0f5] font-medium">
                          {member.name.split(" ")[0]}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-muted)] tabular-nums">
                        {member.completed}/{member.tasks}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: loaded ? `${pct}%` : "0%",
                          background: `linear-gradient(90deg, ${member.color}, ${member.color}cc)`,
                          transitionDelay: "1000ms",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
