"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  createTicket,
  deleteTicket,
  updateTicket,
  type ProjectMember,
  type ProjectTicket,
  type TicketType,
} from "@/lib/projects-api";

const TYPES: TicketType[] = ["task", "bug", "feature", "improvement"];
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = ["todo", "in_progress", "review", "done"] as const;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

export interface TicketFormModalProps {
  projectId: string;
  members: ProjectMember[];
  mode: "create" | "edit";
  ticket: ProjectTicket | null;
  /** When creating from a board column, pre-select status */
  initialStatus?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (ticket: ProjectTicket) => void;
  onDeleted?: (ticketId: string) => void;
}

export default function TicketFormModal({
  projectId,
  members,
  mode,
  ticket,
  initialStatus = "todo",
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: TicketFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("task");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [storyPoints, setStoryPoints] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setImageFile(null);
    setClearImage(false);
    if (mode === "edit" && ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description ?? "");
      setType(ticket.type);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setAssigneeId(ticket.assigneeId ?? "");
      setStoryPoints(
        ticket.storyPoints !== null && ticket.storyPoints !== undefined
          ? String(ticket.storyPoints)
          : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setType("task");
      setPriority("medium");
      setStatus(initialStatus);
      setAssigneeId("");
      setStoryPoints("");
    }
  }, [isOpen, mode, ticket, initialStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let imageBase64: string | null | undefined = undefined;
      let imageMimeType: string | null | undefined = undefined;
      if (imageFile) {
        const dataUrl = await readFileAsDataUrl(imageFile);
        imageBase64 = dataUrl;
        imageMimeType = imageFile.type || undefined;
      } else if (mode === "edit" && clearImage) {
        imageBase64 = null;
        imageMimeType = null;
      }

      const pointsRaw = storyPoints.trim();
      const storyPointsVal =
        pointsRaw === "" ? null : Number.isFinite(Number(pointsRaw)) ? Number(pointsRaw) : null;

      const assigneePayload = assigneeId === "" ? null : assigneeId;

      if (mode === "create") {
        const created = await createTicket(projectId, {
          title: trimmed,
          description: description.trim() || null,
          type,
          priority,
          status,
          assigneeId: assigneePayload,
          storyPoints: storyPointsVal,
          ...(imageBase64 !== undefined ? { imageBase64, imageMimeType } : {}),
        });
        onSaved(created);
      } else if (ticket) {
        const updated = await updateTicket(projectId, ticket.id, {
          title: trimmed,
          description: description.trim() || null,
          type,
          priority,
          status,
          assigneeId: assigneePayload,
          storyPoints: storyPointsVal,
          ...(imageBase64 !== undefined ? { imageBase64, imageMimeType } : {}),
        });
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket || !onDeleted) return;
    if (!window.confirm(`Delete ticket ${ticket.key}? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteTicket(projectId, ticket.id);
      onDeleted(ticket.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#111115] shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-form-title"
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 id="ticket-form-title" className="text-[15px] font-semibold text-zinc-100">
              {mode === "create" ? "New ticket" : "Edit ticket"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-500">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                placeholder="Short summary"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                placeholder="Details, acceptance criteria…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TicketType)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                Story points
              </label>
              <input
                type="number"
                min={0}
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                Cover image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setClearImage(false);
                  setImageFile(e.target.files?.[0] ?? null);
                }}
                className="w-full text-[12px] text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-[12px] file:text-zinc-200"
              />
              {mode === "edit" && ticket?.hasImage && (
                <label className="mt-2 flex items-center gap-2 text-[12px] text-zinc-500">
                  <input
                    type="checkbox"
                    checked={clearImage}
                    onChange={(e) => {
                      setClearImage(e.target.checked);
                      if (e.target.checked) setImageFile(null);
                    }}
                  />
                  Remove current image
                </label>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
            <div>
              {mode === "edit" && ticket && onDeleted && (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting || submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-300 hover:bg-red-500/15 disabled:opacity-40"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || deleting}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:bg-white/[0.05] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-[13px] font-semibold text-zinc-950 disabled:opacity-40"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {mode === "create" ? "Create ticket" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
