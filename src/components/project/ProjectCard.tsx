"use client";

import { Project } from "@/modules/project/mock-projects";
import {
  LayoutDashboard,
  Smartphone,
  Palette,
  MoreHorizontal,
  ArrowUpRight,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Smartphone,
  Palette,
};

export default function ProjectCard({ project }: { project: Project }) {
  const { workspaceId } = useParams();
  const Icon = iconMap[project.icon] || LayoutDashboard;

  return (
    <Link
      href={`/workspace/${workspaceId}/projects/${project.id}/backlog`}
      className="group relative flex flex-col bg-[#16161e]/40 border border-white/[0.05] rounded-3xl p-6 hover:bg-[#1c1c24] hover:border-white/[0.12] transition-all duration-300 shadow-xl shadow-black/20"
    >
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl blur-2xl"
        style={{ backgroundColor: project.color }}
      />

      <div className="relative flex items-start justify-between mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/[0.08] shadow-inner transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${project.color}20`, color: project.color }}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              project.status === "active"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}
          >
            {project.status.replace("_", " ")}
          </div>
          <button className="p-1.5 text-[#333339] hover:text-[#f0f0f5] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono text-[#6b6b80] uppercase tracking-wider">
            {project.key}
          </span>
          <ArrowUpRight className="w-3 h-3 text-[#333339] group-hover:text-[var(--color-accent)] transition-colors" />
        </div>
        <h3 className="text-lg font-black text-[#f0f0f5] mb-2 group-hover:text-white transition-colors tracking-tight font-syne uppercase">
          {project.name}
        </h3>
        <p className="text-[13px] text-[#6b6b80] leading-relaxed line-clamp-2 group-hover:text-[#9090a8] transition-colors">
          {project.description}
        </p>
      </div>

      <div className="relative mt-8 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-[#6b6b80]">Sprint Progress</span>
            <span style={{ color: project.color }}>{project.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out rounded-full"
              style={{
                width: `${project.progress}%`,
                backgroundColor: project.color,
                boxShadow: `0 0 12px ${project.color}40`,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-2">
            {project.members.map((member, i) => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full bg-[#1c1c24] border-2 border-[#16161e] flex items-center justify-center text-[9px] font-black text-[#f0f0f5] group-hover:border-[#1c1c24] transition-all"
                title={member.name}
              >
                {member.initials}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-white/[0.04] border-2 border-[#16161e] flex items-center justify-center text-[9px] font-bold text-[#6b6b80] group-hover:border-[#1c1c24] transition-all">
              +
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#333339] group-hover:text-[#6b6b80] transition-colors">
            <Target className="w-3.5 h-3.5" />
            Active Sprint
          </div>
        </div>
      </div>
    </Link>
  );
}
