"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface CommentRow {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  canDelete?: boolean;
}

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

/** Comment thread for any entity — parameterized by workspace/entity so the
 * same component serves epics and issues via the workspace-scoped comments
 * API (raw fetch, matching how the ticket detail drawer already talks to
 * this endpoint rather than going through projects-api.ts). */
export default function CommentsPanel({
  workspaceId,
  entityType,
  entityId,
}: {
  workspaceId: string;
  entityType: "task" | "epic";
  entityId: string;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const basePath =
    entityType === "epic"
      ? `/api/workspaces/${workspaceId}/epics/${entityId}/comments`
      : `/api/workspaces/${workspaceId}/tasks/${entityId}/comments`;

  const load = () => {
    setLoading(true);
    fetch(basePath)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : (data.items ?? [])))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [basePath]);

  const handleAdd = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to add comment" }));
        throw new Error(body.error ?? "Failed to add comment");
      }
      setNewComment("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await fetch(`${basePath}/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-[13px] text-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-[13px] text-muted">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-fg">{c.userName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted">
                    {formatRelativeTime(new Date(c.createdAt))}
                  </span>
                  {c.canDelete && (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(c.id)}
                      className="rounded p-0.5 text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted2">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-[12px] text-danger">{error}</p>}

      <div className="flex items-start gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          placeholder="Add a comment…"
          className="min-w-0 flex-1 resize-none rounded-md border border-border-hover bg-surface-2/90 px-2.5 py-1.5 text-[13px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <button
          type="button"
          disabled={!newComment.trim() || submitting}
          onClick={() => void handleAdd()}
          className="shrink-0 rounded-md bg-hover px-3 py-1.5 text-[12px] font-medium text-muted2 hover:bg-hover-strong disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Comment"}
        </button>
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void executeDelete()}
      />
    </div>
  );
}
