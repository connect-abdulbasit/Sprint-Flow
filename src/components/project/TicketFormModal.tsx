"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  createTicket,
  deleteTicket,
  updateTicket,
  type ProjectMember,
  type ProjectTicket,
  type TicketType,
} from "@/lib/projects-api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DEFAULT_STATUS_FORM_OPTIONS } from "@/lib/board-columns";
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITIES } from "@/lib/ticket-priority";
import { validateTicketImageFile } from "@/lib/ticket-image-upload";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const TYPES: TicketType[] = ["task", "bug", "feature", "improvement"];

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
  /** Open / planning sprints to assign on create (excludes completed). */
  sprintPickerSprints?: { id: string; name: string }[];
  /** Initial sprint when creating from a sprint section (null = backlog). */
  defaultSprintId?: string | null;
  /** When set (e.g. from project board), status dropdown uses these values/labels. */
  statusOptions?: { value: string; label: string }[];
  /** Tickets in this project to link as prerequisites when creating (optional). */
  linkableTickets?: ProjectTicket[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (_ticket: ProjectTicket) => void;
  onDeleted?: (_ticketId: string) => void;
}

export default function TicketFormModal({
  projectId,
  members,
  mode,
  ticket,
  initialStatus = "todo",
  sprintPickerSprints = [],
  defaultSprintId = null,
  statusOptions,
  linkableTickets = [],
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
  const [createSprintId, setCreateSprintId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [createDependsOnIds, setCreateDependsOnIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDeleteConfirmOpen(false);
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
      setCreateSprintId(defaultSprintId ?? null);
      setStoryPoints("");
      setCreateDependsOnIds([]);
    }
  }, [isOpen, mode, ticket, initialStatus, defaultSprintId]);

  // AUD-015 / AUD-056: this, the app's most-used modal, previously had no Escape-to-close
  // handler at all.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !deleting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, deleting, onClose]);

  const createLinkOptions = useMemo(
    () => [...linkableTickets].sort((a, b) => a.ticketNumber - b.ticketNumber),
    [linkableTickets]
  );

  const statusSelectOptions = useMemo(() => {
    const base = statusOptions?.length ? statusOptions : DEFAULT_STATUS_FORM_OPTIONS;
    if (mode === "edit" && ticket && !base.some((b) => b.value === ticket.status)) {
      return [...base, { value: ticket.status, label: ticket.status.replace(/_/g, " ") }];
    }
    return base;
  }, [statusOptions, mode, ticket]);

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
          sprintId: createSprintId,
          ...(createDependsOnIds.length > 0 ? { dependsOnTaskIds: createDependsOnIds } : {}),
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

  const executeDelete = async () => {
    if (!ticket || !onDeleted) return;
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
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
        onClick={() => !submitting && !deleting && onClose()}
      >
        <div
          ref={modalRef}
          className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-form-title"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 id="ticket-form-title" className="text-[15px] font-semibold text-fg">
                {mode === "create" ? "New ticket" : "Edit ticket"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-muted hover:text-muted2 hover:bg-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[12px] text-danger">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[14px] text-fg focus:border-accent/40 focus:outline-none"
                  placeholder="Short summary"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-hover px-3 py-2 text-[14px] text-fg focus:border-accent/40 focus:outline-none"
                  placeholder="Details, acceptance criteria…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TicketType)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {TICKET_PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  >
                    {statusSelectOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
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

              {mode === "create" && createLinkOptions.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">
                    Blocked by — complete these first
                  </label>
                  <p className="mb-2 text-[12px] text-muted">
                    Link tickets that must be done before work on this one can start.
                  </p>
                  <div className="custom-scrollbar max-h-[140px] space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                    {createLinkOptions.map((t) => (
                      <label
                        key={t.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-hover ${createDependsOnIds.includes(t.id) ? "bg-warning/5" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-border-strong"
                          checked={createDependsOnIds.includes(t.id)}
                          onChange={() => {
                            setCreateDependsOnIds((prev) =>
                              prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                            );
                          }}
                        />
                        <span className="min-w-0">
                          <span className="font-mono text-[11px] text-muted">{t.key}</span>
                          <span className="mt-0.5 block truncate text-[13px] text-fg">
                            {t.title}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">
                  Story points
                </label>
                <input
                  type="number"
                  min={0}
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[14px] text-fg focus:border-accent/40 focus:outline-none"
                  placeholder="Optional"
                />
              </div>

              {mode === "create" && sprintPickerSprints.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Sprint</label>
                  <select
                    value={createSprintId ?? ""}
                    onChange={(e) =>
                      setCreateSprintId(e.target.value === "" ? null : e.target.value)
                    }
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  >
                    <option value="">Backlog</option>
                    {sprintPickerSprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Cover image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file) {
                      const validationError = validateTicketImageFile(file);
                      if (validationError) {
                        setError(validationError);
                        e.target.value = "";
                        return;
                      }
                    }
                    setError(null);
                    setClearImage(false);
                    setImageFile(file);
                  }}
                  className="w-full text-[12px] text-muted2 file:mr-3 file:rounded-md file:border-0 file:bg-hover-strong file:px-3 file:py-1.5 file:text-[12px] file:text-fg"
                />
                {mode === "edit" && ticket?.hasImage && (
                  <label className="mt-2 flex items-center gap-2 text-[12px] text-muted">
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

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div>
                {mode === "edit" && ticket && onDeleted && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={deleting || submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[12px] font-medium text-danger hover:bg-danger/15 disabled:opacity-40"
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
                  className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted2 hover:bg-hover disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || deleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg disabled:opacity-40"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {mode === "create" ? "Create ticket" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        title={ticket ? `Delete ${ticket.key}?` : "Delete ticket?"}
        description="This cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeDelete}
      />
    </>
  );
}
