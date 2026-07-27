"use client";

import { useEffect, useState } from "react";
import type { ActivityLogEntry } from "@/lib/projects-api";

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Reverse-chronological activity feed for any entity — parameterized by a
 * fetch function so the same component serves epics, issues, and subtasks
 * without branching on entity type internally. */
export default function ActivityPanel({
  fetchActivity,
  refreshKey,
}: {
  fetchActivity: () => Promise<ActivityLogEntry[]>;
  /** Bump this to force a refetch (e.g. after an edit). */
  refreshKey?: unknown;
}) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchActivity()
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return <p className="text-[13px] text-muted">Loading activity…</p>;
  }
  if (entries.length === 0) {
    return <p className="text-[13px] text-muted">No activity yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-2.5 text-[13px]">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" />
          <p className="leading-snug text-muted2">
            <span className="font-medium text-fg">{entry.userName ?? "Someone"}</span>{" "}
            {entry.action.replace(/_/g, " ")}{" "}
            <span className="text-muted">{formatRelativeTime(new Date(entry.createdAt))}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
