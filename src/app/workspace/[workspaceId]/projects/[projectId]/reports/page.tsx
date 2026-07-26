"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchTickets, type ProjectTicket } from "@/lib/projects-api";
import { ProjectReportsBodySkeleton } from "@/components/ui/skeleton";

export default function ProjectReportsPage() {
  const { projectId } = useParams();
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [reportsReady, setReportsReady] = useState(false);
  // AUD-017: see overview/page.tsx — a failed fetch previously looked identical to
  // "zero tickets" with no error surfaced.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    setReportsReady(false);
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
        if (!cancelled) setReportsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pid, reloadToken]);

  const totalTickets = tickets.length;
  const doneTickets = tickets.filter((t) => t.status === "done").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const storyPointsDone = tickets
    .filter((t) => t.status === "done")
    .reduce((a, t) => a + (t.storyPoints ?? 0), 0);

  const pct = (n: number) => (totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0);

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
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Reports & Analytics</h2>
          <p className="text-[12px] text-muted mt-0.5">Performance insights for your project</p>
        </div>

        {!reportsReady ? (
          <ProjectReportsBodySkeleton />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: "Total Tasks",
                  value: totalTickets.toString(),
                  icon: BarChart3,
                  color: "text-accent",
                  bg: "bg-accent/8",
                },
                {
                  label: "Completed",
                  value: doneTickets.toString(),
                  icon: CheckCircle2,
                  color: "text-success",
                  bg: "bg-success/8",
                },
                {
                  label: "In Progress",
                  value: inProgressTickets.toString(),
                  icon: Clock,
                  color: "text-warning",
                  bg: "bg-warning/8",
                },
                {
                  label: "Done story points",
                  value: storyPointsDone.toString(),
                  icon: TrendingUp,
                  color: "text-accent2",
                  bg: "bg-accent2/8",
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface border border-border rounded-xl p-5">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} w-fit mb-3`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="text-[12px] text-muted">{stat.label}</div>
                  <div className={`text-2xl font-semibold ${stat.color} mt-0.5`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-[14px] font-semibold text-fg mb-6">Task Distribution</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "To Do",
                      count: tickets.filter((t) => t.status === "todo").length,
                      color: "bg-muted",
                    },
                    { label: "In Progress", count: inProgressTickets, color: "bg-accent" },
                    {
                      label: "In Review",
                      count: tickets.filter((t) => t.status === "review").length,
                      color: "bg-accent2",
                    },
                    { label: "Done", count: doneTickets, color: "bg-success" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted2">{item.label}</span>
                        <span className="text-muted">
                          {item.count} tasks · {pct(item.count)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${pct(item.count)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-[14px] font-semibold text-fg mb-6">Priority Breakdown</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Urgent",
                      count: tickets.filter((t) => t.priority === "urgent").length,
                      color: "bg-danger",
                    },
                    {
                      label: "High",
                      count: tickets.filter((t) => t.priority === "high").length,
                      color: "bg-warning",
                    },
                    {
                      label: "Medium",
                      count: tickets.filter((t) => t.priority === "medium").length,
                      color: "bg-accent",
                    },
                    {
                      label: "Low",
                      count: tickets.filter((t) => t.priority === "low").length,
                      color: "bg-muted",
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted2">{item.label}</span>
                        <span className="text-muted">
                          {item.count} tasks · {pct(item.count)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${pct(item.count)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-[14px] font-semibold text-fg mb-2">Sprint History</h3>
              <p className="text-[12px] text-muted">
                Sprint history will appear here when sprint records are available.
              </p>
            </div>

            <div className="h-12" />
          </>
        )}
      </div>
    </div>
  );
}
