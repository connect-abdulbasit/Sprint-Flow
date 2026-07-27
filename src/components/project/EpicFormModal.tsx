"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  createEpic,
  deleteEpic,
  updateEpic,
  type Epic,
  type ProjectMember,
} from "@/lib/projects-api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITIES } from "@/lib/ticket-priority";
import {
  EPIC_STATUSES,
  EPIC_STATUS_LABELS,
  EPIC_COLORS,
  EPIC_COLOR_DOT_CLASS,
  EPIC_ICONS,
  EPIC_ICON_COMPONENT,
  type EpicStatus,
  type EpicColor,
  type EpicIcon,
} from "@/lib/epic-style";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface EpicFormModalProps {
  projectId: string;
  members: ProjectMember[];
  mode: "create" | "edit";
  epic: Epic | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (_epic: Epic) => void;
  onDeleted?: (_epicId: string) => void;
}

export default function EpicFormModal({
  projectId,
  members,
  mode,
  epic,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: EpicFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EpicStatus>("backlog");
  const [priority, setPriority] = useState("medium");
  const [ownerId, setOwnerId] = useState("");
  const [color, setColor] = useState<EpicColor | "">("");
  const [icon, setIcon] = useState<EpicIcon | "">("");
  const [labelsInput, setLabelsInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
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
    if (mode === "edit" && epic) {
      setName(epic.name);
      setDescription(epic.description ?? "");
      setStatus(epic.status);
      setPriority(epic.priority);
      setOwnerId(epic.ownerId ?? "");
      setColor((epic.color as EpicColor) ?? "");
      setIcon((epic.icon as EpicIcon) ?? "");
      setLabelsInput((epic.labels ?? []).join(", "));
      setStartDate(epic.startDate ?? "");
      setDueDate(epic.dueDate ?? "");
    } else {
      setName("");
      setDescription("");
      setStatus("backlog");
      setPriority("medium");
      setOwnerId("");
      setColor("");
      setIcon("");
      setLabelsInput("");
      setStartDate("");
      setDueDate("");
    }
  }, [isOpen, mode, epic]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !deleting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, deleting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const labels = labelsInput
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const payload = {
        name: trimmed,
        description: description.trim() || null,
        status,
        priority,
        ownerId: ownerId === "" ? null : ownerId,
        color: color === "" ? null : color,
        icon: icon === "" ? null : icon,
        labels,
        startDate: startDate === "" ? null : startDate,
        dueDate: dueDate === "" ? null : dueDate,
      };
      if (mode === "create") {
        const created = await createEpic(projectId, payload);
        onSaved(created);
      } else if (epic) {
        const updated = await updateEpic(projectId, epic.id, payload);
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
    if (!epic || !onDeleted) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEpic(projectId, epic.id);
      onDeleted(epic.id);
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
          aria-labelledby="epic-form-title"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 id="epic-form-title" className="text-[15px] font-semibold text-fg">
                {mode === "create" ? "New epic" : "Edit epic"}
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
                <label className="mb-1 block text-[11px] font-medium text-muted">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[14px] text-fg focus:border-accent/40 focus:outline-none"
                  placeholder="e.g. User Authentication"
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
                  placeholder="Goals, scope, context…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EpicStatus)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  >
                    {EPIC_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {EPIC_STATUS_LABELS[s]}
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

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Owner</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Color</label>
                <div className="flex flex-wrap gap-2">
                  {EPIC_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(color === c ? "" : c)}
                      aria-label={c}
                      className={`h-7 w-7 rounded-full ${EPIC_COLOR_DOT_CLASS[c]} ${color === c ? "ring-2 ring-offset-2 ring-offset-surface ring-fg" : "opacity-60 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EPIC_ICONS.map((i) => {
                    const IconComponent = EPIC_ICON_COMPONENT[i];
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(icon === i ? "" : i)}
                        aria-label={i}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${icon === i ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:bg-hover hover:text-muted2"}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted">Labels</label>
                <input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="frontend, q3-goal"
                  className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-[14px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div>
                {mode === "edit" && epic && onDeleted && (
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
                  {mode === "create" ? "Create epic" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        title={epic ? `Delete "${epic.name}"?` : "Delete epic?"}
        description="Issues and subtasks in this epic are kept — they just lose their epic link. This cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeDelete}
      />
    </>
  );
}
