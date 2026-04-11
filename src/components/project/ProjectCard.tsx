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
      className="group relative flex flex-col bg-[#111115] border border-white/[0.05] rounded-2xl p-5 hover:bg-[#16161b] hover:border-white/[0.1] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative flex items-start justify-between mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06] shadow-sm transition-all duration-300 group-hover:border-white/[0.15]"
          style={{ backgroundColor: `${project.color}10`, color: project.color }}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-tight ${
              project.status === "active"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/10"
            }`}
          >
            {project.status.replace("_", " ")}
          </div>
          <button className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-medium text-zinc-500 font-mono tracking-tight">
            {project.key}
          </span>
        </div>
        <h3 className="text-[17px] font-semibold text-zinc-100 mb-1.5 group-hover:text-white transition-colors tracking-tight">
          {project.name}
        </h3>
        <p className="text-[13px] text-zinc-500 leading-normal line-clamp-2 group-hover:text-zinc-400 transition-colors">
          {project.description}
        </p>
      </div>

      <div className="relative mt-6 pt-5 border-t border-white/[0.03]">
        {/* Progress */}
        <div className="space-y-2.5 mb-5">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-zinc-500">Progress</span>
            <span className="text-zinc-300">{project.progress}%</span>
          </div>
          <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out rounded-full"
              style={{
                width: `${project.progress}%`,
                backgroundColor: project.color,
                opacity: 0.8,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full bg-zinc-800 border-[1.5px] border-zinc-900 flex items-center justify-center text-[9px] font-semibold text-zinc-300"
                title={member.name}
              >
                {member.initials}
              </div>
            ))}
            {project.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-zinc-800 border-[1.5px] border-zinc-900 flex items-center justify-center text-[9px] font-medium text-zinc-500">
                +{project.members.length - 3}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
            <Target className="w-3.5 h-3.5" />
            <span className="truncate max-w-[80px]">Active Sprint</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
