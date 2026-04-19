"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  MessageSquare,
  Info,
} from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { MOCK_MEMBERS } from "@/modules/project/mock-projects";

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  admin: "bg-blue-500/10 text-blue-400 border-blue-500/10",
  member: "bg-zinc-500/10 text-zinc-400 border-zinc-500/10",
  viewer: "bg-zinc-500/10 text-zinc-500 border-zinc-500/10",
};

export default function ProjectMembersPage() {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Team Members</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {MOCK_MEMBERS.length} members in this project
            </p>
          </div>
          <div className="relative">
            <button
              disabled
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 text-zinc-500 text-[12px] font-semibold rounded-lg cursor-not-allowed opacity-50"
              aria-label="Invites are only permitted at the Workspace level"
            >
              <Plus className="w-3.5 h-3.5" />
              Invite Member
            </button>
            {tooltipVisible && (
              <div className="absolute right-0 top-full mt-2 w-56 px-3 py-2 rounded-lg text-xs z-50 bg-[#18181f] border border-white/10 shadow-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#4f7cff] shrink-0 mt-0.5" />
                  <p className="text-zinc-400 leading-relaxed">
                    Invites are only permitted at the{" "}
                    <span className="text-zinc-200 font-medium">Workspace level</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Members",
              value: MOCK_MEMBERS.length.toString(),
              color: "text-blue-400",
            },
            { label: "Active Now", value: "3", color: "text-emerald-400" },
            { label: "Roles", value: "4", color: "text-purple-400" },
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

        {/* Members Table */}
        <div className="bg-[#111115] border border-white/[0.05] rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.04] text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="w-10" />
            <div className="flex-1">Member</div>
            <div className="w-24">Role</div>
            <div className="w-32">Email</div>
            <div className="w-24">Status</div>
            <div className="w-16" />
          </div>

          {/* Table Rows */}
          {MOCK_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[13px] font-semibold text-zinc-300 shrink-0">
                {member.initials}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-zinc-200">{member.name}</div>
                <div className="text-[11px] text-zinc-600 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Joined Jan 2024
                </div>
              </div>

              {/* Role */}
              <div className="w-24">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize border ${roleColors[member.role]}`}
                >
                  {member.role}
                </span>
              </div>

              {/* Email */}
              <div className="w-32 text-[12px] text-zinc-500 truncate">
                {member.name.toLowerCase().replace(" ", ".")}@team.io
              </div>

              {/* Status */}
              <div className="w-24">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-zinc-500">Active</span>
                </div>
              </div>

              {/* Actions */}
              <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-md transition-all"
                  title="Message"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] rounded-md transition-all"
                  title="More"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Invite Card — disabled at project level */}
        <div className="border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center py-10 opacity-50 cursor-not-allowed">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500">Invite team members</span>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-[#4f7cff]" />
              Invites are only available at the workspace level
            </p>
          </div>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
