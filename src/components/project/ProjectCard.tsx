"use client";

import type { Project } from "@/lib/projects-api";
import { FolderKanban, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="group relative flex flex-col bg-[#111115] border border-white/[0.05] rounded-2xl p-5 hover:bg-[#16161b] hover:border-white/[0.1] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/40">
      {/* Top row: icon + badge + menu */}
      <div className="flex items-start justify-between mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
          <FolderKanban className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-tight bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            {project.status}
          </span>

          {/* Dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Project actions"
              aria-expanded={menuOpen}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded-md hover:bg-white/[0.05]"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-40 bg-[#111115] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 py-1.5 z-50 animate-[fadeIn_0.15s_ease]"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(project);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(project);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body — clickable link to project detail */}
      <Link href={`/workspace/${workspaceId}/projects/${project.id}/board`} className="flex-1">
        <h3 className="text-[17px] font-semibold text-zinc-100 mb-1.5 group-hover:text-white transition-colors tracking-tight">
          {project.name}
        </h3>
        <p className="text-[13px] text-zinc-500 leading-normal line-clamp-2 group-hover:text-zinc-400 transition-colors">
          {project.description || "No description"}
        </p>
      </Link>

      {/* Footer */}
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
  );
}
