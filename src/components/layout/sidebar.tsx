"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWorkspaceNav } from "@/contexts/workspace-nav-context";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import OrgWorkspaceSwitcher from "./org-workspace-switcher";
import { fetchProjects, type Project } from "@/lib/projects-api";
import { projectKeyPrefix } from "@/lib/ticket-key";

interface NavItemDef {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSectionDef {
  label: string;
  items: NavItemDef[];
  dot?: string;
}

export default function Sidebar() {
  const pathname = usePathname() || "";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const { workspaceIdForNav } = useWorkspaceNav();

  const workspaceBase = workspaceIdForNav
    ? `/workspace/${workspaceIdForNav}`
    : "/onboarding/workspace";

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      if (!workspaceIdForNav) {
        setUnreadNotificationsCount(0);
        return;
      }

      try {
        const res = await fetch(`/api/workspaces/${workspaceIdForNav}/notifications`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setUnreadNotificationsCount(0);
          return;
        }

        const data = (await res.json()) as
          | Array<{ isRead: boolean }>
          | { unreadCount?: number; items?: Array<{ isRead: boolean }> };
        if (!cancelled) {
          if (Array.isArray(data)) {
            setUnreadNotificationsCount(data.filter((item) => !item.isRead).length);
          } else if (typeof data.unreadCount === "number") {
            setUnreadNotificationsCount(data.unreadCount);
          } else {
            setUnreadNotificationsCount((data.items ?? []).filter((item) => !item.isRead).length);
          }
        }
      } catch {
        if (!cancelled) setUnreadNotificationsCount(0);
      }
    }

    void loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [workspaceIdForNav, pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setCurrentUser(null);
          return;
        }

        const data = (await res.json()) as {
          user?: {
            name?: string | null;
            email?: string | null;
            avatarUrl?: string | null;
          } | null;
        };
        const name = data.user?.name?.trim();
        const email = data.user?.email?.trim();

        if (!cancelled && name && email) {
          setCurrentUser({
            name,
            email,
            avatarUrl: data.user?.avatarUrl ?? null,
          });
        } else if (!cancelled) {
          setCurrentUser(null);
        }
      } catch {
        if (!cancelled) setCurrentUser(null);
      }
    }

    void loadCurrentUser();

    const onProfileUpdated = () => {
      void loadCurrentUser();
    };
    window.addEventListener("sf-profile-updated", onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("sf-profile-updated", onProfileUpdated);
    };
  }, []);

  // Auto-open the Projects group whenever the user is anywhere under /projects so the
  // active project is visible in the tree.
  useEffect(() => {
    if (pathname.includes("/projects")) setProjectsExpanded(true);
  }, [pathname]);

  useEffect(() => {
    if (!projectsExpanded || !workspaceIdForNav) return;

    let cancelled = false;
    setProjectsLoading(true);
    fetchProjects(workspaceIdForNav)
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-fetch on navigation so newly created projects show up without a reload.
  }, [projectsExpanded, workspaceIdForNav, pathname]);

  const userInitials =
    currentUser?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const sections: NavSectionDef[] = [
    {
      label: "Workspace",
      items: [
        {
          name: "Dashboard",
          href: `${workspaceBase}/dashboard`,
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Work",
      items: [
        {
          name: "My Tasks",
          href: `${workspaceBase}/my-tasks`,
          icon: CheckSquare,
        },
        {
          name: "Notifications",
          href: `${workspaceBase}/notifications`,
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
      ],
    },
    {
      label: "Manage",
      items: [
        {
          name: "Projects",
          href: `${workspaceBase}/projects`,
          icon: FolderKanban,
        },
        {
          name: "Team",
          href: `${workspaceBase}/team`,
          icon: Users,
        },
        {
          name: "Reports",
          href: `${workspaceBase}/reports`,
          icon: BarChart2,
        },
        {
          name: "Settings",
          href: `${workspaceBase}/settings`,
          icon: Settings,
        },
      ],
    },
  ];

  const isItemActive = (item: NavItemDef) => {
    if (item.name === "Dashboard") return pathname === item.href;
    if (item.name === "Projects") return pathname.startsWith(item.href);
    return pathname === item.href;
  };

  const NavItem = ({ item }: { item: NavItemDef }) => {
    const active = isItemActive(item);

    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[13px] font-medium relative ${
          active ? "text-fg bg-hover-strong" : "text-muted2 hover:text-fg hover:bg-hover"
        } ${isCollapsed ? "justify-center px-0" : ""}`}
        title={isCollapsed ? item.name : undefined}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
        )}
        <item.icon
          className={`w-[17px] h-[17px] shrink-0 transition-colors duration-200 ${
            active ? "text-accent" : "text-muted group-hover:text-muted2"
          }`}
        />
        {!isCollapsed && <span className="flex-1 truncate relative z-10">{item.name}</span>}
        {!isCollapsed && typeof item.badge === "number" && item.badge > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-soft text-accent text-[10px] font-bold px-1">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const activeProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1] ?? "";

  const ProjectsNavItem = ({ item }: { item: NavItemDef }) => {
    const active = isItemActive(item);

    // When collapsed there's no room for an inline tree, so fall back to the plain link.
    if (isCollapsed) {
      return <NavItem item={item} />;
    }

    return (
      <div>
        <div
          className={`group flex items-center rounded-lg transition-all duration-200 relative ${
            active ? "text-fg bg-hover-strong" : "text-muted2 hover:text-fg hover:bg-hover"
          }`}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
          )}
          <Link
            href={item.href}
            className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2 text-[13px] font-medium"
          >
            <item.icon
              className={`w-[17px] h-[17px] shrink-0 transition-colors duration-200 ${
                active ? "text-accent" : "text-muted group-hover:text-muted2"
              }`}
            />
            <span className="flex-1 truncate">{item.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => setProjectsExpanded((v) => !v)}
            aria-label={projectsExpanded ? "Collapse projects" : "Expand projects"}
            aria-expanded={projectsExpanded}
            className="p-1.5 mr-1.5 rounded-md text-muted hover:text-fg hover:bg-hover-strong transition-colors shrink-0"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                projectsExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {projectsExpanded && (
          <div className="mt-1 ml-[22px] pl-2.5 border-l border-border space-y-0.5">
            {projectsLoading && projects.length === 0 ? (
              <div className="px-2 py-1.5 text-[12px] text-muted">Loading projects…</div>
            ) : projects.length === 0 ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] text-muted hover:text-muted2 hover:bg-hover transition-colors"
              >
                <Plus className="w-3 h-3" />
                Create a project
              </Link>
            ) : (
              projects.map((p) => {
                const isActiveProject = activeProjectId === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`${workspaceBase}/projects/${p.id}/board`}
                    title={p.name}
                    className={`group/proj flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                      isActiveProject
                        ? "text-fg bg-hover-strong"
                        : "text-muted2 hover:text-fg hover:bg-hover"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 rounded-[5px] flex items-center justify-center text-[9px] font-bold tracking-tight transition-colors ${
                        isActiveProject
                          ? "bg-accent-soft text-accent"
                          : "bg-hover-strong text-muted2 group-hover/proj:text-fg"
                      }`}
                    >
                      {projectKeyPrefix(p.name).slice(0, 2)}
                    </span>
                    <span className="flex-1 truncate">{p.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const SectionLabel = ({ label, dot }: { label: string; dot?: string }) => {
    if (isCollapsed) {
      return <div className="mx-auto w-5 h-px bg-border-strong my-2" />;
    }
    return (
      <div className="px-3 mb-2 mt-1 text-[10px] font-semibold text-muted uppercase tracking-[0.12em] flex items-center gap-2">
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

  return (
    <aside
      className={`relative flex flex-col h-full bg-sidebar backdrop-blur-2xl text-fg border-r border-border shadow-sidebar transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] z-40 ${
        isCollapsed ? "w-[68px]" : "w-[252px]"
      }`}
    >
      <OrgWorkspaceSwitcher isCollapsed={isCollapsed} />

      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 px-3 space-y-5">
        {sections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            <SectionLabel label={section.label} dot={section.dot} />
            {section.items.map((item) =>
              item.name === "Projects" ? (
                <ProjectsNavItem key={item.name} item={item} />
              ) : (
                <NavItem key={item.name} item={item} />
              )
            )}
          </div>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-surface-2 border border-border shadow-md flex items-center justify-center text-muted2 hover:text-fg hover:border-accent/40 transition-all duration-200 z-50 hover:scale-110"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      <div className="px-4 py-3 border-t border-border">
        <Link
          href="/profile"
          title="Open profile"
          aria-label={`Open profile (${currentUser?.email ?? "current account"})`}
          className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors hover:bg-hover ${
            pathname === "/profile" ? "bg-hover-strong" : ""
          } ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-bold text-muted2 shrink-0 overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              userInitials
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="text-[13px] font-semibold truncate text-fg">
                {currentUser?.name ?? "User"}
              </div>
              <div className="text-[11px] text-muted truncate">
                {currentUser?.email ?? "No email"}
              </div>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
