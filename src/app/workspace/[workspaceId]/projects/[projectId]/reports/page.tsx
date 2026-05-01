"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchTickets, type ProjectTicket } from "@/lib/projects-api";
import { ProjectReportsBodySkeleton } from "@/components/ui/skeleton";

export default function ProjectReportsPage() {
  const { projectId } = useParams();
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [tickets, setTickets] = useState<ProjectTicket[]>([]);
  const [reportsReady, setReportsReady] = useState(false);

  useEffect(() => {
    if (!pid) return;
    setReportsReady(false);
    fetchTickets(pid)
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setReportsReady(true));
  }, [pid]);

  const totalTickets = tickets.length;
  const doneTickets = tickets.filter((t) => t.status === "done").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const storyPointsDone = tickets
    .filter((t) => t.status === "done")
    .reduce((a, t) => a + (t.storyPoints ?? 0), 0);

  const pct = (n: number) => (totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0);

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-200">Reports & Analytics</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Performance insights for your project</p>
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
                  color: "text-blue-400",
                  bg: "bg-blue-500/8",
                },
                {
                  label: "Completed",
                  value: doneTickets.toString(),
                  icon: CheckCircle2,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/8",
                },
                {
                  label: "In Progress",
                  value: inProgressTickets.toString(),
                  icon: Clock,
                  color: "text-amber-400",
                  bg: "bg-amber-500/8",
                },
                {
                  label: "Done story points",
                  value: storyPointsDone.toString(),
                  icon: TrendingUp,
                  color: "text-purple-400",
                  bg: "bg-purple-500/8",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#111115] border border-white/[0.05] rounded-xl p-5"
                >
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} w-fit mb-3`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="text-[12px] text-zinc-500">{stat.label}</div>
                  <div className={`text-2xl font-semibold ${stat.color} mt-0.5`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
                <h3 className="text-[14px] font-semibold text-zinc-200 mb-6">Task Distribution</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "To Do",
                      count: tickets.filter((t) => t.status === "todo").length,
                      color: "bg-zinc-500",
                    },
                    { label: "In Progress", count: inProgressTickets, color: "bg-blue-500" },
                    {
                      label: "In Review",
                      count: tickets.filter((t) => t.status === "review").length,
                      color: "bg-purple-500",
                    },
                    { label: "Done", count: doneTickets, color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-zinc-500">
                          {item.count} tasks · {pct(item.count)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${pct(item.count)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
                <h3 className="text-[14px] font-semibold text-zinc-200 mb-6">Priority Breakdown</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Urgent",
                      count: tickets.filter((t) => t.priority === "urgent").length,
                      color: "bg-red-500",
                    },
                    {
                      label: "High",
                      count: tickets.filter((t) => t.priority === "high").length,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Medium",
                      count: tickets.filter((t) => t.priority === "medium").length,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Low",
                      count: tickets.filter((t) => t.priority === "low").length,
                      color: "bg-zinc-500",
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-zinc-500">
                          {item.count} tasks · {pct(item.count)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
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

            <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
              <h3 className="text-[14px] font-semibold text-zinc-200 mb-2">Sprint History</h3>
              <p className="text-[12px] text-zinc-600">
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
