"use client";

import {
  ChevronRight,
  FolderKanban,
  Plus,
  LayoutList,
  Columns,
  Timer,
  Settings,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchProject, type Project } from "@/lib/projects-api";
import { projectKeyPrefix } from "@/lib/ticket-key";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

export default function ProjectPageHeader() {
  const { workspaceId, projectId } = useParams();
  const pathname = usePathname();
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");

  const [project, setProject] = useState<Project | null>(null);
  const { hasRole, isLoading: roleLoading } = useWorkspaceRole(wid);
  const canCreateIssue = !roleLoading && hasRole("project_manager");

  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    fetchProject(pid)
      .then((p) => {
        if (!cancelled) setProject(p);
      })
      .catch(() => {
        if (!cancelled) setProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pid]);

  const navItems = [
    {
      name: "Overview",
      href: `/workspace/${wid}/projects/${pid}/overview`,
      icon: BarChart2,
    },
    { name: "Board", href: `/workspace/${wid}/projects/${pid}/board`, icon: Columns },
    {
      name: "Backlog",
      href: `/workspace/${wid}/projects/${pid}/backlog`,
      icon: LayoutList,
    },
    {
      name: "Sprints",
      href: `/workspace/${wid}/projects/${pid}/sprints`,
      icon: Timer,
    },
    {
      name: "Settings",
      href: `/workspace/${wid}/projects/${pid}/settings`,
      icon: Settings,
    },
  ];

  const name = project?.name ?? "Project";
  const keyPrefix = project ? projectKeyPrefix(project.name) : "…";
  const statusLabel = project?.status === "active" ? "Active" : "On hold";
  const createIssueHref = (() => {
    if (pathname.includes("/backlog")) return `${pathname}?new=1`;
    if (pathname.includes("/board")) return `${pathname}?new=1`;
    return `/workspace/${wid}/projects/${pid}/board?new=1`;
  })();

  return (
    <div className="px-10 pt-6 pb-0 border-b border-border bg-surface-sunken/60 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-1.5 mb-5 ml-0.5 text-[12px] font-medium">
        <Link
          href={`/workspace/${wid}/dashboard`}
          className="text-muted hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <FolderKanban className="w-3 h-3" />
          Workspace
        </Link>
        <ChevronRight className="w-3 h-3 text-muted" />
        <Link
          href={`/workspace/${wid}/projects`}
          className="text-muted hover:text-accent transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="w-3 h-3 text-muted" />
        <span className="text-muted2">{name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-border shadow-sm"
            style={{
              backgroundColor: "var(--color-accent-soft)",
              color: "var(--color-accent)",
            }}
          >
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-fg tracking-tight leading-none">{name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-muted tracking-tight">{keyPrefix}</span>
              <span className="w-1 h-1 rounded-full bg-border-strong" />
              <span
                className={`text-[11px] font-medium ${
                  project?.status === "active" ? "text-success" : "text-muted"
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-4 w-px bg-hover-strong mx-0.5" />

          {canCreateIssue && (
            <Link
              href={createIssueHref}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fg hover:bg-fg-strong text-bg text-[13px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Issue
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 -mb-px">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium transition-all relative border-b-2 ${
                isActive
                  ? "text-fg border-accent"
                  : "text-muted border-transparent hover:text-muted2 hover:border-border-strong"
              }`}
            >
              <item.icon
                className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted group-hover:text-muted2"} transition-colors`}
              />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
