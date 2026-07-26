"use client";

import { usePathname, useRouter } from "next/navigation";
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
  Bell,
} from "lucide-react";
import { useEffect, useState } from "react";
import OrgWorkspaceSwitcher from "./org-workspace-switcher";

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
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const { workspaceIdForNav } = useWorkspaceNav();

  // AUD-059: this row was styled as clickable (pointer cursor, hover state) but had no
  // handler at all. It now performs the same sign-out action as the topbar's logout
  // button, rather than inventing a new destination page under this fix.
  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/signin");
  };

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
          user?: { name?: string | null; email?: string | null } | null;
        };
        const name = data.user?.name?.trim();
        const email = data.user?.email?.trim();

        if (!cancelled && name && email) {
          setCurrentUser({ name, email });
        } else if (!cancelled) {
          setCurrentUser(null);
        }
      } catch {
        if (!cancelled) setCurrentUser(null);
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

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
        {!isCollapsed && typeof item.badge === "number" && item.badge > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-bold px-1">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

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

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#111118]/60 backdrop-blur-2xl text-[#f0f0f5] border-r border-[#333339] shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] z-40 ${
        isCollapsed ? "w-[68px]" : "w-[252px]"
      }`}
    >
      <OrgWorkspaceSwitcher isCollapsed={isCollapsed} />

      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 px-3 space-y-5">
        {sections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            <SectionLabel label={section.label} dot={section.dot} />
            {section.items.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        ))}
      </nav>

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

      <div className="px-4 py-3 border-t border-[#333339]">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          title="Sign out"
          aria-label={`Sign out (${currentUser?.email ?? "current account"})`}
          className={`w-full flex items-center gap-3 cursor-pointer hover:bg-white/[0.04] p-2 rounded-xl transition-colors text-left ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface2)] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-[var(--color-muted2)] shrink-0">
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-semibold truncate text-[#f0f0f5]">
                {currentUser?.name ?? "User"}
              </div>
              <div className="text-[11px] text-[#6b6b80] truncate">
                {currentUser?.email ?? "No email"}
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
