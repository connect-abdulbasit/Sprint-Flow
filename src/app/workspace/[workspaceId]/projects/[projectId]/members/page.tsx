"use client";

import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  MessageSquare,
  ChevronDown,
  LayoutDashboard,
  Zap,
  Globe,
  Settings,
  X,
} from "lucide-react";
import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { MOCK_MEMBERS } from "@/modules/project/mock-projects";

export default function ProjectMembersPage() {
  return (
    <div className="flex flex-col h-full bg-[#0d0d12]">
      <ProjectPageHeader />

      {/* Team Distribution Analytics */}
      <div className="px-10 py-10 grid grid-cols-4 gap-6">
        {[
          {
            label: "Active Specialists",
            value: "8",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            icon: Zap,
          },
          {
            label: "Internal Roles",
            value: "3",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            icon: LayoutDashboard,
          },
          {
            label: "Regional Zones",
            value: "2",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            icon: Globe,
          },
          {
            label: "Security Level",
            value: "Alpha",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            icon: Shield,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#16161e]/40 border border-white/[0.04] rounded-[2rem] p-6 flex items-center justify-between group hover:bg-[#1c1c24] hover:border-white/[0.08] transition-all duration-300"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.2em]">
                {stat.label}
              </span>
              <span
                className={`text-xl font-black ${stat.color} tracking-tight font-syne uppercase`}
              >
                {stat.value}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Members Grid Container */}
      <div className="flex-1 overflow-y-auto px-10 py-4 space-y-10 custom-scrollbar">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#333339] uppercase tracking-[0.3em]">
              Resource Hub
            </span>
            <h2 className="text-lg font-black text-[#6b6b80] uppercase tracking-widest flex items-center gap-3 mt-1 font-syne">
              Project Specialists
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl h-10 shadow-inner">
              {["Overview", "Access", "History"].map((tab, i) => (
                <button
                  key={tab}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? "bg-white/[0.08] text-white shadow-lg" : "text-[#6b6b80] hover:text-[#9090a8]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[13px] font-black rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95 group">
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Invite Specialists
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pb-10">
          {MOCK_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group relative bg-[#16161e]/60 border border-white/[0.04] rounded-[3rem] p-8 hover:bg-[#1c1c24] hover:border-white/[0.1] transition-all duration-500 shadow-2xl shadow-black/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] bg-[var(--color-accent)] opacity-5 transition-opacity" />

              <div className="relative flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="relative group/avatar">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-white/[0.08] flex items-center justify-center text-2xl font-black text-[var(--color-accent)] shadow-2xl transition-transform duration-500 group-hover/avatar:scale-110 italic">
                      {member.initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl border-4 border-[#16161e] bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-300 group-hover/avatar:scale-150 rotate-45" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-[#f0f0f5] group-hover:text-white transition-colors tracking-tight font-syne uppercase leading-none">
                        {member.name}
                      </h3>
                      <div
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          member.role === "owner"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                            : "bg-white/[0.03] text-[#6b6b80] border border-white/[0.05]"
                        } italic`}
                      >
                        {member.role}
                      </div>
                    </div>
                    <p className="text-[13px] font-medium text-[#6b6b80] flex items-center gap-2 group-hover:text-[#9090a8] transition-colors leading-none">
                      <Mail className="w-3.5 h-3.5" />
                      {member.name.toLowerCase().replace(" ", ".")}@sprintflow.ai
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#333339] uppercase tracking-widest italic group-hover:text-[#6b6b80] transition-colors">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined Q1 2024
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/[0.06] text-[#333339] hover:text-[#d0d0db] hover:border-white/[0.12] transition-all">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mt-auto pt-8 border-t border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest text-[#9090a8] rounded-xl transition-all border border-white/[0.05] group/msg italic">
                    <MessageSquare className="w-4 h-4 text-[#333339] group-hover/msg:text-[var(--color-accent)] transition-colors" />
                    Direct Access
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest text-[#333339] hover:text-[#6b6b80] rounded-xl transition-all border border-white/[0.05] italic">
                    History
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#333339] hover:text-[var(--color-accent)] transition-all group/shield">
                    <Shield className="w-4 h-4 transition-transform group-hover/shield:scale-125" />
                    Privileges
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover/shield:translate-y-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Large Invite CTA Card */}
          <div className="border-2 border-dashed border-white/[0.03] rounded-[3rem] flex flex-col items-center justify-center p-12 group hover:border-white/[0.08] hover:bg-white/[0.01] transition-all duration-500 cursor-pointer text-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] transition-opacity" />
            <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-[#333339] group-hover:text-indigo-400 group-hover:scale-110 shadow-2xl transition-all duration-500 mb-6">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-[#333339] group-hover:text-[#9090a8] uppercase tracking-[0.3em] font-syne mb-2 transition-colors italic">
              Incorporate Talent
            </h3>
            <p className="text-[11px] font-bold text-[#333339] group-hover:text-[#6b6b80] uppercase tracking-widest italic transition-colors">
              Expand your project velocity
            </p>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
