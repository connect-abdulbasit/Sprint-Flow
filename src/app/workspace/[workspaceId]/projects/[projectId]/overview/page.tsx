"use client";

import {
  TrendingUp,
  Target,
  Users,
  Zap,
  Activity,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  MOCK_SPRINTS,
  MOCK_TICKETS,
  MOCK_PROJECTS,
  MOCK_MEMBERS,
} from "@/modules/project/mock-projects";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProjectOverviewPage() {
  const { workspaceId, projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  const totalTickets = MOCK_TICKETS.length;
  const doneTickets = MOCK_TICKETS.filter((t) => t.status === "done").length;
  const inProgressTickets = MOCK_TICKETS.filter((t) => t.status === "in_progress").length;
  const todoTickets = MOCK_TICKETS.filter((t) => t.status === "todo").length;
  const completionRate = Math.round((doneTickets / totalTickets) * 100);

  const activeSprint = MOCK_SPRINTS.find((s) => s.status === "active");

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        {/* Project Health Banner */}
        <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-emerald-400">On Track</span>
              <span className="text-[11px] text-zinc-500">·</span>
              <span className="text-[12px] text-zinc-500">
                Sprint velocity is above target by 12%
              </span>
            </div>
          </div>
          <button className="text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
            View details
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Completion Rate",
              value: `${completionRate}%`,
              change: "+8%",
              positive: true,
              icon: Target,
              color: "text-blue-400",
              bg: "bg-blue-500/8",
            },
            {
              label: "Sprint Velocity",
              value: "48 pts",
              change: "+12%",
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
            {
              label: "Team Members",
              value: `${project.members.length}`,
              change: "All active",
              positive: true,
              icon: Users,
              color: "text-amber-400",
              bg: "bg-amber-500/8",
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Sprint Velocity Chart */}
          <div className="col-span-2 bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-200">Sprint Velocity</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Story points completed per sprint
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                {["6 Sprints", "12 Sprints", "All"].map((view, i) => (
                  <button
                    key={view}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${i === 0 ? "bg-white/[0.06] text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[220px] flex items-end justify-between gap-3 px-4 relative">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-dashed border-white/[0.03]"
                  style={{ bottom: `${i * 33}%` }}
                />
              ))}

              {[
                { height: 54, label: "S01" },
                { height: 72, label: "S02" },
                { height: 65, label: "S03" },
                { height: 88, label: "S04" },
                { height: 78, label: "S05" },
                { height: 96, label: "S06" },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="group relative flex flex-col items-center gap-3 flex-1 z-10"
                >
                  <div className="absolute -top-8 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-200 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                    {bar.height} pts
                  </div>
                  <div
                    className={`w-full rounded-md transition-all duration-700 ease-out cursor-pointer ${
                      i === 5
                        ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                    style={{ height: `${bar.height}%` }}
                  />
                  <span className="text-[10px] font-medium text-zinc-600">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-semibold text-zinc-200">Recent Activity</h3>
              <button className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                View all
              </button>
            </div>

            <div className="space-y-5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {[
                {
                  user: "AB",
                  name: "Abdul Basit",
                  action: "completed",
                  target: "SF-3",
                  time: "2h ago",
                  color: "text-emerald-400",
                },
                {
                  user: "MK",
                  name: "Michael King",
                  action: "created",
                  target: "SF-8",
                  time: "4h ago",
                  color: "text-blue-400",
                },
                {
                  user: "AB",
                  name: "Abdul Basit",
                  action: "moved",
                  target: "SF-1",
                  time: "5h ago",
                  color: "text-purple-400",
                },
                {
                  user: "JD",
                  name: "John Doe",
                  action: "reviewed",
                  target: "SF-5",
                  time: "1d ago",
                  color: "text-amber-400",
                },
                {
                  user: "SS",
                  name: "Sarah Smith",
                  action: "assigned",
                  target: "SF-7",
                  time: "2d ago",
                  color: "text-cyan-400",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0">
                    {item.user}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-zinc-400 leading-relaxed">
                      <span className="text-zinc-200 font-medium">{item.name}</span> {item.action}{" "}
                      <span className="text-blue-400 font-mono text-[11px]">{item.target}</span>
                    </p>
                    <span className="text-[11px] text-zinc-600 mt-0.5 block">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid: Team + Active Sprint + Priority Tasks */}
        <div className="grid grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-zinc-200">Team</h3>
            </div>

            <div className="space-y-3">
              {MOCK_MEMBERS.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-1.5 group">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[11px] font-semibold text-zinc-300">
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 truncate">
                      {member.name}
                    </div>
                    <div className="text-[11px] text-zinc-600 capitalize">{member.role}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/60" title="Online" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Sprint Summary */}
          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-zinc-200">Active Sprint</h3>
              <Link
                href={`/workspace/${workspaceId}/projects/${projectId}/sprints`}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {activeSprint ? (
              <div className="space-y-5">
                <div>
                  <div className="text-[14px] font-medium text-zinc-200">{activeSprint.name}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                    {activeSprint.startDate} — {activeSprint.endDate}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-zinc-500">Progress</span>
                    <span className="text-zinc-300">
                      {activeSprint.tickets.filter((t) => t.status === "done").length} /{" "}
                      {activeSprint.tickets.length} tasks
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(activeSprint.tickets.filter((t) => t.status === "done").length / activeSprint.tickets.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    {
                      label: "To Do",
                      count: activeSprint.tickets.filter((t) => t.status === "todo").length,
                      color: "text-zinc-400",
                    },
                    {
                      label: "In Progress",
                      count: activeSprint.tickets.filter((t) => t.status === "in_progress").length,
                      color: "text-blue-400",
                    },
                    {
                      label: "Done",
                      count: activeSprint.tickets.filter((t) => t.status === "done").length,
                      color: "text-emerald-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="text-center py-2 bg-white/[0.02] rounded-lg">
                      <div className={`text-lg font-semibold ${item.color}`}>{item.count}</div>
                      <div className="text-[10px] font-medium text-zinc-600">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-600 text-[13px]">No active sprint</div>
            )}
          </div>

          {/* Priority Tasks */}
          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-zinc-200">Priority Tasks</h3>
              <Link
                href={`/workspace/${workspaceId}/projects/${projectId}/backlog`}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                Backlog
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-1">
              {MOCK_TICKETS.filter((t) => t.priority === "urgent" || t.priority === "high").map(
                (ticket) => (
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
                      {ticket.assignee?.initials || "?"}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
