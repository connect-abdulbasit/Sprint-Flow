"use client";

import { Target, Zap, Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchTickets, type ProjectTicket } from "@/lib/projects-api";
import { initialsFromName } from "@/lib/initials";

export default function ProjectOverviewPage() {
  const { workspaceId, projectId } = useParams();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  const [tickets, setTickets] = useState<ProjectTicket[]>([]);

  useEffect(() => {
    if (!pid) return;
    fetchTickets(pid)
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [pid]);

  const totalTickets = tickets.length;
  const doneTickets = tickets.filter((t) => t.status === "done").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const todoTickets = tickets.filter((t) => t.status === "todo").length;
  const completionRate = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  const priorityTickets = tickets.filter((t) => t.priority === "urgent" || t.priority === "high");

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-emerald-400">Project overview</span>
              <span className="text-[11px] text-zinc-500">·</span>
              <span className="text-[12px] text-zinc-500">
                Live ticket counts from your workspace
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Completion Rate",
              value: `${completionRate}%`,
              change: totalTickets ? `${doneTickets} done` : "No tickets",
              positive: true,
              icon: Target,
              color: "text-blue-400",
              bg: "bg-blue-500/8",
            },
            {
              label: "Open work",
              value: `${todoTickets + inProgressTickets}`,
              change: `${todoTickets} todo`,
              positive: true,
              icon: Zap,
              color: "text-emerald-400",
              bg: "bg-emerald-500/8",
            },
            {
              label: "Active Tasks",
              value: `${inProgressTickets}`,
              change: `${todoTickets} pending`,
              positive: true,
              icon: Activity,
              color: "text-purple-400",
              bg: "bg-purple-500/8",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111115] border border-white/[0.05] rounded-xl p-5 flex flex-col gap-3 hover:bg-[#141418] hover:border-white/[0.08] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-[12px] font-medium text-zinc-500">{stat.label}</span>
                <div className="text-2xl font-semibold text-zinc-100 mt-0.5 tracking-tight">
                  {stat.value}
                </div>
                <span
                  className={`text-[11px] font-medium ${stat.positive ? "text-emerald-400" : "text-red-400"}`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-200">Sprint Velocity</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Story points completed per sprint
                </p>
              </div>
            </div>
            <div className="h-[180px] flex items-center justify-center rounded-lg border border-dashed border-white/[0.06] text-[13px] text-zinc-600">
              Connect sprint history to chart velocity here.
            </div>
          </div>

          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-semibold text-zinc-200">Recent Activity</h3>
            </div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              Activity feed will show ticket updates when the activity API is enabled.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-zinc-200">Active Sprint</h3>
              <Link
                href={`/workspace/${wid}/projects/${pid}/sprints`}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="text-center py-8 text-zinc-600 text-[13px]">
              No active sprint in the database
            </div>
          </div>

          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-zinc-200">Priority Tasks</h3>
              <Link
                href={`/workspace/${wid}/projects/${pid}/backlog`}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                Backlog
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-1">
              {priorityTickets.length === 0 ? (
                <p className="text-[13px] text-zinc-600 py-4 text-center">
                  No high-priority tickets
                </p>
              ) : (
                priorityTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all group cursor-pointer"
                  >
                    <div
                      className={`w-1 h-8 rounded-full shrink-0 ${
                        ticket.priority === "urgent" ? "bg-red-500" : "bg-amber-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-zinc-600">{ticket.key}</span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            ticket.priority === "urgent"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="text-[13px] text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                        {ticket.title}
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[9px] font-semibold text-zinc-400 shrink-0">
                      {initialsFromName(ticket.assigneeName)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
