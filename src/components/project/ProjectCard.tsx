"use client";

import type { Project } from "@/lib/projects-api";
import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const projectHref = `/workspace/${workspaceId}/projects/${project.id}/board`;

  return (
    <div className="group relative flex flex-col bg-[#111115] border border-white/[0.05] rounded-2xl p-5 hover:bg-[#16161b] hover:border-white/[0.1] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/40">
      <Link
        href={projectHref}
        className="absolute inset-0 z-[1] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
        aria-label={`Open project ${project.name}`}
      />

      <div className="relative z-[2] flex flex-1 flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
            <FolderKanban className="w-5 h-5" />
          </div>

          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-tight bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            {project.status}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="text-[17px] font-semibold text-zinc-100 mb-1.5 group-hover:text-white transition-colors tracking-tight">
            {project.name}
          </h3>
          <p className="text-[13px] text-zinc-500 leading-normal line-clamp-2 group-hover:text-zinc-400 transition-colors">
            {project.description || "No description"}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.03] flex items-center justify-between">
          <span className="text-[11px] text-zinc-600 font-medium">
            Created{" "}
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
