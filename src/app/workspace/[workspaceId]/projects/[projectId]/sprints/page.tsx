"use client";

import { MOCK_SPRINTS, MOCK_PROJECTS } from "@/modules/project/mock-projects";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import {
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
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        {/* Sprint Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Current Velocity",
              value: "42 pts",
              icon: Zap,
              color: "text-emerald-400",
              bg: "bg-emerald-500/8",
            },
            {
              label: "Total Capacity",
              value: "128 pts",
              icon: Target,
              color: "text-blue-400",
              bg: "bg-blue-500/8",
            },
            {
              label: "Completion Rate",
              value: "88%",
              icon: TrendingUp,
              color: "text-purple-400",
              bg: "bg-purple-500/8",
            },
            {
              label: "Est. Delivery",
              value: "May 24",
              icon: Activity,
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
                <div className={`text-xl font-semibold ${stat.color} mt-0.5`}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sprint Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-200">Sprint Timeline</h2>
              <p className="text-[12px] text-zinc-500 mt-0.5">Active and upcoming sprint cycles</p>
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[12px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              New Sprint
            </button>
          </div>

          <div className="space-y-4">
            {MOCK_SPRINTS.map((sprint) => (
              <div
                key={sprint.id}
                className="group bg-[#111115] border border-white/[0.05] rounded-xl p-6 hover:bg-[#141418] hover:border-white/[0.08] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-0.5 p-2.5 rounded-xl ${
                        sprint.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[16px] font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          {sprint.name}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            sprint.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                          }`}
                        >
                          {sprint.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[12px] text-zinc-500">
                        {mounted && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                            {sprint.startDate} — {sprint.endDate}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-600" />
                          {sprint.tickets.length} tasks
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-lg transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/workspace/${workspaceId}/projects/${projectId}/board`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-[12px] font-medium rounded-lg transition-all border border-white/[0.06]"
                    >
                      Board
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {sprint.status === "planning" && (
                      <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[12px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Sprint
                      </button>
                    )}
                  </div>
                </div>

                {/* Sprint Metrics */}
                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-zinc-500">Progress</span>
                      <span className="text-zinc-300">
                        {sprint.tickets.filter((t) => t.status === "done").length} of{" "}
                        {sprint.tickets.length} completed
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          sprint.status === "active" ? "bg-emerald-500" : "bg-blue-500"
                        }`}
                        style={{
                          width: `${(sprint.tickets.filter((t) => t.status === "done").length / sprint.tickets.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-8">
                    {[
                      { label: "Scope", value: sprint.tickets.length },
                      {
                        label: "Points",
                        value: sprint.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0),
                      },
                      {
                        label: "Review",
                        value: sprint.tickets.filter((t) => t.status === "review").length,
                      },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-lg font-semibold text-zinc-200">{item.value}</div>
                        <div className="text-[10px] font-medium text-zinc-600">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed History Divider */}
        <div className="flex items-center gap-4 py-4">
          <div className="h-px flex-1 bg-white/[0.03]" />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.04] bg-white/[0.01]">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[11px] font-medium text-zinc-500">Completed Sprints</span>
          </div>
          <div className="h-px flex-1 bg-white/[0.03]" />
        </div>

        {/* Empty Archive */}
        <div className="py-16 border border-dashed border-white/[0.04] rounded-xl flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-8 h-8 text-zinc-700 mb-3" />
          <p className="text-[13px] text-zinc-500 font-medium">No completed sprints yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Completed sprints will appear here for reference
          </p>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
