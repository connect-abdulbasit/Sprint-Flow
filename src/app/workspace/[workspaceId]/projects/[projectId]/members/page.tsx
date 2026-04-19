"use client";

import { Users, Plus } from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";

export default function ProjectMembersPage() {
  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Team Members</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">0 members in this project</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[12px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Invite Member
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Members", value: "0", color: "text-blue-400" },
            { label: "Active Now", value: "—", color: "text-emerald-400" },
            { label: "Roles", value: "—", color: "text-purple-400" },
            { label: "Pending Invites", value: "0", color: "text-zinc-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111115] border border-white/[0.05] rounded-xl px-5 py-4"
            >
              <div className="text-[12px] text-zinc-500">{stat.label}</div>
              <div className={`text-2xl font-semibold ${stat.color} mt-0.5`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#111115]/30 px-8 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-[14px] font-medium text-zinc-400">No members to show yet</p>
          <p className="text-[12px] text-zinc-600 mt-1">
            A project members API will list collaborators here. Until then, owners are added when
            the project is created.
          </p>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
