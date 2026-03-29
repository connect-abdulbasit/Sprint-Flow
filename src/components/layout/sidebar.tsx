"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart2,
  Users,
  Settings,
  Briefcase,
  Columns,
  ListTodo,
  Rocket,
  FileText,
  ChevronLeft,
  ChevronRight,
  Bell,
  KanbanSquare,
  Layers,
  CircleUserRound,
  Timer,
} from "lucide-react";
import { useState } from "react";
import OrgWorkspaceSwitcher from "./org-workspace-switcher";

interface NavItemDef {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSectionDef {
  label: string;
  items: NavItemDef[];
  dot?: string; // optional colored dot next to section label
}

export default function Sidebar() {
  const pathname = usePathname() || "";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const workspaceMatch = pathname.match(/^\/workspace\/([^/]+)/);
  const workspaceId = workspaceMatch ? workspaceMatch[1] : "default";

  const projectMatch = pathname.match(/^\/workspace\/[^/]+\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  // ── Sidebar Sections ─────────────────────────────────

  const sections: NavSectionDef[] = [
    {
      label: "Planning",
      items: [
        {
          name: "Dashboard",
          href: `/workspace/${workspaceId}/dashboard`,
          icon: LayoutDashboard,
        },
        {
          name: "Backlog",
          href: `/workspace/${workspaceId}/backlog`,
          icon: Layers,
        },
        {
          name: "Board",
          href: `/workspace/${workspaceId}/board`,
          icon: KanbanSquare,
        },
        {
          name: "Sprints",
          href: `/workspace/${workspaceId}/sprints`,
          icon: Timer,
        },
      ],
    },
    {
      label: "Work",
      items: [
        {
          name: "My Tasks",
          href: `/workspace/${workspaceId}/my-tasks`,
          icon: CheckSquare,
        },
        {
          name: "Assigned to Me",
          href: `/workspace/${workspaceId}/assigned`,
          icon: CircleUserRound,
        },
        {
          name: "Notifications",
          href: `/workspace/${workspaceId}/notifications`,
          icon: Bell,
          badge: "3",
        },
      ],
    },
    {
      label: "Manage",
      items: [
        {
          name: "Projects",
          href: `/workspace/${workspaceId}/projects`,
          icon: FolderKanban,
        },
        {
          name: "Team",
          href: `/workspace/${workspaceId}/team`,
          icon: Users,
        },
        {
          name: "Reports",
          href: `/workspace/${workspaceId}/reports`,
          icon: BarChart2,
        },
        {
          name: "Settings",
          href: `/workspace/${workspaceId}/settings`,
          icon: Settings,
        },
      ],
    },
  ];

  const projectMenuItems: NavItemDef[] = projectId
    ? [
        {
          name: "Overview",
          href: `/workspace/${workspaceId}/projects/${projectId}/overview`,
          icon: Briefcase,
        },
        {
          name: "Board",
          href: `/workspace/${workspaceId}/projects/${projectId}/board`,
          icon: Columns,
        },
        {
          name: "Backlog",
          href: `/workspace/${workspaceId}/projects/${projectId}/backlog`,
          icon: ListTodo,
        },
        {
          name: "Sprints",
          href: `/workspace/${workspaceId}/projects/${projectId}/sprints`,
          icon: Rocket,
        },
        {
          name: "Members",
          href: `/workspace/${workspaceId}/projects/${projectId}/members`,
          icon: Users,
        },
        {
          name: "Reports",
          href: `/workspace/${workspaceId}/projects/${projectId}/reports`,
          icon: FileText,
        },
        {
          name: "Settings",
          href: `/workspace/${workspaceId}/projects/${projectId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  // ── Active state logic ────────────────────────────────

  const isItemActive = (item: NavItemDef) => {
    if (item.name === "Dashboard") return pathname === item.href;
    if (item.name === "Projects" && !projectId) return pathname.startsWith(item.href);
    if (projectId && item.href.includes(projectId)) return pathname.includes(item.href);
    return pathname === item.href;
  };

  // ── NavItem Component ─────────────────────────────────

  const NavItem = ({ item }: { item: NavItemDef }) => {
    const active = isItemActive(item);

    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[13px] font-medium relative ${
          active
            ? "text-white bg-white/[0.07]"
            : "text-[#9090a8] hover:text-[#d0d0db] hover:bg-white/[0.03]"
        } ${isCollapsed ? "justify-center px-0" : ""}`}
        title={isCollapsed ? item.name : undefined}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-accent)] rounded-r-full" />
        )}
        <item.icon
          className={`w-[17px] h-[17px] shrink-0 transition-colors duration-200 ${
            active ? "text-[var(--color-accent)]" : "text-[#6b6b80] group-hover:text-[#9090a8]"
          }`}
        />
        {!isCollapsed && <span className="flex-1 truncate relative z-10">{item.name}</span>}
        {!isCollapsed && item.badge && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-bold px-1">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // ── Section Label ─────────────────────────────────────

  const SectionLabel = ({ label, dot }: { label: string; dot?: string }) => {
    if (isCollapsed) {
      return <div className="mx-auto w-5 h-px bg-[#333339] my-2" />;
    }
    return (
      <div className="px-3 mb-2 mt-1 text-[10px] font-semibold text-[#6b6b80] uppercase tracking-[0.12em] flex items-center gap-2">
        {dot && (
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: dot, boxShadow: `0 0 6px ${dot}` }}
          />
        )}
        {label}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#111118]/60 backdrop-blur-2xl text-[#f0f0f5] border-r border-[#333339] shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] z-40 ${
        isCollapsed ? "w-[68px]" : "w-[252px]"
      }`}
    >
      {/* ── Org / Workspace Switcher ── */}
      <OrgWorkspaceSwitcher isCollapsed={isCollapsed} />

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {sections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            <SectionLabel label={section.label} dot={section.dot} />
            {section.items.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        ))}

        {/* ── Project Context ── */}
        {projectId && (
          <div className="space-y-0.5 pt-4 border-t border-[#333339]">
            <SectionLabel label="Project" dot="#00d4aa" />
            {projectMenuItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#18181f] border border-white/[0.08] shadow-lg flex items-center justify-center text-[#9090a8] hover:text-white hover:border-[var(--color-accent)]/40 transition-all duration-200 z-50 hover:scale-110"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* ── User Profile Footer ── */}
      <div className="px-4 py-3 border-t border-[#333339]">
        <div
          className={`flex items-center gap-3 cursor-pointer hover:bg-white/[0.04] p-2 rounded-xl transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface2)] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-[var(--color-muted2)] shrink-0">
            AB
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-semibold truncate text-[#f0f0f5]">Abdul Basit</div>
              <div className="text-[11px] text-[#6b6b80] truncate">abdul@example.com</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
