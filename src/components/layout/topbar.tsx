"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./theme-toggle";

function getWorkspaceId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const workspaceIndex = segments.indexOf("workspace");
  if (workspaceIndex === -1) return null;
  return segments[workspaceIndex + 1] ?? null;
}

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
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

        const data = (await res.json()) as
          | Array<{ isRead: boolean }>
          | { unreadCount?: number; items?: Array<{ isRead: boolean }> };
        if (!cancelled) {
          if (Array.isArray(data)) {
            setHasUnreadNotifications(data.some((item) => !item.isRead));
          } else if (typeof data.unreadCount === "number") {
            setHasUnreadNotifications(data.unreadCount > 0);
          } else {
            setHasUnreadNotifications((data.items ?? []).some((item) => !item.isRead));
          }
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
    <header className="h-14 flex items-center justify-end px-8 bg-transparent z-30">
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          onClick={handleNotificationsClick}
          className="cursor-pointer p-2 text-muted hover:text-fg bg-surface/25 hover:bg-surface/65 border border-border rounded-xl transition-all duration-300 relative"
          title="Notifications"
          aria-label="Open notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {hasUnreadNotifications && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full shadow-[0_0_8px_var(--color-danger)]"></span>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="cursor-pointer p-2 text-muted hover:text-danger bg-surface/25 hover:bg-surface/65 border border-border rounded-xl transition-all duration-300"
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
