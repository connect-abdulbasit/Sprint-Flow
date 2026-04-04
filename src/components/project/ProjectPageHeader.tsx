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
  Users,
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
      name: "Members",
      href: `/workspace/${workspaceId}/projects/${projectId}/members`,
      icon: Users,
    },
  ];

  const activeTab = navItems.find((item) => pathname.includes(item.href))?.name || "Overview";

  return (
    <div className="px-8 pt-6 border-b border-white/[0.04] bg-[#111118]/40 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 ml-1">
        <Link
          href={`/workspace/${workspaceId}/projects`}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b6b80] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5"
        >
          <FolderKanban className="w-3 h-3" />
          Projects
        </Link>
        <ChevronRight className="w-3 h-3 text-[#333339]" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0f0f5]">
          {project.name}
        </span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl shadow-inner flex items-center justify-center transition-transform duration-300"
            style={{
              backgroundColor: `${project.color}15`,
              color: project.color,
              border: `1px solid ${project.color}30`,
            }}
          >
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#f0f0f5] tracking-tight font-syne uppercase leading-none">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-mono text-[#6b6b80] uppercase tracking-widest">
                {project.key}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[11px] font-bold text-[#333339] uppercase tracking-[0.1em]">
                Internal Project
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b80] group-focus-within:text-[var(--color-accent)] transition-colors" />
            <input
              type="text"
              placeholder="Search in project..."
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-[13px] text-[#f0f0f5] placeholder-[#6b6b80] focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/[0.06] transition-all w-[240px]"
            />
          </div>

          <button className="p-2 text-[#6b6b80] hover:text-[#f0f0f5] hover:bg-white/[0.05] border border-white/[0.08] rounded-xl transition-all">
            <Filter className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-white/[0.08] mx-1" />

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-[13px] font-black rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-[var(--color-accent)]/20 group">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            Create
          </button>
        </div>
      </div>

      {/* Project Navigation Tabs */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${
                isActive ? "text-white" : "text-[#6b6b80] hover:text-[#9090a8]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${isActive ? "text-[var(--color-accent)]" : "text-[#333339] group-hover:text-[#6b6b80]"} transition-colors`}
              />
              {item.name}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[var(--color-accent)] shadow-[0_-4px_12px_-2px_var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
