"use client";

import {
  ChevronRight,
  FolderKanban,
  Search,
  Filter,
  Plus,
  LayoutList,
  Columns,
  Timer,
  Settings,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { MOCK_PROJECTS } from "@/modules/project/mock-projects";

export default function ProjectPageHeader() {
  const { workspaceId, projectId } = useParams();
  const pathname = usePathname();

  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];

  const navItems = [
    {
      name: "Overview",
      href: `/workspace/${workspaceId}/projects/${projectId}/overview`,
      icon: BarChart2,
    },
    { name: "Board", href: `/workspace/${workspaceId}/projects/${projectId}/board`, icon: Columns },
    {
      name: "Backlog",
      href: `/workspace/${workspaceId}/projects/${projectId}/backlog`,
      icon: LayoutList,
    },
    {
      name: "Sprints",
      href: `/workspace/${workspaceId}/projects/${projectId}/sprints`,
      icon: Timer,
    },
    {
      name: "Settings",
      href: `/workspace/${workspaceId}/projects/${projectId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="px-10 pt-6 pb-0 border-b border-white/[0.04] bg-[#0c0c0f]/60 backdrop-blur-xl sticky top-0 z-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 mb-5 ml-0.5 text-[12px] font-medium">
        <Link
          href={`/workspace/${workspaceId}/dashboard`}
          className="text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1.5"
        >
          <FolderKanban className="w-3 h-3" />
          Workspace
        </Link>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <Link
          href={`/workspace/${workspaceId}/projects`}
          className="text-zinc-500 hover:text-blue-400 transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
        <span className="text-zinc-300">{project.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06] shadow-sm"
            style={{
              backgroundColor: `${project.color}10`,
              color: project.color,
            }}
          >
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight leading-none">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-zinc-500 tracking-tight">
                {project.key}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span
                className={`text-[11px] font-medium ${
                  project.status === "active" ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {project.status === "active" ? "Active" : "On hold"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search in project..."
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-1.5 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all w-[200px]"
            />
          </div>

          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] border border-white/[0.06] rounded-lg transition-all">
            <Filter className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/[0.06] mx-0.5" />

          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            New Issue
          </button>
        </div>
      </div>

      {/* Project Navigation Tabs */}
      <div className="flex items-center gap-0.5 -mb-px">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium transition-all relative border-b-2 ${
                isActive
                  ? "text-zinc-100 border-blue-500"
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <item.icon
                className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400"} transition-colors`}
              />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
