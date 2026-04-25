"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { Calendar, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectSprintsPage() {
  const { workspaceId, projectId } = useParams();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Sprint Timeline</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Plan and track sprint cycles for this project
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[12px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Sprint
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#111115]/40 px-8 py-16 text-center">
          <Calendar className="mx-auto h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-[14px] font-medium text-zinc-400">No sprints yet</p>
          <p className="text-[12px] text-zinc-600 mt-1 max-w-md mx-auto">
            Sprint scheduling will use live data once the sprint API is connected. Use the board to
            manage tickets today.
          </p>
          <Link
            href={`/workspace/${wid}/projects/${pid}/board`}
            className="inline-flex mt-6 text-[12px] font-medium text-blue-400 hover:text-blue-300"
          >
            Go to board
          </Link>
        </div>

        <div className="flex items-center gap-4 py-4">
          <div className="h-px flex-1 bg-white/[0.03]" />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.04] bg-white/[0.01]">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[11px] font-medium text-zinc-500">Completed Sprints</span>
          </div>
          <div className="h-px flex-1 bg-white/[0.03]" />
        </div>

        <div className="py-12 border border-dashed border-white/[0.04] rounded-xl flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-8 h-8 text-zinc-700 mb-3" />
          <p className="text-[13px] text-zinc-500 font-medium">No completed sprints yet</p>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
