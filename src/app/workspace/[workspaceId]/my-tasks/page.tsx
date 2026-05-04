"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Search,
  Filter,
  Inbox,
  ArrowUpRight,
  Bug,
  Sparkles,
  Wrench,
  ListTodo,
} from "lucide-react";
import { fetchMyTasks, type MyTask } from "@/lib/projects-api";

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

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase().replace(/[\s_]+/g, "-");
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    done: { bg: "rgba(0,212,170,0.10)", text: "#00d4aa", dot: "#00d4aa", label: "Done" },
    "in-progress": {
      bg: "rgba(79,124,255,0.10)",
      text: "#4f7cff",
      dot: "#4f7cff",
      label: "In Progress",
    },
    review: { bg: "rgba(162,89,255,0.10)", text: "#a259ff", dot: "#a259ff", label: "Review" },
    blocked: { bg: "rgba(255,79,124,0.10)", text: "#ff4f7c", dot: "#ff4f7c", label: "Blocked" },
    todo: { bg: "rgba(107,107,128,0.10)", text: "#9090a8", dot: "#6b6b80", label: "To Do" },
  };
  const c = config[s] ?? config.todo;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot, boxShadow: s === "done" ? `0 0 6px ${c.dot}` : "none" }}
      />
      {c.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    urgent: { bg: "rgba(255,79,124,0.12)", text: "#ff4f7c", label: "Urgent" },
    high: { bg: "rgba(255,159,67,0.12)", text: "#ff9f43", label: "High" },
    medium: { bg: "rgba(79,124,255,0.12)", text: "#4f7cff", label: "Medium" },
    low: { bg: "rgba(107,107,128,0.12)", text: "#9090a8", label: "Low" },
  };
  const c = config[priority.toLowerCase()] ?? config.low;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

function TypeIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Bug; color: string }> = {
    bug: { icon: Bug, color: "#ff4f7c" },
    feature: { icon: Sparkles, color: "#a259ff" },
    improvement: { icon: Wrench, color: "#ff9f43" },
    task: { icon: ListTodo, color: "#4f7cff" },
  };
  const c = config[type.toLowerCase()] ?? config.task;
  const Icon = c.icon;
  return <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} />;
}

type FilterStatus = "all" | "todo" | "in-progress" | "done";

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/[0.04]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
            <div className="h-2.5 w-1/3 rounded bg-white/[0.04]" />
          </div>
          <div className="w-20 h-6 rounded-lg bg-white/[0.04]" />
          <div className="w-16 h-5 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

export default function MyTasksPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const query = search.trim().toLowerCase();
  const hasSearch = query.length > 0;

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    fetchMyTasks(workspaceId)
      .then(setTasks)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (hasSearch) {
      const q = query;
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q) ||
          t.projectName.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => {
        const s = t.status.toLowerCase().replace(/[\s_]+/g, "-");
        if (statusFilter === "todo") return s === "todo";
        if (statusFilter === "in-progress") return s === "in-progress" || s === "in_progress";
        if (statusFilter === "done") return s === "done";
        return true;
      });
    }

    return result;
  }, [tasks, hasSearch, query, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status.toLowerCase() === "done").length;
    const inProgress = tasks.filter((t) => {
      const s = t.status.toLowerCase().replace(/[\s_]+/g, "-");
      return s === "in-progress";
    }).length;
    const todo = total - done - inProgress;
    return { total, done, inProgress, todo };
  }, [tasks]);

  const statusFilters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "todo", label: "To Do", count: stats.todo },
    { key: "in-progress", label: "In Progress", count: stats.inProgress },
    { key: "done", label: "Done", count: stats.done },
  ];

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div className="px-10 py-8 border-b border-white/[0.04] bg-[#0c0c0f]/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">My Tasks</h1>
              <p className="mt-1 flex items-center gap-2 text-[13px] text-zinc-500">
                Assigned to you
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                {stats.total} {stats.total === 1 ? "ticket" : "tickets"}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          {stats.total > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%`,
                      background: "linear-gradient(90deg, #00d4aa, #4f7cff)",
                    }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
                  {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, projects, ticket keys…"
              aria-label="Search tasks"
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all w-[300px]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/[0.05] rounded-lg">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  statusFilter === f.key
                    ? "bg-white/[0.08] text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                }`}
              >
                {f.label}
                <span
                  className={`text-[10px] tabular-nums ${
                    statusFilter === f.key ? "text-zinc-300" : "text-zinc-600"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300 mb-1">Failed to load tasks</h3>
            <p className="text-[13px] text-zinc-500 max-w-xs">{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-600">
                <Inbox className="w-10 h-10" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <CheckSquare className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
              {hasSearch || statusFilter !== "all" ? "No matching tasks" : "You're all caught up!"}
            </h3>
            <p className="text-[13px] text-zinc-500 max-w-sm leading-relaxed">
              {hasSearch || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No tasks have been assigned to you yet. When someone assigns you a ticket, it will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-4 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              <div className="w-10" />
              <div className="flex-1">Ticket</div>
              <div className="w-[140px]">Project</div>
              <div className="w-[110px]">Status</div>
              <div className="w-[80px]">Priority</div>
              <div className="w-[80px] text-right">Updated</div>
              <div className="w-6" />
            </div>

            {filteredTasks.map((task, i) => (
              <Link
                key={task.id}
                href={`/workspace/${workspaceId}/projects/${task.projectId}/backlog`}
                className="group flex items-center gap-4 px-5 py-3.5 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Type icon */}
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:border-white/[0.1] transition-colors">
                  <TypeIcon type={task.type} />
                </div>

                {/* Title & key */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      {task.key}
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-200 truncate group-hover:text-white transition-colors font-medium">
                    {task.title}
                  </p>
                </div>

                {/* Project name */}
                <div className="w-[140px] shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.04] text-[11px] text-zinc-400 font-medium truncate max-w-full">
                    {task.projectName}
                  </span>
                </div>

                {/* Status */}
                <div className="w-[110px] shrink-0">
                  <StatusBadge status={task.status} />
                </div>

                {/* Priority */}
                <div className="w-[80px] shrink-0">
                  <PriorityBadge priority={task.priority} />
                </div>

                {/* Updated */}
                <div className="w-[80px] shrink-0 text-right">
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    {timeAgo(task.updatedAt)}
                  </span>
                </div>

                {/* Arrow */}
                <div className="w-6 shrink-0 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
