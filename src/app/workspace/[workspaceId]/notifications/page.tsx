"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  ClipboardList,
  Activity,
  CalendarDays,
  ArrowRight,
  Clock3,
  Sparkles,
  Inbox,
  ShieldCheck,
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetType: string;
  targetId: string | null;
  redirectUrl: string | null;
  isRead: boolean;
  createdAt: string;
  originUserId: string | null;
  payload: string | null;
};

type IconComponent = ComponentType<{ className?: string }>;

const typeIconMap: Record<string, IconComponent> = {
  mention: MessageSquare,
  task_assignment: ClipboardList,
  task_comment: MessageSquare,
  task_status: Activity,
  sprint_update: CalendarDays,
  project_update: Sparkles,
  invite: Inbox,
  activity: Activity,
  reminder: Clock3,
  general: ShieldCheck,
};

function getTypeLabel(type: string) {
  return (
    (
      {
        mention: "Mention",
        task_assignment: "Task assigned",
        task_comment: "Comment",
        task_status: "Status update",
        sprint_update: "Sprint update",
        project_update: "Project update",
        invite: "Invite",
        activity: "Activity",
        reminder: "Reminder",
        general: "General",
      } as Record<string, string>
    )[type] ?? "Update"
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const workspaceId = params?.workspaceId ?? "";

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body?.error || "Unable to load notifications");
        }

        const data = (await res.json()) as NotificationItem[];
        setNotifications(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const summary = useMemo(() => {
    const counts = notifications.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return counts;
  }, [notifications]);

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="max-w-2xl text-sm text-[var(--color-muted)]">
            Stay on top of task updates, mentions, sprint changes, and invites across the workspace.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-[#2a2a38] bg-[#111118]/70 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7c7c92]">Unread</p>
            <p className="mt-3 text-3xl font-semibold text-white">{unreadCount}</p>
          </div>
          <div className="rounded-3xl border border-[#2a2a38] bg-[#111118]/70 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7c7c92]">Total</p>
            <p className="mt-3 text-3xl font-semibold text-white">{notifications.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-[32px] border border-[#2a2a38] bg-[#12121d]/80 p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between gap-4 pb-3 mb-5 border-b border-[#2b2b39]">
            <div>
              <p className="text-sm font-semibold text-white">Latest updates</p>
              <p className="text-[13px] text-[var(--color-muted)]">
                Your notification stream from every project and sprint.
              </p>
            </div>
            <Link
              href={`/workspace/${workspaceId}/notifications`}
              className="inline-flex items-center gap-2 rounded-full border border-[#2b2b39] bg-white/5 px-3 py-2 text-xs text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Refresh
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-[#3a3a4e] bg-[#141423]/80 p-8 text-center text-sm text-[var(--color-muted)]">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-200">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#3a3a4e] bg-[#141423]/80 p-12 text-center text-sm text-[var(--color-muted)]">
              No notifications yet. Check back when there are new mentions, tasks, or sprint
              updates.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const Icon = typeIconMap[notification.type] || Activity;
                return (
                  <article
                    key={notification.id}
                    className={`rounded-3xl border px-5 py-4 transition-all duration-200 ${
                      notification.isRead
                        ? "border-[#2b2b39] bg-[#111118]/80"
                        : "border-[var(--color-accent)]/20 bg-[rgba(79,124,255,0.08)]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[var(--color-accent)] shadow-[0_12px_24px_-20px_rgba(79,124,255,0.9)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{notification.title}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            {getTypeLabel(notification.type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <span>{formatDate(notification.createdAt)}</span>
                        {!notification.isRead && (
                          <span className="inline-flex rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-2xl text-sm leading-6 text-[#d7d7e3]">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3">
                        {notification.redirectUrl ? (
                          <Link
                            href={notification.redirectUrl}
                            className="text-sm font-semibold text-[var(--color-accent)] transition hover:text-white"
                          >
                            Open details
                          </Link>
                        ) : (
                          <span className="text-sm text-[var(--color-muted)]">No direct link</span>
                        )}
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[#7c7c92]">
                          {notification.targetType || "general"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-[#2a2a38] bg-[#12121d]/80 p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-accent)]" />
              <div>
                <p className="font-semibold">Notification overview</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Quick counts by type and redirect targets.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {Object.entries(summary).map(([key, count]) => {
                const Icon = typeIconMap[key] || Activity;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-3xl border border-[#2e2e40] bg-[#111118]/75 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-[var(--color-accent)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{getTypeLabel(key)}</p>
                        <p className="text-xs text-[var(--color-muted)]">Notifications</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-[#2a2a38] bg-[#12121d]/80 p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-3 text-white">
              <Inbox className="h-5 w-5 text-[var(--color-accent)]" />
              <div>
                <p className="font-semibold">How it works</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Mentions and updates take you to the exact task, comment, or sprint page.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                Mention notifications link to the comment or task where you were tagged.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                Task assignment and status updates send you to the relevant task detail.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                Sprint and project changes surface the latest activity in that context.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
