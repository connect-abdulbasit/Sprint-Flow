"use client";

import { MOCK_SPRINTS, MOCK_PROJECTS } from "@/modules/project/mock-projects";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import {
  Rocket,
  Calendar,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Target,
  Zap,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function ProjectSprintsPage() {
  const { workspaceId, projectId } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d0d12]">
      <ProjectPageHeader />

      {/* Sprints Content */}
      <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 custom-scrollbar">
        {/* Sprint Analytics Strip - Premium Look */}
        <div className="grid grid-cols-4 gap-6">
          {[
            {
              label: "Active Velocity",
              value: "42 pts",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              icon: Zap,
            },
            {
              label: "Planned Capacity",
              value: "128 pts",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              icon: Target,
            },
            {
              label: "Completion Ratio",
              value: "88%",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              icon: TrendingUp,
            },
            {
              label: "Est. Delivery",
              value: "May 24",
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              icon: Activity,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.02] border border-white/[0.04] rounded-[2rem] p-6 flex flex-col gap-4 group hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#333339] group-hover:text-[#6b6b80] transition-colors" />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#6b6b80] uppercase tracking-[0.2em]">
                  {stat.label}
                </span>
                <div className={`text-xl font-black mt-1 ${stat.color}`}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sprint Timeline Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
                Sequencing
              </span>
              <h2 className="text-sm font-black text-[#6b6b80] uppercase tracking-widest flex items-center gap-2">
                Sprint Timeline
              </h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-[12px] font-black rounded-xl transition-all hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95">
              <Plus className="w-4 h-4" />
              New Sprint
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {MOCK_SPRINTS.map((sprint) => (
              <div
                key={sprint.id}
                className="group relative bg-[#16161e]/40 border border-white/[0.04] rounded-[2.5rem] p-8 hover:bg-[#1c1c24] hover:border-white/[0.08] transition-all duration-500 overflow-hidden"
              >
                {/* Status Glow Overlay */}
                <div
                  className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 transition-opacity duration-700 pointer-events-none ${
                    sprint.status === "active" ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                />

                <div className="relative flex items-start justify-between">
                  <div className="flex items-start gap-6">
                    <div
                      className={`mt-2 p-4 rounded-2xl border transition-all duration-300 group-hover:scale-110 ${
                        sprint.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10"
                      }`}
                    >
                      <Rocket className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black text-[#f0f0f5] group-hover:text-white transition-colors tracking-tight font-syne uppercase">
                          {sprint.name}
                        </h3>
                        <div
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sprint.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {sprint.status}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-[13px] text-[#6b6b80] font-medium">
                        {mounted && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#333339] group-hover:text-[#6b6b80] transition-colors" />
                            {sprint.startDate} — {sprint.endDate}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#333339] group-hover:text-[#6b6b80] transition-colors" />
                          {sprint.tickets.length} Tickets Scheduled
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="p-2.5 text-[#333339] hover:text-[#f0f0f5] hover:bg-white/[0.05] rounded-xl transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    <Link
                      href={`/workspace/${workspaceId}/projects/${projectId}/board`}
                      className="flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-[#d0d0db] hover:text-white text-[13px] font-black rounded-2xl transition-all border border-white/[0.06] shadow-xl shadow-black/20"
                    >
                      View Board
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {sprint.status === "planning" && (
                      <button className="group flex items-center gap-2 px-6 py-3 bg-white text-black text-[13px] font-black rounded-2xl transition-all hover:bg-white/90 shadow-2xl relative overflow-hidden active:scale-95">
                        <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-125" />
                        Start Sprint
                      </button>
                    )}
                  </div>
                </div>

                {/* Performance Analytics Grid */}
                <div className="mt-12 grid grid-cols-4 gap-10 relative pl-4">
                  <div className="col-span-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.2em]">
                          Completion Progress
                        </span>
                        <div className="text-sm font-black text-white">
                          {Math.round(
                            (sprint.tickets.filter((t) => t.status === "done").length /
                              sprint.tickets.length) *
                              100
                          )}
                          % Success Rate
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#6b6b80] mb-0.5">
                        {sprint.tickets.filter((t) => t.status === "done").length} of{" "}
                        {sprint.tickets.length} tasks done
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-1500 ease-out rounded-full ${sprint.status === "active" ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-blue-500"}`}
                        style={{
                          width: `${(sprint.tickets.filter((t) => t.status === "done").length / sprint.tickets.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-12">
                    {[
                      { label: "Scope", count: sprint.tickets.length, desc: "Total Tickets" },
                      {
                        label: "Points",
                        count: sprint.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0),
                        desc: "Total Estimate",
                      },
                      {
                        label: "In Review",
                        count: sprint.tickets.filter((t) => t.status === "review").length,
                        desc: "Pending Quality",
                      },
                    ].map((item) => (
                      <div key={item.label} className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333339] mb-1">
                          {item.label}
                        </div>
                        <div className="text-2xl font-black text-[#d0d0db] group-hover:text-white transition-colors">
                          {item.count}
                        </div>
                        <div className="text-[9px] font-bold text-[#333339] mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed History Section Divider */}
        <div className="flex items-center gap-6 py-12">
          <div className="h-px flex-1 bg-white/[0.03]" />
          <div className="px-6 py-2 rounded-full border border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#333339]" />
            <span className="text-[10px] font-black text-[#6b6b80] uppercase tracking-[0.3em]">
              Completed Archives
            </span>
          </div>
          <div className="h-px flex-1 bg-white/[0.03]" />
        </div>

        {/* Empty Archive State */}
        <div className="py-24 border-2 border-dashed border-white/[0.02] rounded-[3rem] flex flex-col items-center justify-center text-center group hover:bg-white/[0.01] transition-all">
          <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-[#333339] group-hover:text-[#6b6b80] transition-all mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-[14px] text-[#6b6b80] font-black uppercase tracking-widest italic group-hover:text-[#9090a8] transition-colors">
            No completed sprints yet
          </p>
          <p className="text-[11px] text-[#333339] font-bold uppercase tracking-[0.2em] mt-3 italic">
            Maintain momentum to build history
          </p>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
