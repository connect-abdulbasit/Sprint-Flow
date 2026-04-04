"use client";

import {
  BarChart3,
  Target,
  Users,
  Clock,
  Activity,
  TrendingUp,
  MoreHorizontal,
  ChevronRight,
  Zap,
  ArrowUpRight,
  History,
  LayoutDashboard,
} from "lucide-react";
import { MOCK_SPRINTS, MOCK_TICKETS, MOCK_PROJECTS } from "@/modules/project/mock-projects";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { useParams } from "next/navigation";

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  const totalTickets = MOCK_TICKETS.length;
  const doneTickets = MOCK_TICKETS.filter((t) => t.status === "done").length;
  const inProgressTickets = MOCK_TICKETS.filter((t) => t.status === "in_progress").length;
  const completionRate = Math.round((doneTickets / totalTickets) * 100);

  return (
    <div className="flex flex-col h-full bg-[#0d0d12]">
      <ProjectPageHeader />

      {/* Overview Analytics Feed */}
      <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 custom-scrollbar">
        {/* Executive KOs Grid */}
        <div className="grid grid-cols-4 gap-6">
          {[
            {
              label: "Active Momentum",
              value: "85%",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              icon: TrendingUp,
              desc: "+12% from last week",
            },
            {
              label: "Pipeline Success",
              value: `${completionRate}%`,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              icon: Target,
              desc: "On track for Milestone",
            },
            {
              label: "Team Velocity",
              value: "48 pts",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              icon: Zap,
              desc: "Average per Sprint",
            },
            {
              label: "Resource Load",
              value: "92%",
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              icon: Users,
              desc: "Optimized allocation",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#16161e]/40 border border-white/[0.04] rounded-[2.5rem] p-8 flex flex-col gap-6 group hover:bg-[#1c1c24] hover:border-white/[0.08] transition-all duration-500 shadow-2xl shadow-black/20 overflow-hidden relative"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: stat.color.replace("text-", "") }}
              />
              <div className="flex items-center justify-between relative z-10">
                <div
                  className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-lg shadow-black/20`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <MoreHorizontal className="w-5 h-5 text-[#333339] group-hover:text-[#6b6b80] transition-colors" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.2em] group-hover:text-[#6b6b80] transition-colors">
                  {stat.label}
                </span>
                <div
                  className={`text-3xl font-black mt-2 ${stat.color} tracking-tight font-syne uppercase`}
                >
                  {stat.value}
                </div>
                <p className="text-[10px] font-bold text-white/20 mt-2 tracking-widest group-hover:text-white/40 transition-colors uppercase italic">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Visualization Section */}
        <div className="grid grid-cols-3 gap-8">
          {/* Main Velocity Chart */}
          <div className="col-span-2 bg-[#16161e]/40 border border-white/[0.04] rounded-[3rem] p-10 hover:bg-[#16161e]/60 hover:border-white/[0.08] transition-all duration-500 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-12">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
                  Performance Metrics
                </span>
                <h3 className="text-lg font-black text-[#f0f0f5] uppercase tracking-wider flex items-center gap-3 mt-1 font-syne">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Sprint Velocity Matrix
                </h3>
              </div>
              <div className="flex p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                {["Sprint View", "Weekly", "Monthly"].map((view, i) => (
                  <button
                    key={view}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? "bg-white/[0.08] text-white shadow-lg" : "text-[#6b6b80] hover:text-[#9090a8]"}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[280px] flex items-end justify-between px-10 relative">
              {/* Chart Grid Lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-white/[0.02]"
                  style={{ bottom: `${i * 25}%` }}
                />
              ))}

              {[54, 72, 65, 88, 78, 96].map((height, i) => (
                <div key={i} className="group relative flex flex-col items-center gap-4 w-14 z-10">
                  <div className="absolute -top-12 bg-[#1c1c24] border border-white/[0.1] px-3 py-1.5 rounded-xl text-[12px] font-black text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl scale-75 group-hover:scale-100">
                    {height} pts
                  </div>
                  <div
                    className={`w-full rounded-t-2xl bg-gradient-to-t transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer overflow-hidden ${
                      i === 5
                        ? "from-indigo-600 to-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                        : "from-white/[0.04] to-white/[0.1] hover:to-indigo-500/40 border-x border-t border-white/[0.05]"
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  </div>
                  <span className="text-[10px] font-black text-[#333339] group-hover:text-[#6b6b80] transition-colors tracking-widest">
                    S0{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Pulse Feed */}
          <div className="bg-[#16161e]/40 border border-white/[0.04] rounded-[3rem] p-10 hover:bg-[#16161e]/60 hover:border-white/[0.08] transition-all duration-500 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
                  Realtime Activity
                </span>
                <h3 className="text-lg font-black text-[#f0f0f5] uppercase tracking-wider flex items-center gap-3 mt-1 font-syne">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Project Pulse
                </h3>
              </div>
              <button className="p-2 text-[#333339] hover:text-[#6b6b80] transition-colors">
                <History className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8 max-h-[360px] overflow-y-auto no-scrollbar relative pr-2">
              {[
                {
                  user: "AB",
                  action: "finalized",
                  target: "SF-UI-Board",
                  time: "2h ago",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/20",
                },
                {
                  user: "MK",
                  action: "created",
                  target: "UX-Flow-Sprints",
                  time: "4h ago",
                  color: "text-blue-400",
                  bg: "bg-blue-500/20",
                },
                {
                  user: "AB",
                  action: "merged",
                  target: "CORE-01",
                  time: "5h ago",
                  color: "text-orange-400",
                  bg: "bg-orange-500/20",
                },
                {
                  user: "JD",
                  action: "approved",
                  target: "MB-App-Setup",
                  time: "1d ago",
                  color: "text-purple-400",
                  bg: "bg-purple-500/20",
                },
                {
                  user: "MK",
                  action: "launched",
                  target: "PROJ-Alpha",
                  time: "2d ago",
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/20",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group/pulse cursor-pointer">
                  <div
                    className={`w-10 h-10 rounded-2xl ${item.bg} border border-white/[0.05] flex items-center justify-center text-[11px] font-black ${item.color} shrink-0 shadow-lg shadow-black/20 group-hover/pulse:scale-110 transition-transform duration-300 italic`}
                  >
                    {item.user}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-[13px] text-[#6b6b80] leading-snug group-hover/pulse:text-[#9090a8] transition-colors">
                      <span className="text-[#f0f0f5] font-black uppercase tracking-widest text-[10px] mr-2 italic">
                        {item.user}
                      </span>
                      {item.action}{" "}
                      <span className="text-[var(--color-accent)] font-mono font-black italic">
                        {item.target}
                      </span>
                    </p>
                    <span className="text-[10px] text-[#333339] font-black uppercase tracking-[0.2em] mt-1 block italic">
                      {item.time}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#333339] opacity-0 group-hover/pulse:opacity-100 transition-all" />
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-3 text-[11px] font-black text-[#6b6b80] hover:text-[#f0f0f5] border border-dashed border-white/[0.08] rounded-2xl hover:border-white/[0.2] hover:bg-white/[0.02] transition-all flex items-center justify-center gap-3 uppercase tracking-widest italic group">
              Exploration Context
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Milestone Tracker Section */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
                Critical Trajectory
              </span>
              <h2 className="text-lg font-black text-[#6b6b80] uppercase tracking-widest flex items-center gap-3 mt-1 font-syne">
                Priority Milestones
              </h2>
            </div>
            <button className="text-[11px] font-black text-[#333339] hover:text-[#6b6b80] uppercase tracking-[0.2em] transition-colors italic">
              View Roadmap
            </button>
          </div>

          <div className="bg-[#16161e]/20 border border-white/[0.04] rounded-[2.5rem] overflow-hidden divide-y divide-white/[0.04] shadow-2xl shadow-black/10">
            {MOCK_TICKETS.filter((t) => t.priority === "urgent" || t.priority === "high").map(
              (ticket) => (
                <div
                  key={ticket.id}
                  className="p-6 flex items-center justify-between group hover:bg-white/[0.03] transition-all duration-300"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-1.5 h-12 rounded-full transition-all duration-500 group-hover:h-8 ${ticket.priority === "urgent" ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]"}`}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-black text-[#333339] group-hover:text-[#6b6b80] transition-colors">
                          {ticket.key}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-[#d0d0db] group-hover:text-white transition-colors tracking-tight font-syne uppercase leading-none">
                        {ticket.title}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right flex flex-col gap-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#333339]">
                        Allocated Specialist
                      </div>
                      <div className="text-[12px] font-black text-[#9090a8] uppercase italic">
                        {ticket.assignee?.name || "Neural Assignee"}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#333339] group-hover:text-[var(--color-accent)] group-hover:scale-110 transition-all duration-300 cursor-pointer">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Global Overview Controls */}
        <div className="flex items-center justify-center py-10 opacity-20 hover:opacity-50 transition-opacity">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#6b6b80]">
              Sprint-Flow Intelligence V1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
