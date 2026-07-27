"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  MessageSquare,
  ClipboardList,
  Activity,
  CalendarDays,
  Clock3,
  Sparkles,
  Inbox,
  ShieldCheck,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { NotificationListSkeleton, Skeleton } from "@/components/ui/skeleton";

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

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type NotificationListResponse = {
  items: NotificationItem[];
  pagination: PaginationMeta;
  unreadCount: number;
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

function parsePayload(payload: string | null): Record<string, unknown> | null {
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function resolveNotificationHref(notification: NotificationItem, workspaceId: string) {
  if (notification.redirectUrl) return notification.redirectUrl;
  const payload = parsePayload(notification.payload);
  const payloadProjectId =
    payload && typeof payload.projectId === "string" ? payload.projectId : null;
  const payloadCommentId =
    payload && typeof payload.commentId === "string" ? payload.commentId : null;

  if (
    notification.targetType === "task" &&
    payloadProjectId &&
    typeof notification.targetId === "string" &&
    notification.targetId
  ) {
    const params = new URLSearchParams({ ticketId: notification.targetId });
    if (payloadCommentId) params.set("commentId", payloadCommentId);
    return `/workspace/${workspaceId}/projects/${payloadProjectId}/backlog?${params.toString()}`;
  }

  if (notification.type === "sprint_update" || notification.targetType === "sprint") {
    return `/workspace/${workspaceId}/sprints`;
  }
  if (notification.type === "project_update" || notification.targetType === "project") {
    return payloadProjectId
      ? `/workspace/${workspaceId}/projects/${payloadProjectId}/backlog`
      : `/workspace/${workspaceId}/projects`;
  }
  if (notification.type === "invite") {
    return `/workspace/${workspaceId}/team`;
  }
  if (
    notification.type === "task_assignment" ||
    notification.type === "task_status" ||
    notification.type === "task_comment" ||
    notification.type === "mention"
  ) {
    return `/workspace/${workspaceId}/my-tasks`;
  }
  return `/workspace/${workspaceId}/dashboard`;
}

type FilterMode = "all" | "unread";
const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [pendingReadIds, setPendingReadIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const params = useParams();
  const workspaceId = Array.isArray(params?.workspaceId)
    ? params.workspaceId[0]
    : (params?.workspaceId ?? "");

  const loadNotifications = useCallback(
    async (page: number, mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/notifications?page=${page}&limit=${PAGE_SIZE}`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body?.error || "Unable to load notifications");
        }

        const data = (await res.json()) as NotificationListResponse;
        setNotifications(data.items);
        setPaginationMeta(data.pagination);
        setGlobalUnreadCount(data.unreadCount);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (mode === "initial") {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    if (!workspaceId) return;
    void loadNotifications(currentPage, "initial");
  }, [workspaceId, currentPage, loadNotifications]);

  useEffect(() => {
    setCurrentPage(1);
  }, [workspaceId]);

  const unreadCount = globalUnreadCount;
  const readCount = Math.max(0, paginationMeta.total - unreadCount);

  const summary = useMemo(() => {
    const counts = notifications.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterMode === "unread") {
      return notifications.filter((item) => !item.isRead);
    }
    return notifications;
  }, [notifications, filterMode]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setPendingReadIds((prev) => ({ ...prev, [notificationId]: true }));
    let previousNotifications: NotificationItem[] = [];
    let didChangeUnread = false;
    setNotifications((prev) => {
      previousNotifications = prev;
      return prev.map((item) => {
        if (item.id !== notificationId) return item;
        if (!item.isRead) {
          didChangeUnread = true;
        }
        return { ...item, isRead: true };
      });
    });
    if (didChangeUnread) {
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Unable to mark notification as read");
      }
    } catch (err) {
      setNotifications(previousNotifications);
      if (didChangeUnread) {
        setGlobalUnreadCount((prev) => prev + 1);
      }
      setError((err as Error).message);
    } finally {
      setPendingReadIds((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0 || markingAllRead) return;

    setMarkingAllRead(true);
    let previousNotifications: NotificationItem[] = [];
    const previousUnreadCount = unreadCount;
    setNotifications((prev) => {
      previousNotifications = prev;
      return prev.map((item) => ({ ...item, isRead: true }));
    });
    setGlobalUnreadCount(0);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Unable to mark all notifications as read");
      }
    } catch (err) {
      setNotifications(previousNotifications);
      setGlobalUnreadCount(previousUnreadCount);
      setError((err as Error).message);
    } finally {
      setMarkingAllRead(false);
    }
  }, [unreadCount, markingAllRead]);

  return (
    <div className="flex h-full flex-col bg-surface-sunken">
      <div className="sticky top-0 z-10 border-b border-border bg-surface-sunken/50 px-10 py-8 backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Notifications</h1>
              <p className="mt-1 text-[13px] text-muted">
                Mentions, task updates, sprint changes, and invites across your workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                filterMode === "all"
                  ? "bg-hover-strong text-fg"
                  : "bg-hover text-muted hover:bg-hover hover:text-muted2"
              }`}
            >
              All ({paginationMeta.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("unread")}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                filterMode === "unread"
                  ? "bg-accent/15 text-accent"
                  : "bg-hover text-muted hover:bg-hover hover:text-muted2"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => void loadNotifications(currentPage, "refresh")}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-hover px-3.5 py-2 text-[13px] font-medium text-muted2 transition hover:bg-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={loading || unreadCount === 0 || markingAllRead}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-2 text-[13px] font-medium text-accent transition hover:bg-accent/15 hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className={`h-3.5 w-3.5 ${markingAllRead ? "animate-pulse" : ""}`} />
              {markingAllRead ? "Marking..." : "Mark all as read"}
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-10 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[11px] uppercase tracking-[0.13em] text-muted">Unread</p>
                {loading ? (
                  <Skeleton className="mt-3 h-8 w-14 rounded-md" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold text-fg">{unreadCount}</p>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[11px] uppercase tracking-[0.13em] text-muted">Read</p>
                {loading ? (
                  <Skeleton className="mt-3 h-8 w-14 rounded-md" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold text-fg">{readCount}</p>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[11px] uppercase tracking-[0.13em] text-muted">Total</p>
                {loading ? (
                  <Skeleton className="mt-3 h-8 w-14 rounded-md" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold text-fg">{paginationMeta.total}</p>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[11px] uppercase tracking-[0.13em] text-muted">Categories</p>
                {loading ? (
                  <Skeleton className="mt-3 h-8 w-14 rounded-md" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold text-fg">{summary.length}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-fg">
                    {filterMode === "unread" ? "Unread notifications" : "Latest notifications"}
                  </p>
                  <p className="text-xs text-muted">
                    {filterMode === "unread"
                      ? "Items that still need your attention."
                      : "Ordered by newest updates first."}
                  </p>
                </div>
                <span className="rounded-md bg-hover px-2 py-1 text-[11px] text-muted2">
                  {filteredNotifications.length} items
                </span>
              </div>

              <div className="p-5">
                {loading ? (
                  <NotificationListSkeleton rows={6} />
                ) : error ? (
                  <div className="rounded-xl border border-danger/20 bg-danger/8 p-5 text-sm text-danger">
                    {error}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-hover bg-hover p-10 text-center">
                    <p className="text-sm font-medium text-muted2">
                      {filterMode === "unread" ? "No unread notifications" : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {filterMode === "unread"
                        ? "You are all caught up."
                        : "New mentions and updates will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                      const Icon = typeIconMap[notification.type] || Activity;
                      const detailHref = resolveNotificationHref(notification, workspaceId);
                      return (
                        <article
                          key={notification.id}
                          className={`rounded-xl border px-4 py-4 transition ${
                            notification.isRead
                              ? "border-border bg-hover hover:bg-hover"
                              : "border-accent/30 bg-accent/[0.06] hover:bg-accent/[0.09]"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-hover text-accent">
                                <Icon className="h-4.5 w-4.5" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-fg">
                                  {notification.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                                  <span>{getTypeLabel(notification.type)}</span>
                                  <span className="h-1 w-1 rounded-full bg-muted" />
                                  <span>{formatDate(notification.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            {!notification.isRead && (
                              <span className="inline-flex rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                                New
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-2xl text-sm leading-6 text-muted2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3">
                              {!notification.isRead && (
                                <button
                                  type="button"
                                  onClick={() => void markNotificationAsRead(notification.id)}
                                  disabled={Boolean(pendingReadIds[notification.id])}
                                  className="text-xs font-semibold text-accent transition hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {pendingReadIds[notification.id] ? "Marking..." : "Mark as read"}
                                </button>
                              )}
                              {detailHref ? (
                                <Link
                                  href={detailHref}
                                  className="text-sm font-semibold text-[var(--color-accent)] transition hover:text-accent-strong"
                                >
                                  Open details
                                </Link>
                              ) : (
                                <span className="text-sm text-muted">No link</span>
                              )}
                              <span className="rounded-md bg-hover px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted2">
                                {notification.targetType || "general"}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
              {!loading && paginationMeta.total > 0 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                  <p className="text-xs text-muted">
                    Page {paginationMeta.page} of {paginationMeta.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={!paginationMeta.hasPreviousPage}
                      className="rounded-lg border border-border bg-hover px-3 py-1.5 text-xs text-muted2 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => (paginationMeta.hasNextPage ? prev + 1 : prev))
                      }
                      disabled={!paginationMeta.hasNextPage}
                      className="rounded-lg border border-border bg-hover px-3 py-1.5 text-xs text-muted2 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3 text-fg">
                <CheckCircle2 className="h-5 w-5 text-[var(--color-accent)]" />
                <div>
                  <p className="font-semibold">Notification overview</p>
                  <p className="text-xs text-muted">Counts by notification type.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {loading ? (
                  <>
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                  </>
                ) : summary.length === 0 ? (
                  <p className="rounded-lg border border-border bg-hover px-3 py-4 text-xs text-muted">
                    No categories available yet.
                  </p>
                ) : (
                  summary.map(([key, count]) => {
                    const Icon = typeIconMap[key] || Activity;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border bg-hover px-3 py-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-hover text-[var(--color-accent)]">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm text-muted2">{getTypeLabel(key)}</span>
                        </div>
                        <span className="text-sm font-semibold text-fg">{count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
