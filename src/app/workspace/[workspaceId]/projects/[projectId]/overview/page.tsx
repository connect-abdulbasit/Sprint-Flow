"use client";

import { Target, Zap, Activity, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchTickets, type ProjectTicket } from "@/lib/projects-api";
import { ProjectOverviewBodySkeleton } from "@/components/ui/skeleton";
import { initialsFromName } from "@/lib/initials";

export default function ProjectOverviewPage() {
  const { workspaceId, projectId } = useParams();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [overviewReady, setOverviewReady] = useState(false);
  // AUD-017: a failed fetch used to be indistinguishable from "this project has zero
  // tickets" — both rendered the same empty state with no error surfaced anywhere.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    setOverviewReady(false);
    setLoadError(null);
    fetchTickets(pid)
      .then((data) => {
        if (!cancelled) setTickets(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setTickets([]);
        setLoadError(err instanceof Error ? err.message : "Failed to load ticket data.");
      })
      .finally(() => {
        if (!cancelled) setOverviewReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pid, reloadToken]);

  const totalTickets = tickets.length;
  const doneTickets = tickets.filter((t) => t.status === "done").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const todoTickets = tickets.filter((t) => t.status === "todo").length;
  const completionRate = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  const priorityTickets = tickets.filter((t) => t.priority === "urgent" || t.priority === "high");

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        {loadError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-[13px] text-danger"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </span>
            <button
              type="button"
              onClick={() => setReloadToken((n) => n + 1)}
              className="shrink-0 rounded-lg border border-danger/25 px-3 py-1.5 font-semibold text-danger hover:bg-danger/10"
            >
              Retry
            </button>
          </div>
        )}
        <div className="flex items-center gap-4 p-4 bg-success/5 border border-success/10 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-success">Project overview</span>
              <span className="text-[11px] text-muted">·</span>
              <span className="text-[12px] text-muted">Live ticket counts from your workspace</span>
            </div>
          </div>
        </div>

        {!overviewReady ? (
          <ProjectOverviewBodySkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Completion Rate",
                  value: `${completionRate}%`,
                  change: totalTickets ? `${doneTickets} done` : "No tickets",
                  positive: true,
                  icon: Target,
                  color: "text-accent",
                  bg: "bg-accent/8",
                },
                {
                  label: "Open work",
                  value: `${todoTickets + inProgressTickets}`,
                  change: `${todoTickets} todo`,
                  positive: true,
                  icon: Zap,
                  color: "text-success",
                  bg: "bg-success/8",
                },
                {
                  label: "Active Tasks",
                  value: `${inProgressTickets}`,
                  change: `${todoTickets} pending`,
                  positive: true,
                  icon: Activity,
                  color: "text-accent2",
                  bg: "bg-accent2/8",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 hover:bg-surface-hover hover:border-border-hover transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[12px] font-medium text-muted">{stat.label}</span>
                    <div className="text-2xl font-semibold text-fg mt-0.5 tracking-tight">
                      {stat.value}
                    </div>
                    <span
                      className={`text-[11px] font-medium ${stat.positive ? "text-success" : "text-danger"}`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[15px] font-semibold text-fg">Sprint Velocity</h3>
                    <p className="text-[12px] text-muted mt-0.5">
                      Story points completed per sprint
                    </p>
                  </div>
                </div>
                <div className="h-[180px] flex items-center justify-center rounded-lg border border-dashed border-border text-[13px] text-muted">
                  Connect sprint history to chart velocity here.
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-semibold text-fg">Recent Activity</h3>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  Activity feed will show ticket updates when the activity API is enabled.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[15px] font-semibold text-fg">Active Sprint</h3>
                  <Link
                    href={`/workspace/${wid}/projects/${pid}/sprints`}
                    className="text-[11px] font-medium text-muted hover:text-muted2 transition-colors flex items-center gap-1"
                  >
                    View all
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="text-center py-8 text-muted text-[13px]">
                  No active sprint in the database
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[15px] font-semibold text-fg">Priority Tasks</h3>
                  <Link
                    href={`/workspace/${wid}/projects/${pid}/backlog`}
                    className="text-[11px] font-medium text-muted hover:text-muted2 transition-colors flex items-center gap-1"
                  >
                    Backlog
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {priorityTickets.length === 0 ? (
                    <p className="text-[13px] text-muted py-4 text-center">
                      No high-priority tickets
                    </p>
                  ) : (
                    priorityTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover transition-all group cursor-pointer"
                      >
                        <div
                          className={`w-1 h-8 rounded-full shrink-0 ${
                            ticket.priority === "urgent" ? "bg-danger" : "bg-warning"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono text-muted">{ticket.key}</span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                ticket.priority === "urgent"
                                  ? "bg-danger/10 text-danger"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          <div className="text-[13px] text-muted2 truncate group-hover:text-fg transition-colors">
                            {ticket.title}
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-surface-2 border border-border-strong/50 flex items-center justify-center text-[9px] font-semibold text-muted2 shrink-0">
                          {initialsFromName(ticket.assigneeName)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
