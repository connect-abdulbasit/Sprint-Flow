"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bug,
  CircleDot,
  Link2,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  deleteTicket,
  fetchTicket,
  updateTicket,
  ticketImageUrl,
  type ProjectMember,
  type ProjectTicket,
  type ProjectTicketDetail,
  type TicketType,
} from "@/lib/projects-api";
import { initialsFromName } from "@/lib/initials";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DEFAULT_STATUS_FORM_OPTIONS } from "@/lib/board-columns";

const TYPES: TicketType[] = ["task", "bug", "feature", "improvement"];
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

function dueDateToInput(d: string | null | undefined): string {
  if (!d) return "";
  return d.length >= 10 ? d.slice(0, 10) : d;
}

function TypeGlyph({ type }: { type: TicketType }) {
  const box = "flex h-6 w-6 shrink-0 items-center justify-center rounded";
  switch (type) {
    case "bug":
      return (
        <span className={`${box} bg-red-500/15`}>
          <Bug className="h-3.5 w-3.5 text-red-400" aria-hidden />
        </span>
      );
    case "feature":
      return (
        <span className={`${box} bg-purple-500/15`}>
          <Sparkles className="h-3.5 w-3.5 text-purple-400" aria-hidden />
        </span>
      );
    case "improvement":
      return (
        <span className={`${box} bg-emerald-500/15`}>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        </span>
      );
    default:
      return (
        <span className={`${box} bg-blue-500/15`}>
          <CircleDot className="h-3.5 w-3.5 text-blue-400" aria-hidden />
        </span>
      );
  }
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/[0.06] py-3 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export interface TicketDetailModalProps {
  projectId: string;
  ticketId: string | null;
  /** Shown immediately while fetching */
  preview?: ProjectTicket | null;
  members: ProjectMember[];
  /** Backlog (null) plus open sprints; include current sprint if completed so the value stays valid. */
  sprintPickerOptions?: { id: string | null; name: string }[];
  /** Project board columns as status options; defaults when omitted. */
  statusOptions?: { value: string; label: string }[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (_ticket: ProjectTicket) => void;
  onDeleted: (_ticketId: string) => void;
}

export default function TicketDetailModal({
  projectId,
  ticketId,
  preview,
  members,
  sprintPickerOptions,
  statusOptions,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: TicketDetailModalProps) {
  const [detail, setDetail] = useState<ProjectTicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("task");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assigneeId, setAssigneeId] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [ticketSprintId, setTicketSprintId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const syncFormFromDetail = useCallback((d: ProjectTicketDetail) => {
    setTitle(d.title);
    setDescription(d.description ?? "");
    setType(d.type);
    setPriority(d.priority);
    setStatus(d.status);
    setAssigneeId(d.assigneeId ?? "");
    setStoryPoints(
      d.storyPoints !== null && d.storyPoints !== undefined ? String(d.storyPoints) : ""
    );
    setDueDate(dueDateToInput(d.dueDate));
    setTicketSprintId(d.sprintId ?? "");
    setImageFile(null);
    setClearImage(false);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!isOpen || detail) return;
    if (preview) setTicketSprintId(preview.sprintId ?? "");
  }, [isOpen, detail, preview]);

  useEffect(() => {
    if (isOpen) setDeleteConfirmOpen(false);
  }, [isOpen, ticketId]);

  useEffect(() => {
    if (!isOpen || !ticketId || !projectId) {
      setDetail(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchTicket(projectId, ticketId, false)
      .then((d) => {
        if (!cancelled) {
          setDetail(d);
          syncFormFromDetail(d);
        }
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load ticket");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, ticketId, projectId, syncFormFromDetail]);

  const display = detail ?? preview;
  const canEdit = Boolean(detail && !loading);

  const statusSelectOptions = useMemo(() => {
    const base = statusOptions?.length ? statusOptions : DEFAULT_STATUS_FORM_OPTIONS;
    const st = detail?.status ?? preview?.status;
    if (st && !base.some((b) => b.value === st)) {
      return [...base, { value: st, label: st.replace(/_/g, " ") }];
    }
    return base;
  }, [statusOptions, detail?.status, preview?.status]);

  const resolveStatusLabel = useCallback(
    (id: string) => {
      const o = statusSelectOptions.find((x) => x.value === id);
      return o?.label ?? STATUS_LABEL[id] ?? id.replace(/_/g, " ");
    },
    [statusSelectOptions]
  );

  const dirty = useMemo(() => {
    if (!detail) return false;
    const pointsRaw = storyPoints.trim();
    const storyPointsVal =
      pointsRaw === "" ? null : Number.isFinite(Number(pointsRaw)) ? Number(pointsRaw) : null;
    const dueCurrent = dueDate.trim() === "" ? null : dueDate.trim();
    const dueOriginal = detail.dueDate ? dueDateToInput(detail.dueDate) : null;
    const detailPoints =
      detail.storyPoints !== null && detail.storyPoints !== undefined ? detail.storyPoints : null;
    const sprintOrig = detail.sprintId ?? "";
    const sprintDirty =
      sprintPickerOptions && sprintPickerOptions.length > 0 ? ticketSprintId !== sprintOrig : false;
    return (
      title.trim() !== detail.title.trim() ||
      (description.trim() || "") !== (detail.description ?? "").trim() ||
      type !== detail.type ||
      priority !== detail.priority ||
      status !== detail.status ||
      (assigneeId || "") !== (detail.assigneeId ?? "") ||
      storyPointsVal !== detailPoints ||
      dueCurrent !== dueOriginal ||
      sprintDirty ||
      imageFile !== null ||
      clearImage
    );
  }, [
    detail,
    title,
    description,
    type,
    priority,
    status,
    assigneeId,
    storyPoints,
    dueDate,
    ticketSprintId,
    sprintPickerOptions,
    imageFile,
    clearImage,
  ]);

  const handleDiscard = () => {
    if (detail) syncFormFromDetail(detail);
  };

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!ticketId || !detail) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Title is required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      let imageBase64: string | null | undefined = undefined;
      let imageMimeType: string | null | undefined = undefined;
      if (imageFile) {
        imageBase64 = await readFileAsDataUrl(imageFile);
        imageMimeType = imageFile.type || undefined;
      } else if (clearImage) {
        imageBase64 = null;
        imageMimeType = null;
      }
      const pointsRaw = storyPoints.trim();
      const storyPointsVal =
        pointsRaw === "" ? null : Number.isFinite(Number(pointsRaw)) ? Number(pointsRaw) : null;
      const assigneePayload = assigneeId === "" ? null : assigneeId;
      const duePayload = dueDate.trim() === "" ? null : dueDate.trim();

      const updated = await updateTicket(projectId, ticketId, {
        title: trimmed,
        description: description.trim() || null,
        type,
        priority,
        status,
        assigneeId: assigneePayload,
        storyPoints: storyPointsVal,
        dueDate: duePayload,
        ...(sprintPickerOptions && sprintPickerOptions.length > 0
          ? { sprintId: ticketSprintId === "" ? null : ticketSprintId }
          : {}),
        ...(imageBase64 !== undefined ? { imageBase64, imageMimeType } : {}),
      });
      setDetail(updated);
      syncFormFromDetail(updated);
      onUpdated(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!ticketId) return;
    setDeleting(true);
    setFormError(null);
    try {
      await deleteTicket(projectId, ticketId);
      onDeleted(ticketId);
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !ticketId) return null;

  const imgSrc =
    display && display.hasImage && !clearImage ? ticketImageUrl(projectId, ticketId) : null;
  const showPendingImage = Boolean(imagePreviewUrl);

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative flex max-h-[94vh] w-[95%] sm:w-[92%] max-w-5xl flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0c] shadow-2xl transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar — Jira-style global actions */}
          <div className="flex shrink-0 items-center justify-end gap-1 border-b border-white/[0.06] px-3 py-2 sm:px-4">
            <details className="relative group">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded-md p-2 text-zinc-500 marker:hidden hover:bg-white/[0.06] hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="h-5 w-5" aria-hidden />
                <span className="sr-only">More actions</span>
              </summary>
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-white/[0.1] bg-[#121214] py-1 shadow-xl">
                <button
                  type="button"
                  disabled={!detail || deleting}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 shrink-0" />
                  )}
                  Delete ticket
                </button>
              </div>
            </details>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadError && !display && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-200">
              {loadError}
            </div>
          )}

          <div className="flex min-h-[280px] flex-1 flex-col lg:min-h-0 lg:flex-row">
            {/* Main column */}
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 lg:max-w-none">
              {loading && !display ? (
                <div className="flex h-48 items-center justify-center gap-2 text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading ticket…
                </div>
              ) : display ? (
                <>
                  {loadError && (
                    <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
                      {loadError} — showing cached data.
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <TypeGlyph type={display.type} />
                    <span className="font-mono text-[13px] font-medium text-zinc-500">
                      {display.key}
                    </span>
                  </div>

                  {canEdit ? (
                    <input
                      id="ticket-detail-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-3 w-full border-0 border-b border-transparent bg-transparent pb-1 text-2xl font-semibold leading-snug tracking-tight text-zinc-100 outline-none ring-0 transition-colors placeholder:text-zinc-600 focus:border-blue-500/40 sm:text-[26px]"
                      placeholder="Ticket title"
                    />
                  ) : (
                    <h1
                      id="ticket-detail-title"
                      className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-zinc-100 sm:text-[26px]"
                    >
                      {display.title}
                    </h1>
                  )}

                  {/* Toolbar */}
                  <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-white/[0.06] pb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setClearImage(false);
                        setImageFile(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"
                      title="Add image"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-600"
                      title="Checklists (soon)"
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-600"
                      title="Links (soon)"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                  </div>

                  {(imgSrc || showPendingImage) && (
                    <div className="mt-5 overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-950/80">
                      {showPendingImage && imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="New attachment preview"
                          className="max-h-[min(380px,45vh)] w-full object-contain"
                        />
                      ) : imgSrc ? (
                        <img
                          src={imgSrc}
                          alt=""
                          className="max-h-[min(380px,45vh)] w-full object-contain"
                        />
                      ) : null}
                      {canEdit && (detail?.hasImage || imageFile) && (
                        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-3 py-2">
                          {detail?.hasImage && !imageFile && (
                            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-zinc-500">
                              <input
                                type="checkbox"
                                checked={clearImage}
                                onChange={(e) => {
                                  setClearImage(e.target.checked);
                                  if (e.target.checked) setImageFile(null);
                                }}
                              />
                              Remove image
                            </label>
                          )}
                          {imageFile && (
                            <button
                              type="button"
                              className="text-[12px] text-zinc-400 hover:text-zinc-200"
                              onClick={() => setImageFile(null)}
                            >
                              Clear new image
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6">
                    <h2 className="mb-2 text-[13px] font-semibold text-zinc-300">Description</h2>
                    {canEdit ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={12}
                        placeholder="Add a description…"
                        className="min-h-[180px] w-full resize-y rounded-lg border border-white/[0.08] bg-[#0f0f12] px-4 py-3 text-[15px] leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/35 focus:outline-none"
                      />
                    ) : (
                      <div className="rounded-lg border border-white/[0.06] bg-[#0f0f12] px-4 py-3 text-[15px] leading-relaxed text-zinc-300">
                        {display.description?.trim() ? (
                          <p className="whitespace-pre-wrap">{display.description}</p>
                        ) : (
                          <p className="text-zinc-600">No description provided.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 border-t border-white/[0.06] pt-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-[13px] font-semibold text-zinc-300">Activity</h2>
                      <span className="text-[11px] font-medium text-zinc-600">Comments</span>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-dashed border-white/[0.08] bg-[#0c0c0f] p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-400">
                        …
                      </div>
                      <textarea
                        disabled
                        rows={2}
                        placeholder="Add a comment…"
                        className="min-h-[52px] flex-1 resize-none border-0 bg-transparent text-[14px] text-zinc-500 placeholder:text-zinc-600"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-600">
                      Comments will be available in a future update.
                    </p>
                  </div>

                  {formError && (
                    <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
                      {formError}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="custom-scrollbar shrink-0 border-t border-white/[0.06] bg-[#080809] px-4 py-5 lg:w-[300px] lg:border-l lg:border-t-0 lg:py-6">
              {!display ? (
                <div className="space-y-3 py-4">
                  <div className="h-10 animate-pulse rounded bg-zinc-800/80" />
                  <div className="h-10 animate-pulse rounded bg-zinc-800/80" />
                  <div className="h-10 animate-pulse rounded bg-zinc-800/80" />
                </div>
              ) : (
                <>
                  <SidebarField label="Status">
                    {canEdit ? (
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full cursor-pointer rounded-md border border-white/[0.1] bg-zinc-900/90 px-3 py-2 text-[13px] font-medium text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                      >
                        {statusSelectOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[14px] font-medium capitalize text-zinc-200">
                        {resolveStatusLabel(display.status)}
                      </p>
                    )}
                  </SidebarField>

                  {sprintPickerOptions && sprintPickerOptions.length > 0 && (
                    <SidebarField label="Sprint">
                      {canEdit ? (
                        <select
                          value={ticketSprintId}
                          onChange={(e) => setTicketSprintId(e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-white/[0.1] bg-zinc-900/90 px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                        >
                          {sprintPickerOptions.map((o) => (
                            <option key={o.id === null ? "backlog" : o.id} value={o.id ?? ""}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[14px] text-zinc-300">
                          {sprintPickerOptions.find((o) => o.id === display.sprintId)?.name ??
                            (display.sprintId ? "Sprint" : "Backlog")}
                        </p>
                      )}
                    </SidebarField>
                  )}

                  <SidebarField label="Assignee">
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-800 text-[11px] font-semibold text-zinc-300">
                          {initialsFromName(
                            assigneeId ? members.find((m) => m.userId === assigneeId)?.name : null
                          )}
                        </div>
                        <select
                          value={assigneeId}
                          onChange={(e) => setAssigneeId(e.target.value)}
                          className="min-w-0 flex-1 cursor-pointer rounded-md border border-white/[0.1] bg-zinc-900/90 px-2 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-800 text-[11px] font-semibold text-zinc-300">
                          {initialsFromName(display.assigneeName)}
                        </div>
                        <span className="text-[14px] text-zinc-200">
                          {display.assigneeName ?? "Unassigned"}
                        </span>
                      </div>
                    )}
                  </SidebarField>

                  <SidebarField label="Reporter">
                    <p className="text-[14px] text-zinc-300">{display.reporterName}</p>
                  </SidebarField>

                  <SidebarField label="Priority">
                    {canEdit ? (
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full cursor-pointer rounded-md border border-white/[0.1] bg-zinc-900/90 px-3 py-2 text-[13px] capitalize text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[14px] capitalize text-zinc-300">{display.priority}</p>
                    )}
                  </SidebarField>

                  <SidebarField label="Type">
                    {canEdit ? (
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as TicketType)}
                        className="w-full cursor-pointer rounded-md border border-white/[0.1] bg-zinc-900/90 px-3 py-2 text-[13px] capitalize text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                      >
                        {TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[14px] capitalize text-zinc-300">{display.type}</p>
                    )}
                  </SidebarField>

                  <SidebarField label="Story points">
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        value={storyPoints}
                        onChange={(e) => setStoryPoints(e.target.value)}
                        className="w-full rounded-md border border-white/[0.1] bg-zinc-900/90 px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                      />
                    ) : (
                      <p className="text-[14px] text-zinc-400">
                        {display.storyPoints !== null && display.storyPoints !== undefined
                          ? `${display.storyPoints}`
                          : "None"}
                      </p>
                    )}
                  </SidebarField>

                  <SidebarField label="Due date">
                    {canEdit ? (
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded-md border border-white/[0.1] bg-zinc-900/90 px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                      />
                    ) : (
                      <p className="text-[14px] text-zinc-400">
                        {display.dueDate ? dueDateToInput(display.dueDate) : "None"}
                      </p>
                    )}
                  </SidebarField>

                  <SidebarField label="Labels">
                    <button type="button" disabled className="text-left text-[14px] text-zinc-500">
                      None
                    </button>
                  </SidebarField>

                  <p className="pt-2 text-[11px] leading-relaxed text-zinc-600">
                    Created {new Date(display.createdAt).toLocaleString()}
                    <br />
                    Updated {new Date(display.updatedAt).toLocaleString()}
                  </p>
                </>
              )}
            </aside>
          </div>

          {/* Sticky save bar (Jira-style unsaved changes) */}
          {canEdit && dirty && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.08] bg-[#0d0d10] px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2 text-[13px] font-semibold text-zinc-950 hover:bg-white disabled:opacity-40"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        title="Delete this ticket?"
        description="This cannot be undone. Comments and attachments are removed with the ticket."
        confirmLabel="Delete permanently"
        cancelLabel="Keep ticket"
        variant="danger"
        onConfirm={executeDelete}
      />
    </>
  );
}
