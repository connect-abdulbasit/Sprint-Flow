"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Paperclip, Trash2 } from "lucide-react";
import type { TicketAttachment } from "@/lib/projects-api";

export default function AttachmentsPanel({
  fetchAttachments,
  createAttachment,
  deleteAttachment,
  canDelete,
  refreshKey,
}: {
  fetchAttachments: () => Promise<TicketAttachment[]>;
  createAttachment: (_url: string, _label: string | null) => Promise<TicketAttachment>;
  deleteAttachment: (_attachmentId: string) => Promise<void>;
  canDelete: (_attachment: TicketAttachment) => boolean;
  refreshKey?: unknown;
}) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAttachments()
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const handleAdd = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAttachment(trimmedUrl, label.trim() || null);
      setUrl("");
      setLabel("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add attachment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteAttachment(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete attachment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-[13px] text-muted">Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <p className="text-[13px] text-muted">No attachments yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted" />
              <a
                href={a.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-[13px] text-accent hover:underline"
              >
                {a.label || a.fileUrl}
              </a>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted" />
              {canDelete(a) && (
                <button
                  type="button"
                  onClick={() => void handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="shrink-0 rounded p-1 text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                  aria-label="Remove attachment"
                >
                  {deletingId === a.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-[12px] text-danger">{error}</p>}

      <div className="flex flex-col gap-1.5 sm:flex-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="min-w-0 flex-1 rounded-md border border-border-hover bg-surface-2/90 px-2.5 py-1.5 text-[13px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="min-w-0 flex-[2] rounded-md border border-border-hover bg-surface-2/90 px-2.5 py-1.5 text-[13px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <button
          type="button"
          disabled={!url.trim() || submitting}
          onClick={() => void handleAdd()}
          className="shrink-0 rounded-md bg-hover px-3 py-1.5 text-[12px] font-medium text-muted2 hover:bg-hover-strong disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add link"}
        </button>
      </div>
    </div>
  );
}
