"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  notifications: "Notifications",
  projects: "Projects",
  team: "Team",
  reports: "Reports",
  settings: "Settings",
  sprints: "Sprints",
  board: "Board",
  backlog: "Backlog",
  "my-tasks": "My Tasks",
};

function getPageTitle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const workspaceIndex = segments.indexOf("workspace");
  const pageKey = segments[workspaceIndex + 2] ?? segments[workspaceIndex + 1];

  if (!pageKey) return "Workspace";
  return (
    pageTitles[pageKey] ?? pageKey.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getWorkspaceId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const workspaceIndex = segments.indexOf("workspace");
  if (workspaceIndex === -1) return null;
  return segments[workspaceIndex + 1] ?? null;
}

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const title = pathname ? getPageTitle(pathname) : "Workspace";
  const workspaceId = pathname ? getWorkspaceId(pathname) : null;
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadState() {
      if (!workspaceId) {
        setHasUnreadNotifications(false);
        return;
      }

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setHasUnreadNotifications(false);
          return;
        }

        const data = (await res.json()) as Array<{ isRead: boolean }>;
        if (!cancelled) {
          setHasUnreadNotifications(data.some((item) => !item.isRead));
        }
      } catch {
        if (!cancelled) setHasUnreadNotifications(false);
      }
    }

    void loadUnreadState();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/signin");
  };

  const handleNotificationsClick = () => {
    if (!workspaceId) return;
    router.push(`/workspace/${workspaceId}/notifications`);
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-transparent z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={handleNotificationsClick}
          className="cursor-pointer p-2.5 text-[#6b6b80] hover:text-[#f0f0f5] bg-[#111118]/40 hover:bg-[#111118]/80 border border-white/[0.05] rounded-xl transition-all duration-300 relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
          title="Notifications"
          aria-label="Open notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {hasUnreadNotifications && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ff4f7c] rounded-full shadow-[0_0_8px_#ff4f7c]"></span>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="cursor-pointer p-2.5 text-[#6b6b80] hover:text-[#ff4f7c] bg-[#111118]/40 hover:bg-[#111118]/80 border border-white/[0.05] rounded-xl transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
