"use client";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { BarChart3, TrendingUp, Clock, CheckCircle2, Target } from "lucide-react";
import { MOCK_TICKETS, MOCK_SPRINTS } from "@/modules/project/mock-projects";

export default function ProjectReportsPage() {
  const totalTickets = MOCK_TICKETS.length;
  const doneTickets = MOCK_TICKETS.filter((t) => t.status === "done").length;
  const inProgressTickets = MOCK_TICKETS.filter((t) => t.status === "in_progress").length;

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-200">Reports & Analytics</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Performance insights for your project</p>
        </div>

        {/* Summary Cards */}
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
              label: "Avg Velocity",
              value: "48 pts",
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

        {/* Task Distribution */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
            <h3 className="text-[14px] font-semibold text-zinc-200 mb-6">Task Distribution</h3>
            <div className="space-y-4">
              {[
                {
                  label: "To Do",
                  count: MOCK_TICKETS.filter((t) => t.status === "todo").length,
                  color: "bg-zinc-500",
                  total: totalTickets,
                },
                {
                  label: "In Progress",
                  count: inProgressTickets,
                  color: "bg-blue-500",
                  total: totalTickets,
                },
                {
                  label: "In Review",
                  count: MOCK_TICKETS.filter((t) => t.status === "review").length,
                  color: "bg-purple-500",
                  total: totalTickets,
                },
                { label: "Done", count: doneTickets, color: "bg-emerald-500", total: totalTickets },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="text-zinc-500">
                      {item.count} tasks · {Math.round((item.count / item.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
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
                  count: MOCK_TICKETS.filter((t) => t.priority === "urgent").length,
                  color: "bg-red-500",
                  total: totalTickets,
                },
                {
                  label: "High",
                  count: MOCK_TICKETS.filter((t) => t.priority === "high").length,
                  color: "bg-amber-500",
                  total: totalTickets,
                },
                {
                  label: "Medium",
                  count: MOCK_TICKETS.filter((t) => t.priority === "medium").length,
                  color: "bg-blue-500",
                  total: totalTickets,
                },
                {
                  label: "Low",
                  count: MOCK_TICKETS.filter((t) => t.priority === "low").length,
                  color: "bg-zinc-500",
                  total: totalTickets,
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="text-zinc-500">
                      {item.count} tasks · {Math.round((item.count / item.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sprint History */}
        <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-[14px] font-semibold text-zinc-200 mb-6">Sprint History</h3>
          <div className="space-y-1">
            {MOCK_SPRINTS.map((sprint) => (
              <div
                key={sprint.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] rounded-lg transition-all"
              >
                <div
                  className={`w-2 h-2 rounded-full ${sprint.status === "active" ? "bg-emerald-500" : "bg-blue-500"}`}
                />
                <span className="text-[13px] font-medium text-zinc-200 flex-1">{sprint.name}</span>
                <span className="text-[12px] text-zinc-500">{sprint.tickets.length} tasks</span>
                <span className="text-[12px] text-zinc-500">
                  {sprint.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    sprint.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {sprint.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
