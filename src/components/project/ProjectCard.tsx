"use client";

import type { Project } from "@/lib/projects-api";
import { ArrowUpRight, Columns, LayoutList, Timer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { projectKeyPrefix } from "@/lib/ticket-key";

interface ProjectCardProps {
  project: Project;
}

// Deterministic, Jira-style avatar color derived from the project name so each project
// keeps a stable identity color across the app.
const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-sky-500",
  "from-fuchsia-500 to-pink-500",
  "from-lime-500 to-emerald-500",
];

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const base = `/workspace/${workspaceId}/projects/${project.id}`;
  const keyPrefix = projectKeyPrefix(project.name);
  const gradient = gradientForName(project.name);
  const isActive = project.status === "active";

  const quickLinks = [
    { name: "Board", href: `${base}/board`, icon: Columns },
    { name: "Backlog", href: `${base}/backlog`, icon: LayoutList },
    { name: "Sprints", href: `${base}/sprints`, icon: Timer },
  ];

  return (
    <div className="group relative flex flex-col bg-surface border border-border rounded-2xl p-5 hover:border-border-hover transition-all duration-300 shadow-card hover:shadow-card-hover">
      <Link
        href={`${base}/board`}
        className="absolute inset-0 z-[1] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken"
        aria-label={`Open project ${project.name}`}
      />

      <div className="relative z-[2] flex flex-1 flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[13px] font-bold tracking-tight shadow-lg`}
            >
              {keyPrefix.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-fg truncate group-hover:text-fg-strong transition-colors tracking-tight">
                {project.name}
              </h3>
              <span className="text-[11px] font-mono text-muted tracking-tight">{keyPrefix}</span>
            </div>
          </div>

          <span
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-tight border ${
              isActive
                ? "bg-success-soft text-success border-success/15"
                : "bg-hover text-muted2 border-border"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success" : "bg-muted"}`} />
            {isActive ? "Active" : "On hold"}
          </span>
        </div>

        <p className="text-[13px] text-muted leading-relaxed line-clamp-2 group-hover:text-muted2 transition-colors min-h-[38px]">
          {project.description || "No description provided."}
        </p>

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1 pointer-events-auto">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative z-[3] flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-muted hover:text-fg hover:bg-hover transition-colors"
              >
                <link.icon className="w-3 h-3" />
                {link.name}
              </Link>
            ))}
          </div>

          <ArrowUpRight className="w-4 h-4 text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </div>
      </div>
    </div>
  );
}
