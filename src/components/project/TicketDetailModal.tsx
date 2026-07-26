"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bug,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CornerDownRight,
  Clock,
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
  createTimeEntry,
  deleteTicket,
  deleteTimeEntry,
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
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITIES } from "@/lib/ticket-priority";
import { validateTicketImageFile } from "@/lib/ticket-image-upload";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const TYPES: TicketType[] = ["task", "bug", "feature", "improvement"];

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

function formatHoursParts(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatEntryTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSafeRichTextUrl(url: string): boolean {
  return /^(https?:\/\/|data:image\/)/i.test(url.trim());
}

function renderInlineRichText(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const tokenRegex =
    /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(tokenRegex)) {
    if (match.index === undefined) continue;
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[1] !== undefined && match[2] !== undefined) {
      const alt = match[1];
      const src = match[2].trim();
      if (isSafeRichTextUrl(src)) {
        nodes.push(
          <img
            key={`${keyPrefix}-img-${index++}`}
            src={src}
            alt={alt || "Inline"}
            className="my-2 max-h-44 rounded-md border border-border"
          />
        );
      } else {
        nodes.push(match[0]);
      }
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const label = match[3];
      const href = match[4].trim();
      if (isSafeRichTextUrl(href)) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${index++}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-strong"
          >
            {label}
          </a>
        );
      } else {
        nodes.push(label);
      }
    } else if (match[5] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${index++}`} className="font-semibold text-fg">
          {match[5]}
        </strong>
      );
    } else if (match[6] !== undefined) {
      nodes.push(
        <em key={`${keyPrefix}-em-${index++}`} className="italic text-fg">
          {match[6]}
        </em>
      );
    } else {
      nodes.push(match[0]);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderCommentContent(
  content: string,
  members: ProjectMember[],
  keyPrefix: string
): React.ReactNode {
  const memberNames = members
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => (b?.length ?? 0) - (a?.length ?? 0));

  const result: React.ReactNode[] = [];
  let remaining = content;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const atIndex = remaining.indexOf("@");

    if (atIndex === -1) {
      result.push(<span key={`${keyPrefix}-${keyIndex++}`}>{remaining}</span>);
      break;
    }

    if (atIndex > 0) {
      result.push(<span key={`${keyPrefix}-${keyIndex++}`}>{remaining.slice(0, atIndex)}</span>);
    }

    const afterAt = remaining.slice(atIndex + 1);
    let matched = false;

    for (const name of memberNames) {
      if (name && afterAt.toLowerCase().startsWith(name.toLowerCase())) {
        result.push(
          <span key={`${keyPrefix}-${keyIndex++}`} className="text-accent font-medium">
            @{name}{" "}
          </span>
        );
        remaining = remaining.slice(atIndex + 1 + name.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(<span key={`${keyPrefix}-${keyIndex++}`}>@</span>);
      remaining = remaining.slice(atIndex + 1);
    }
  }

  return <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg">{result}</div>;
}

function renderRichTextDescription(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const checkboxMatch = line.match(/^\s*-\s\[( |x|X)\]\s+(.*)$/);
    if (checkboxMatch) {
      const checked = checkboxMatch[1].toLowerCase() === "x";
      const content = checkboxMatch[2];
      return (
        <label key={`cb-${idx}`} className="mb-1 flex items-start gap-2 text-[14px] text-muted2">
          <input type="checkbox" checked={checked} readOnly className="mt-0.5" />
          <span className="min-w-0">{renderInlineRichText(content, `cb-${idx}`)}</span>
        </label>
      );
    }
    if (!line.trim()) return <div key={`sp-${idx}`} className="h-3" />;
    return (
      <p
        key={`p-${idx}`}
        className="mb-1 whitespace-pre-wrap text-[14px] leading-relaxed text-muted2"
      >
        {renderInlineRichText(line, `p-${idx}`)}
      </p>
    );
  });
}

function TypeGlyph({ type }: { type: TicketType }) {
  const box = "flex h-6 w-6 shrink-0 items-center justify-center rounded";
  switch (type) {
    case "bug":
      return (
        <span className={`${box} bg-danger-soft`}>
          <Bug className="h-3.5 w-3.5 text-danger" aria-hidden />
        </span>
      );
    case "feature":
      return (
        <span className={`${box} bg-accent2/15`}>
          <Sparkles className="h-3.5 w-3.5 text-accent2" aria-hidden />
        </span>
      );
    case "improvement":
      return (
        <span className={`${box} bg-success-soft`}>
          <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden />
        </span>
      );
    default:
      return (
        <span className={`${box} bg-accent-soft`}>
          <CircleDot className="h-3.5 w-3.5 text-accent" aria-hidden />
        </span>
      );
  }
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="flex min-h-[280px] flex-1 flex-col lg:min-h-0 lg:flex-row">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 lg:max-w-none">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 shrink-0 animate-pulse rounded bg-hover-strong" />
          <div className="h-4 w-24 animate-pulse rounded bg-hover-strong" />
        </div>
        <div className="mt-4 h-9 w-[88%] max-w-xl animate-pulse rounded-md bg-hover-strong" />
        <div className="mt-3 h-9 w-[62%] max-w-lg animate-pulse rounded-md bg-hover-strong" />
        <div className="mt-6 flex gap-1 border-b border-border pb-3">
          <div className="h-8 w-8 animate-pulse rounded bg-hover-strong" />
          <div className="h-8 w-8 animate-pulse rounded bg-hover-strong" />
          <div className="h-8 w-8 animate-pulse rounded bg-hover-strong" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-hover-strong" />
          <div className="h-40 w-full animate-pulse rounded-lg bg-hover-strong" />
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-hover-strong" />
          <div className="h-[72px] w-full animate-pulse rounded-lg border border-dashed border-border bg-hover" />
        </div>
      </div>
      <aside className="custom-scrollbar shrink-0 border-t border-border bg-surface-sunken px-4 py-5 lg:w-[300px] lg:border-l lg:border-t-0 lg:py-6">
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b border-border py-3 last:border-0">
              <div className="h-3 w-16 animate-pulse rounded bg-hover-strong" />
              <div className="mt-2 h-10 w-full animate-pulse rounded-md bg-hover-strong" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

interface CommentData {
  id: string;
  taskId: string;
  workspaceId: string;
  userId: string;
  content: string;
  parentId: string | null;
  mentionedUserIds: string[] | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userAvatarUrl: string | null;
  canDelete?: boolean;
}

function extractItems<T>(payload: T[] | { items?: T[] }) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
}

export interface TicketDetailModalProps {
  workspaceId?: string;
  projectId: string;
  ticketId: string | null;
  focusCommentId?: string | null;
  preview?: ProjectTicket | null;
  members: ProjectMember[];
  sprintPickerOptions?: { id: string | null; name: string }[];
  statusOptions?: { value: string; label: string }[];
  linkableTickets?: ProjectTicket[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (_ticket: ProjectTicket) => void;
  onDeleted: (_ticketId: string) => void;
}

export default function TicketDetailModal({
  workspaceId,
  projectId,
  ticketId,
  focusCommentId,
  preview: _preview,
  members,
  sprintPickerOptions,
  statusOptions,
  linkableTickets = [],
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
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<string | null>(null);
  const [logHours, setLogHours] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [timeLogError, setTimeLogError] = useState<string | null>(null);
  const [deletingTimeEntryId, setDeletingTimeEntryId] = useState<string | null>(null);
  const [descriptionToolError, setDescriptionToolError] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [collapsedCommentIds, setCollapsedCommentIds] = useState<Set<string>>(new Set());
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionResults, setMentionResults] = useState<ProjectMember[]>([]);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNewComment(value);
      const lastAtIndex = value.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        const afterAt = value.slice(lastAtIndex + 1);
        const searchText = afterAt.split(" ")[0].toLowerCase();
        if (searchText && !afterAt.includes(" ")) {
          const filtered = members.filter((m) => m.name.toLowerCase().includes(searchText));
          setMentionResults(filtered.slice(0, 5));
          setShowMentionDropdown(filtered.length > 0);
          return;
        }
      }
      setShowMentionDropdown(false);
      setMentionResults([]);
    },
    [members]
  );

  const insertMention = useCallback(
    (member: ProjectMember) => {
      if (!member.name) return;
      const lastAtIndex = newComment.lastIndexOf("@");
      if (lastAtIndex === -1) return;
      const beforeAt = newComment.slice(0, lastAtIndex);
      setNewComment(beforeAt + "@" + member.name + " ");
      setShowMentionDropdown(false);
      setMentionResults([]);
      setTimeout(() => {
        commentInputRef.current?.focus();
        const len = (beforeAt + "@" + member.name + " ").length;
        commentInputRef.current?.setSelectionRange(len, len);
      }, 0);
    },
    [newComment]
  );

  const fetchComments = useCallback(async () => {
    if (!workspaceId || !ticketId) return;
    setCommentsLoading(true);
    setCommentError(null);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks/${ticketId}/comments`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = extractItems<CommentData>(await response.json());
      const sorted = data.sort(
        (a: CommentData, b: CommentData) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setComments(sorted);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  }, [workspaceId, ticketId]);

  const handleAddComment = useCallback(async () => {
    if (!workspaceId || !ticketId || !newComment.trim()) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim(), parentId: replyingToId || null }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const newCommentData = await response.json();
      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
      setReplyingToId(null);
      commentInputRef.current?.focus();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }, [workspaceId, ticketId, newComment, replyingToId]);

  // AUD-051: this used to call the browser's native confirm()/alert() — inconsistent
  // with every other delete flow in this modal (and the app), blocks the main thread,
  // and can't be styled or tested like the rest of the UI. It now goes through the
  // same ConfirmDialog pattern used for ticket and time-entry deletion below.
  const handleDeleteComment = useCallback((commentId: string) => {
    setPendingDeleteCommentId(commentId);
  }, []);

  const executeDeleteComment = useCallback(async () => {
    if (!workspaceId || !ticketId || !pendingDeleteCommentId) return;
    const commentId = pendingDeleteCommentId;
    const response = await fetch(
      `/api/workspaces/${workspaceId}/tasks/${ticketId}/comments/${commentId}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Failed to delete comment (HTTP ${response.status})`);
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCollapsedCommentIds((prev) => {
      if (!prev.has(commentId)) return prev;
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    setPendingDeleteCommentId(null);
  }, [workspaceId, ticketId, pendingDeleteCommentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    setCollapsedCommentIds(new Set());
    setReplyingToId(null);
  }, [ticketId]);

  const commentsById = useMemo(() => {
    return new Map(comments.map((comment) => [comment.id, comment]));
  }, [comments]);

  const commentChildrenMap = useMemo(() => {
    const byParent = new Map<string, CommentData[]>();
    for (const comment of comments) {
      if (!comment.parentId) continue;
      const children = byParent.get(comment.parentId) ?? [];
      children.push(comment);
      byParent.set(comment.parentId, children);
    }
    return byParent;
  }, [comments]);

  const rootComments = useMemo(() => {
    return comments.filter((comment) => {
      if (!comment.parentId) return true;
      return !commentsById.has(comment.parentId);
    });
  }, [comments, commentsById]);

  const replyTarget = useMemo(
    () => (replyingToId ? (commentsById.get(replyingToId) ?? null) : null),
    [replyingToId, commentsById]
  );

  const getCommentDescendantCount = useCallback(
    (commentId: string) => {
      let count = 0;
      const stack = [...(commentChildrenMap.get(commentId) ?? [])];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;
        count += 1;
        const children = commentChildrenMap.get(current.id);
        if (children?.length) stack.push(...children);
      }
      return count;
    },
    [commentChildrenMap]
  );

  const expandCommentAncestors = useCallback(
    (commentId: string) => {
      const ancestorIds: string[] = [];
      let cursor = commentsById.get(commentId);
      while (cursor?.parentId) {
        ancestorIds.push(cursor.parentId);
        cursor = commentsById.get(cursor.parentId);
      }
      if (ancestorIds.length === 0) return;
      setCollapsedCommentIds((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const ancestorId of ancestorIds) {
          if (next.has(ancestorId)) {
            next.delete(ancestorId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    [commentsById]
  );

  const toggleCommentCollapse = useCallback((commentId: string) => {
    setCollapsedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const startReplyToComment = useCallback(
    (commentId: string) => {
      setReplyingToId(commentId);
      expandCommentAncestors(commentId);
      requestAnimationFrame(() => {
        commentInputRef.current?.focus();
      });
    },
    [expandCommentAncestors]
  );

  useEffect(() => {
    if (!focusCommentId) return;
    expandCommentAncestors(focusCommentId);
  }, [focusCommentId, expandCommentAncestors]);

  useEffect(() => {
    if (!focusCommentId || comments.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`comment-${focusCommentId}`);
      if (!target) return;
      setHighlightedCommentId(focusCommentId);
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timeout = window.setTimeout(() => setHighlightedCommentId(null), 1800);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [focusCommentId, comments, collapsedCommentIds]);

  useEffect(() => {
    if (!replyingToId) return;
    if (!commentsById.has(replyingToId)) {
      setReplyingToId(null);
      return;
    }
    expandCommentAncestors(replyingToId);
  }, [replyingToId, commentsById, expandCommentAncestors]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // AUD-015 / AUD-056: the app's largest and most-used modal previously had no
  // Escape-to-close handler at all.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !deleting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, deleting, onClose]);

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
    setDependsOnIds(d.dependsOn?.map((x) => x.id) ?? []);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (isOpen) setDeleteConfirmOpen(false);
  }, [isOpen, ticketId]);

  useEffect(() => {
    setLogHours("");
    setLogNote("");
    setPendingDeleteEntryId(null);
    setTimeLogError(null);
  }, [ticketId]);

  useEffect(() => {
    if (!isOpen || !ticketId || !projectId) {
      setDetail(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setDetail(null);
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

  const canEdit = Boolean(detail && !loading);
  const showSkeleton = Boolean(loading && !detail);

  const statusSelectOptions = useMemo(() => {
    const base = statusOptions?.length ? statusOptions : DEFAULT_STATUS_FORM_OPTIONS;
    const st = detail?.status;
    if (st && !base.some((b) => b.value === st)) {
      return [...base, { value: st, label: st.replace(/_/g, " ") }];
    }
    return base;
  }, [statusOptions, detail?.status]);

  const resolveStatusLabel = useCallback(
    (id: string) => {
      const o = statusSelectOptions.find((x) => x.value === id);
      return o?.label ?? STATUS_LABEL[id] ?? id.replace(/_/g, " ");
    },
    [statusSelectOptions]
  );

  const sortedIds = useCallback((ids: string[]) => [...ids].sort(), []);

  const linkPickerOptions = useMemo(() => {
    if (!ticketId) return [];
    return linkableTickets
      .filter((t) => t.id !== ticketId)
      .sort((a, b) => a.ticketNumber - b.ticketNumber);
  }, [linkableTickets, ticketId]);

  const blockedDependencyOptions = useMemo(
    () => linkPickerOptions.filter((ticket) => dependsOnIds.includes(ticket.id)),
    [linkPickerOptions, dependsOnIds]
  );

  const openDependencies = useMemo(
    () => (detail?.dependsOn ?? []).filter((dependency) => dependency.status !== "done"),
    [detail?.dependsOn]
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
      clearImage ||
      JSON.stringify(sortedIds(dependsOnIds)) !==
        JSON.stringify(sortedIds(detail.dependsOn?.map((d) => d.id) ?? []))
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
    dependsOnIds,
    sortedIds,
  ]);

  const handleDiscard = () => {
    if (detail) syncFormFromDetail(detail);
  };

  const updateDescriptionSelection = useCallback(
    (
      transform: (
        _source: string,
        _start: number,
        _end: number
      ) => { next: string; cursorStart: number; cursorEnd: number }
    ) => {
      const input = descriptionInputRef.current;
      const source = description;
      const start = input?.selectionStart ?? source.length;
      const end = input?.selectionEnd ?? source.length;
      const { next, cursorStart, cursorEnd } = transform(source, start, end);
      setDescription(next);
      setDescriptionToolError(null);
      requestAnimationFrame(() => {
        const current = descriptionInputRef.current;
        if (!current) return;
        current.focus();
        current.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [description]
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix: string, placeholder: string) => {
      updateDescriptionSelection((source, start, end) => {
        const selected = source.slice(start, end) || placeholder;
        const next = `${source.slice(0, start)}${prefix}${selected}${suffix}${source.slice(end)}`;
        const cursorStart = start + prefix.length;
        const cursorEnd = cursorStart + selected.length;
        return { next, cursorStart, cursorEnd };
      });
    },
    [updateDescriptionSelection]
  );

  const insertCheckboxLine = useCallback(() => {
    updateDescriptionSelection((source, start, _end) => {
      const lineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const next = `${source.slice(0, lineStart)}- [ ] ${source.slice(lineStart)}`;
      const cursor = lineStart + 6;
      return { next, cursorStart: cursor, cursorEnd: cursor };
    });
  }, [updateDescriptionSelection]);

  const insertLink = useCallback(() => {
    const input = descriptionInputRef.current;
    const selected = input ? description.slice(input.selectionStart, input.selectionEnd) : "";
    const linkText = window.prompt("Link text", selected || "link");
    if (!linkText) return;
    const url = window.prompt("URL", "https://");
    if (!url) return;
    wrapSelection("", "", `[${linkText}](${url.trim()})`);
  }, [description, wrapSelection]);

  const insertInlineImage = useCallback(async () => {
    const file = inlineImageInputRef.current?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setDescriptionToolError("Please choose an image file.");
      return;
    }
    if (file.size > 300 * 1024) {
      setDescriptionToolError("Keep inline images small (max 300KB).");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateDescriptionSelection((source, start, end) => {
        const snippet = `![${file.name.replace(/\.[^.]+$/, "")}](${dataUrl})`;
        const next = `${source.slice(0, start)}${snippet}${source.slice(end)}`;
        const cursor = start + snippet.length;
        return { next, cursorStart: cursor, cursorEnd: cursor };
      });
    } catch {
      setDescriptionToolError("Could not read the selected image.");
    } finally {
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  }, [updateDescriptionSelection]);

  const handleLogTime = async () => {
    if (!ticketId || !detail) return;
    const raw = logHours.trim().replace(",", ".");
    if (!raw) {
      setTimeLogError("Enter how many hours you spent (e.g. 1.5 or 0.25).");
      return;
    }
    const hours = Number(raw);
    if (!Number.isFinite(hours) || hours <= 0) {
      setTimeLogError("Enter a valid number of hours (e.g. 1.5 or 0.25).");
      return;
    }
    setTimeLogError(null);
    setLogSubmitting(true);
    try {
      const result = await createTimeEntry(projectId, ticketId, {
        hours,
        description: logNote.trim() || null,
      });
      const next: ProjectTicketDetail = {
        ...detail,
        timeEntries: [result.entry, ...(detail.timeEntries ?? [])],
        totalLoggedHours: result.totalLoggedHours,
      };
      setDetail(next);
      setLogHours("");
      setLogNote("");
      onUpdated(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not log time";
      const missingTable =
        /time_entries/i.test(msg) && /(does not exist|relation|Failed query)/i.test(msg);
      setTimeLogError(
        missingTable
          ? "Time logging isn’t set up yet. In the project directory run: npm run db:push"
          : msg
      );
    } finally {
      setLogSubmitting(false);
    }
  };

  const executeDeleteTimeEntry = async () => {
    if (!ticketId || !detail || !pendingDeleteEntryId) return;
    const entryId = pendingDeleteEntryId;
    setDeletingTimeEntryId(entryId);
    setTimeLogError(null);
    try {
      const { totalLoggedHours } = await deleteTimeEntry(projectId, ticketId, entryId);
      const next: ProjectTicketDetail = {
        ...detail,
        timeEntries: (detail.timeEntries ?? []).filter((e) => e.id !== entryId),
        totalLoggedHours,
      };
      setDetail(next);
      onUpdated(next);
    } catch (err) {
      setTimeLogError(err instanceof Error ? err.message : "Could not remove time entry");
    } finally {
      setDeletingTimeEntryId(null);
    }
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
        dependsOnTaskIds: dependsOnIds,
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
    detail && detail.hasImage && !clearImage ? ticketImageUrl(projectId, ticketId) : null;
  const showPendingImage = Boolean(imagePreviewUrl);
  const currentUser = members[0];
  const renderCommentComposer = (inline = false, replyTargetName?: string) => (
    <div
      className={`rounded-xl border border-border bg-surface-sunken p-4 ${inline ? "mt-3" : "mb-4"} flex gap-3`}
    >
      {!inline ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent2/20 ring-1 ring-border-hover">
          {currentUser ? (
            <span className="text-[11px] font-semibold text-fg">
              {initialsFromName(currentUser.name)}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-muted2">You</span>
          )}
        </div>
      ) : null}
      <div className="flex-1">
        {inline && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-hover px-3 py-1.5 text-[12px] text-muted2">
            Replying to <span className="font-medium text-fg">{replyTargetName ?? "comment"}</span>
          </div>
        )}
        <div className="relative flex-1">
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={handleCommentChange}
            placeholder={inline ? "Write a reply…" : "Add a comment…"}
            rows={inline ? 3 : 2}
            className="min-h-[52px] w-full resize-none border border-border bg-surface-sunken p-3 rounded-lg text-[14px] text-fg placeholder:text-muted focus:border-accent/35 focus:outline-none focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          {showMentionDropdown && mentionResults.length > 0 && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-border-hover bg-surface-hover shadow-xl">
              {mentionResults.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => insertMention(member)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-hover transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-muted2">
                    {initialsFromName(member.name)}
                  </div>
                  <span className="text-[13px] text-fg">{member.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={submittingComment || !newComment.trim()}
            onClick={handleAddComment}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent/20 px-3 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/30 disabled:opacity-40"
          >
            {submittingComment && <Loader2 className="h-3 w-3 animate-spin" />}
            {inline ? "Reply" : "Comment"}
          </button>
          {inline ? (
            <button
              type="button"
              disabled={submittingComment}
              onClick={() => setReplyingToId(null)}
              className="inline-flex items-center rounded-md px-2 py-1.5 text-[12px] text-muted hover:bg-hover hover:text-muted2"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-overlay-strong p-3 sm:p-5 backdrop-blur-sm"
        onClick={() => !submitting && !deleting && onClose()}
      >
        <div
          ref={modalRef}
          className="relative flex max-h-[94vh] w-[95%] sm:w-[92%] max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface-sunken shadow-2xl transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border px-3 py-2 sm:px-4">
            <details className="relative group">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded-md p-2 text-muted marker:hidden hover:bg-hover hover:text-muted2 [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="h-5 w-5" aria-hidden />
                <span className="sr-only">More actions</span>
              </summary>
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-border-hover bg-surface py-1 shadow-xl">
                <button
                  type="button"
                  disabled={!detail || deleting}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft disabled:opacity-40"
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
              className="rounded-md p-2 text-muted hover:bg-hover hover:text-fg"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showSkeleton ? (
            <TicketDetailSkeleton />
          ) : !detail && loadError ? (
            <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm text-danger">{loadError}</p>
              <p className="mt-2 max-w-sm text-[12px] text-muted">
                Close this dialog and try again, or pick another ticket from the board.
              </p>
            </div>
          ) : detail ? (
            <div className="flex min-h-[280px] flex-1 flex-col lg:min-h-0 lg:flex-row">
              {/* Main column */}
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 lg:max-w-none">
                <>
                  <div className="flex items-center gap-2">
                    <TypeGlyph type={detail.type} />
                    <span className="font-mono text-[13px] font-medium text-muted">
                      {detail.key}
                    </span>
                  </div>

                  {canEdit ? (
                    <input
                      id="ticket-detail-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-3 w-full border-0 border-b border-transparent bg-transparent pb-1 text-2xl font-semibold leading-snug tracking-tight text-fg outline-none ring-0 transition-colors placeholder:text-muted focus:border-accent/40 sm:text-[26px]"
                      placeholder="Ticket title"
                    />
                  ) : (
                    <h1
                      id="ticket-detail-title"
                      className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-fg sm:text-[26px]"
                    >
                      {detail.title}
                    </h1>
                  )}

                  {/* Toolbar */}
                  <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-border pb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file) {
                          const validationError = validateTicketImageFile(file);
                          if (validationError) {
                            setFormError(validationError);
                            e.target.value = "";
                            return;
                          }
                        }
                        setFormError(null);
                        setClearImage(false);
                        setImageFile(file);
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={inlineImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={() => void insertInlineImage()}
                    />
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => wrapSelection("**", "**", "bold text")}
                      className="inline-flex h-8 min-w-[34px] items-center justify-center rounded px-2 text-[12px] font-semibold text-muted hover:bg-hover hover:text-muted2 disabled:opacity-40"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => wrapSelection("*", "*", "italic text")}
                      className="inline-flex h-8 min-w-[34px] items-center justify-center rounded px-2 text-[12px] italic text-muted hover:bg-hover hover:text-muted2 disabled:opacity-40"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-hover hover:text-muted2 disabled:opacity-40"
                      title="Add image"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={insertCheckboxLine}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-hover hover:text-muted2 disabled:opacity-40"
                      title="Checklist item"
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={insertLink}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-hover hover:text-muted2 disabled:opacity-40"
                      title="Insert link"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => inlineImageInputRef.current?.click()}
                      className="inline-flex h-8 min-w-[44px] items-center justify-center rounded px-2 text-[11px] text-muted hover:bg-hover hover:text-muted2 disabled:opacity-40"
                      title="Insert inline image"
                    >
                      Img
                    </button>
                  </div>

                  {(imgSrc || showPendingImage) && (
                    <div className="mt-5 overflow-hidden rounded-lg border border-border bg-surface-sunken/80">
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
                        <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
                          {detail?.hasImage && !imageFile && (
                            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted">
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
                              className="text-[12px] text-muted2 hover:text-fg"
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
                    <h2 className="mb-2 text-[13px] font-semibold text-muted2">Description</h2>
                    {canEdit ? (
                      <>
                        <textarea
                          ref={descriptionInputRef}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={12}
                          placeholder="Add a description…"
                          className="min-h-[180px] w-full resize-y rounded-lg border border-border bg-surface-sunken px-4 py-3 text-[15px] leading-relaxed text-fg placeholder:text-muted focus:border-accent/35 focus:outline-none"
                        />
                        {descriptionToolError ? (
                          <p className="mt-2 text-[12px] text-danger">{descriptionToolError}</p>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-lg border border-border bg-surface-sunken px-4 py-3 text-[15px] leading-relaxed text-muted2">
                        {detail.description?.trim() ? (
                          <div>{renderRichTextDescription(detail.description)}</div>
                        ) : (
                          <p className="text-muted">No description provided.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 border-t border-border pb-6 pt-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-[13px] font-semibold text-muted2 mr-2">Comments</h2>
                      <span className="bg-hover-strong text-muted2 text-[11px] px-2 py-0.5 rounded-full">
                        {commentsLoading ? "Loading…" : `${comments.length}`}
                      </span>
                    </div>

                    {commentError && (
                      <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
                        {commentError}
                      </div>
                    )}

                    {!replyingToId ? renderCommentComposer(false) : null}

                    {/* Comments list */}
                    <div className="custom-scrollbar max-h-[400px] space-y-3 overflow-y-auto pr-1">
                      {commentsLoading ? (
                        <div className="flex items-start gap-3 py-3">
                          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-hover-strong" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 animate-pulse rounded bg-hover-strong" />
                            <div className="h-20 w-full animate-pulse rounded-lg bg-hover-strong" />
                          </div>
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-center text-[13px] text-muted py-8">No comments yet</p>
                      ) : (
                        rootComments.map((comment) => {
                          const renderThread = (
                            node: CommentData,
                            depth: number,
                            path: Set<string>
                          ): React.ReactNode => {
                            if (path.has(node.id)) return null;
                            const childComments = commentChildrenMap.get(node.id) ?? [];
                            const hasChildren = childComments.length > 0;
                            const isCollapsed = collapsedCommentIds.has(node.id);
                            const descendantCount = hasChildren
                              ? getCommentDescendantCount(node.id)
                              : 0;
                            const nextPath = new Set(path);
                            nextPath.add(node.id);
                            return (
                              <div key={node.id} className={depth > 0 ? "mt-2" : ""}>
                                <div
                                  id={`comment-${node.id}`}
                                  className={`rounded-lg px-1 py-1 transition ${
                                    highlightedCommentId === node.id
                                      ? "bg-accent/10 ring-1 ring-accent/30"
                                      : ""
                                  }`}
                                  style={{ marginLeft: `${depth * 18}px` }}
                                >
                                  <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent2/20 ring-1 ring-border-hover">
                                      {node.userAvatarUrl ? (
                                        <img
                                          src={node.userAvatarUrl}
                                          alt=""
                                          className="h-10 w-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-[11px] font-semibold text-fg">
                                          {initialsFromName(node.userName)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-fg">{node.userName}</span>
                                        <span className="text-[12px] text-muted">
                                          {formatRelativeTime(new Date(node.createdAt))}
                                        </span>
                                      </div>
                                      <div className="mt-1">
                                        {renderCommentContent(
                                          node.content,
                                          members,
                                          `comment-${node.id}`
                                        )}
                                      </div>
                                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
                                        <button
                                          type="button"
                                          onClick={() => startReplyToComment(node.id)}
                                          className="inline-flex items-center gap-1 text-muted2 hover:text-fg"
                                        >
                                          <CornerDownRight className="h-3.5 w-3.5" />
                                          Reply
                                        </button>
                                        {hasChildren ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleCommentCollapse(node.id)}
                                            className="inline-flex items-center gap-1 text-muted2 hover:text-fg"
                                          >
                                            {isCollapsed ? (
                                              <ChevronRight className="h-3.5 w-3.5" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                            {isCollapsed
                                              ? `Show thread (${descendantCount})`
                                              : "Hide thread"}
                                          </button>
                                        ) : null}
                                        {node.canDelete ? (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(node.id)}
                                            className="inline-flex items-center gap-1 text-muted hover:text-danger"
                                            title="Delete comment"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                          </button>
                                        ) : null}
                                      </div>
                                      {replyingToId === node.id
                                        ? renderCommentComposer(true, replyTarget?.userName)
                                        : null}
                                    </div>
                                  </div>
                                </div>
                                {hasChildren && !isCollapsed ? (
                                  <div className="mt-1 border-l border-border pl-1">
                                    {childComments.map((child) =>
                                      renderThread(child, depth + 1, nextPath)
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            );
                          };

                          return renderThread(comment, 0, new Set());
                        })
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="mt-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
                      {formError}
                    </div>
                  )}
                </>
              </div>

              {/* Sidebar */}
              <aside className="custom-scrollbar min-h-0 shrink-0 overflow-y-auto border-t border-border bg-surface-sunken px-4 py-5 lg:w-[300px] lg:border-l lg:border-t-0 lg:py-6">
                {detail ? (
                  <>
                    <SidebarField label="Status">
                      {canEdit ? (
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-border-hover bg-surface-2/90 px-3 py-2 text-[13px] font-medium text-fg focus:border-accent/40 focus:outline-none"
                        >
                          {statusSelectOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[14px] font-medium capitalize text-fg">
                          {resolveStatusLabel(detail.status)}
                        </p>
                      )}
                    </SidebarField>

                    {sprintPickerOptions && sprintPickerOptions.length > 0 && (
                      <SidebarField label="Sprint">
                        {canEdit ? (
                          <select
                            value={ticketSprintId}
                            onChange={(e) => setTicketSprintId(e.target.value)}
                            className="w-full cursor-pointer rounded-md border border-border-hover bg-surface-2/90 px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                          >
                            {sprintPickerOptions.map((o) => (
                              <option key={o.id === null ? "backlog" : o.id} value={o.id ?? ""}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[14px] text-muted2">
                            {sprintPickerOptions.find((o) => o.id === detail.sprintId)?.name ??
                              (detail.sprintId ? "Sprint" : "Backlog")}
                          </p>
                        )}
                      </SidebarField>
                    )}

                    <SidebarField label="Assignee">
                      {canEdit ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[11px] font-semibold text-muted2">
                            {initialsFromName(
                              assigneeId ? members.find((m) => m.userId === assigneeId)?.name : null
                            )}
                          </div>
                          <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="min-w-0 flex-1 cursor-pointer rounded-md border border-border-hover bg-surface-2/90 px-2 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
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
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[11px] font-semibold text-muted2">
                            {initialsFromName(detail.assigneeName)}
                          </div>
                          <span className="text-[14px] text-fg">
                            {detail.assigneeName ?? "Unassigned"}
                          </span>
                        </div>
                      )}
                    </SidebarField>

                    <SidebarField label="Reporter">
                      <p className="text-[14px] text-muted2">{detail.reporterName}</p>
                    </SidebarField>

                    <SidebarField label="Priority">
                      {canEdit ? (
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full cursor-pointer rounded-md border border-border-hover bg-surface-2/90 px-3 py-2 text-[13px] capitalize text-fg focus:border-accent/40 focus:outline-none"
                        >
                          {TICKET_PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {TICKET_PRIORITY_LABELS[p]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[14px] capitalize text-muted2">{detail.priority}</p>
                      )}
                    </SidebarField>

                    <SidebarField label="Type">
                      {canEdit ? (
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as TicketType)}
                          className="w-full cursor-pointer rounded-md border border-border-hover bg-surface-2/90 px-3 py-2 text-[13px] capitalize text-fg focus:border-accent/40 focus:outline-none"
                        >
                          {TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[14px] capitalize text-muted2">{detail.type}</p>
                      )}
                    </SidebarField>

                    <SidebarField label="Time log">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted" aria-hidden />
                        <p className="text-[13px] text-muted2">
                          Total{" "}
                          <span className="font-medium text-success">
                            {formatHoursParts(detail.totalLoggedHours ?? 0)}
                          </span>
                        </p>
                      </div>
                      {canEdit ? (
                        <>
                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const current = Number(logHours.replace(",", "."));
                                const safe = Number.isFinite(current) && current > 0 ? current : 1;
                                const next = Math.max(0.25, Math.round((safe - 0.25) * 4) / 4);
                                setLogHours(String(next));
                                setTimeLogError(null);
                              }}
                              className="rounded-md border border-border-hover px-2 py-1 text-[12px] text-muted2 hover:bg-hover"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min={0.25}
                              max={12}
                              step={0.25}
                              value={
                                Number.isFinite(Number(logHours.replace(",", "."))) &&
                                Number(logHours.replace(",", ".")) >= 0.25
                                  ? Number(logHours.replace(",", "."))
                                  : 1
                              }
                              onChange={(e) => {
                                setLogHours(e.target.value);
                                setTimeLogError(null);
                              }}
                              className="h-2 w-full cursor-pointer accent-accent"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = Number(logHours.replace(",", "."));
                                const safe = Number.isFinite(current) && current > 0 ? current : 1;
                                const next = Math.min(12, Math.round((safe + 0.25) * 4) / 4);
                                setLogHours(String(next));
                                setTimeLogError(null);
                              }}
                              className="rounded-md border border-border-hover px-2 py-1 text-[12px] text-muted2 hover:bg-hover"
                            >
                              +
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={logHours}
                              onChange={(e) => {
                                setLogHours(e.target.value);
                                setTimeLogError(null);
                              }}
                              placeholder="Hours"
                              className="min-w-0 flex-1 rounded-md border border-border-hover bg-surface-2/90 px-2.5 py-1.5 text-[12px] text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={logSubmitting || !logHours.trim()}
                              onClick={() => void handleLogTime()}
                              className="inline-flex items-center gap-1.5 rounded-md bg-accent/20 px-2.5 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/30 disabled:opacity-40"
                            >
                              {logSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                              Add
                            </button>
                          </div>
                          <input
                            type="text"
                            value={logNote}
                            onChange={(e) => setLogNote(e.target.value)}
                            placeholder="Optional note"
                            className="mt-2 w-full rounded-md border border-border bg-surface-2/70 px-2.5 py-1.5 text-[12px] text-muted2 placeholder:text-muted focus:border-accent/35 focus:outline-none"
                          />
                          {timeLogError ? (
                            <p className="mt-2 text-[11px] text-danger">{timeLogError}</p>
                          ) : (
                            <p className="mt-2 text-[11px] text-muted">
                              Adjust from the bar or type exact hours.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[12px] text-muted">You can view logged entries below.</p>
                      )}
                      {(detail.timeEntries?.length ?? 0) > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {(detail.timeEntries ?? []).slice(0, 3).map((entry) => (
                            <li
                              key={entry.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2/40 px-2 py-1.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[12px] text-muted2">{entry.userName}</p>
                                <p className="text-[10px] text-muted">
                                  {formatEntryTimestamp(entry.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-medium text-success">
                                  {formatHoursParts(entry.hours)}
                                </span>
                                {entry.canDelete ? (
                                  <button
                                    type="button"
                                    title="Remove log"
                                    disabled={deletingTimeEntryId === entry.id}
                                    onClick={() => setPendingDeleteEntryId(entry.id)}
                                    className="rounded p-1 text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                                  >
                                    {deletingTimeEntryId === entry.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </button>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[12px] text-muted">No time logs yet.</p>
                      )}
                    </SidebarField>

                    <SidebarField label="Due date">
                      {canEdit ? (
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full rounded-md border border-border-hover bg-surface-2/90 px-3 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
                        />
                      ) : (
                        <p className="text-[14px] text-muted2">
                          {detail.dueDate ? dueDateToInput(detail.dueDate) : "None"}
                        </p>
                      )}
                    </SidebarField>

                    <SidebarField label="Blocked by — do these first">
                      <p className="mb-2 text-[12px] leading-snug text-muted">
                        This ticket should start after its prerequisites are completed.
                      </p>
                      {canEdit && blockedDependencyOptions.length > 0 ? (
                        <div className="custom-scrollbar max-h-[180px] space-y-1.5 overflow-y-auto pr-0.5">
                          {blockedDependencyOptions.map((t) => (
                            <label
                              key={t.id}
                              className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-left transition-colors hover:bg-hover ${dependsOnIds.includes(t.id) ? "border-warning/25 bg-warning-soft" : "border-border"}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 rounded border-border-strong"
                                checked={dependsOnIds.includes(t.id)}
                                onChange={() => {
                                  setDependsOnIds((prev) =>
                                    prev.includes(t.id)
                                      ? prev.filter((x) => x !== t.id)
                                      : [...prev, t.id]
                                  );
                                }}
                              />
                              <span className="min-w-0">
                                <span className="font-mono text-[11px] text-muted">{t.key}</span>
                                <span className="mt-0.5 block text-[13px] text-fg line-clamp-2">
                                  {t.title}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <>
                          {openDependencies.length > 0 ? (
                            <ul className="space-y-1">
                              {openDependencies.map((l) => (
                                <li
                                  key={l.id}
                                  className={`flex flex-col rounded-md border border-border px-2 py-1.5 ${l.status !== "done" ? "border-warning/15 bg-warning-soft" : ""}`}
                                >
                                  <span className="font-mono text-[11px] text-muted">{l.key}</span>
                                  <span className="text-[13px] text-fg line-clamp-2">
                                    {l.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[14px] text-muted">None</p>
                          )}
                        </>
                      )}
                    </SidebarField>

                    <SidebarField label="Blocks">
                      {(detail?.blocks?.length ?? 0) > 0 ? (
                        <ul className="space-y-1">
                          {detail!.blocks!.map((l) => (
                            <li
                              key={l.id}
                              className="flex flex-col rounded-md border border-border px-2 py-1.5"
                            >
                              <span className="font-mono text-[11px] text-muted">{l.key}</span>
                              <span className="text-[13px] text-muted2 line-clamp-2">
                                {l.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[14px] text-muted">Nothing is waiting on this ticket</p>
                      )}
                    </SidebarField>

                    <SidebarField label="Labels">
                      <button type="button" disabled className="text-left text-[14px] text-muted">
                        None
                      </button>
                    </SidebarField>

                    <p className="pt-2 text-[11px] leading-relaxed text-muted">
                      Created {new Date(detail.createdAt).toLocaleString()}
                      <br />
                      Updated {new Date(detail.updatedAt).toLocaleString()}
                    </p>
                  </>
                ) : null}
              </aside>
            </div>
          ) : null}

          {canEdit && dirty && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-surface-sunken px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-[13px] font-medium text-muted2 hover:bg-hover hover:text-fg disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 rounded-lg bg-fg px-5 py-2 text-[13px] font-semibold text-bg hover:bg-fg-strong disabled:opacity-40"
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

      <ConfirmDialog
        isOpen={pendingDeleteEntryId !== null}
        onClose={() => setPendingDeleteEntryId(null)}
        title="Remove this time log?"
        description="This removes the logged hours from this ticket."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void executeDeleteTimeEntry()}
      />

      <ConfirmDialog
        isOpen={pendingDeleteCommentId !== null}
        onClose={() => setPendingDeleteCommentId(null)}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeDeleteComment}
      />
    </>
  );
}
