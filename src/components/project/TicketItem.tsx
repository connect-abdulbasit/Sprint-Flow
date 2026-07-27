"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectMember, ProjectTicket } from "@/lib/projects-api";
import UserAvatar from "@/components/ui/user-avatar";
import {
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Bug,
  Zap,
  PlusCircle,
  BookOpen,
  Link2,
  GripVertical,
  ChevronDown,
  User,
  Check,
  Circle,
  Loader2,
  Eye,
  CheckCircle2,
} from "lucide-react";

export const TICKET_DRAG_MIME = "application/x-sprintflow-ticket";

const priorityConfig = {
  low: { icon: ArrowDown, color: "text-muted", bg: "bg-hover", label: "Low" },
  medium: { icon: Minus, color: "text-accent", bg: "bg-accent-soft", label: "Medium" },
  high: { icon: ArrowUp, color: "text-warning", bg: "bg-warning-soft", label: "High" },
  urgent: { icon: AlertCircle, color: "text-danger", bg: "bg-danger-soft", label: "Urgent" },
};

const typeConfig = {
  task: { icon: FileText, color: "text-accent", label: "Task" },
  bug: { icon: Bug, color: "text-danger", label: "Bug" },
  feature: { icon: Zap, color: "text-accent2", label: "Feature" },
  improvement: { icon: PlusCircle, color: "text-success", label: "Improvement" },
  story: { icon: BookOpen, color: "text-accent2", label: "Story" },
};

const STATUS_STYLE: Record<string, { pill: string; icon: typeof Circle; iconClass: string }> = {
  todo: {
    pill: "bg-info-soft text-info border-info/30",
    icon: Circle,
    iconClass: "text-info",
  },
  in_progress: {
    pill: "bg-accent-soft text-accent border-accent/35",
    icon: Loader2,
    iconClass: "text-accent",
  },
  review: {
    pill: "bg-accent2/15 text-accent2 border-accent2/35",
    icon: Eye,
    iconClass: "text-accent2",
  },
  done: {
    pill: "bg-success-soft text-success border-success/35",
    icon: CheckCircle2,
    iconClass: "text-success",
  },
};

function statusStyle(status: string) {
  return (
    STATUS_STYLE[status] ?? {
      pill: "bg-accent-soft text-accent border-accent/35",
      icon: Circle,
      iconClass: "text-accent",
    }
  );
}

type StatusOption = { value: string; label: string };

export default function TicketItem({
  ticket,
  onSelect,
  draggableTicketId,
  members = [],
  statusOptions = [],
  canEdit = false,
  onStatusChange,
  onAssigneeChange,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  ticket: ProjectTicket;
  onSelect?: (_ticket: ProjectTicket) => void;
  draggableTicketId?: string;
  members?: ProjectMember[];
  statusOptions?: StatusOption[];
  canEdit?: boolean;
  onStatusChange?: (_ticketId: string, _status: string) => void | Promise<void>;
  onAssigneeChange?: (_ticketId: string, _assigneeId: string | null) => void | Promise<void>;
  /** Shows a bulk-select checkbox at the start of the row (Backlog/Epic List). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (_ticketId: string) => void;
}) {
  const suppressClickRef = useRef(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  const priority =
    priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
  const type = typeConfig[ticket.type];
  const PriorityIcon = priority.icon;
  const TypeIcon = type.icon;
  const isDraggable = Boolean(draggableTicketId);

  const assigneeMember = members.find((m) => m.userId === ticket.assigneeId);
  const currentStatus = statusStyle(ticket.status);
  const StatusIcon = currentStatus.icon;
  const statusLabel =
    statusOptions.find((o) => o.value === ticket.status)?.label ?? ticket.status.replace(/_/g, " ");

  useEffect(() => {
    if (!statusOpen && !assigneeOpen) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (statusRef.current && !statusRef.current.contains(target)) setStatusOpen(false);
      if (assigneeRef.current && !assigneeRef.current.contains(target)) setAssigneeOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [statusOpen, assigneeOpen]);

  const stopRowClick = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2 transition-all hover:bg-hover ${
        statusOpen || assigneeOpen ? "relative z-30 bg-hover" : ""
      }`}
      draggable={isDraggable && !statusOpen && !assigneeOpen}
      onDragStart={(e) => {
        if (!draggableTicketId || statusOpen || assigneeOpen) return;
        e.dataTransfer.setData(TICKET_DRAG_MIME, draggableTicketId);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (suppressClickRef.current || statusOpen || assigneeOpen) return;
        onSelect?.(ticket);
      }}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(ticket);
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
    >
      {selectable ? (
        <input
          type="checkbox"
          checked={selected}
          onClick={stopRowClick}
          onChange={() => onToggleSelect?.(ticket.id)}
          className="shrink-0 rounded border-border-strong"
          aria-label={`Select ${ticket.title}`}
        />
      ) : null}

      {isDraggable ? (
        <span
          className="shrink-0 cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-hidden
          onClick={stopRowClick}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      ) : null}

      <span className="text-[11px] font-mono text-muted w-[68px] shrink-0 group-hover:text-muted2 transition-colors">
        {ticket.key}
      </span>

      <span className="text-[13px] text-muted2 flex-1 truncate group-hover:text-fg transition-colors min-w-0">
        {ticket.title}
      </span>

      {ticket.blockedByOpenDependencies ? (
        <span className="flex shrink-0 text-warning" title="Waiting on linked tickets not done yet">
          <Link2 className="h-3 w-3" aria-hidden />
        </span>
      ) : null}

      <div className="flex items-center gap-1 shrink-0">
        <TypeIcon className={`w-3 h-3 ${type.color}`} />
        <span className={`text-[10px] font-medium ${type.color}`}>{type.label}</span>
      </div>

      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${priority.bg} ${priority.color}`}
      >
        <PriorityIcon className="w-3 h-3" />
        {priority.label}
      </div>

      {ticket.storyPoints !== null && ticket.storyPoints !== undefined ? (
        <div className="w-6 h-6 rounded bg-accent-soft flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
          {ticket.storyPoints}
        </div>
      ) : (
        <div className="w-6 shrink-0" />
      )}

      {/* Status — Jira-style colored picker */}
      <div className="relative shrink-0" ref={statusRef} onClick={stopRowClick}>
        {canEdit && onStatusChange && statusOptions.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => {
                setAssigneeOpen(false);
                setStatusOpen((v) => !v);
              }}
              aria-label={`Status for ${ticket.key}`}
              aria-expanded={statusOpen}
              className={`inline-flex items-center gap-1.5 rounded-md border pl-2 pr-1.5 py-1 text-[11px] font-semibold capitalize transition-colors hover:brightness-110 ${currentStatus.pill}`}
            >
              <StatusIcon className={`h-3 w-3 ${currentStatus.iconClass}`} />
              {statusLabel}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-border-hover bg-surface p-1.5 shadow-dropdown">
                {statusOptions.map((opt) => {
                  const style = statusStyle(opt.value);
                  const Icon = style.icon;
                  const selected = ticket.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatusOpen(false);
                        if (opt.value !== ticket.status) void onStatusChange(ticket.id, opt.value);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] font-medium capitalize transition-colors hover:bg-hover ${
                        selected ? "bg-hover" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${style.pill}`}
                      >
                        <Icon className={`h-3 w-3 ${style.iconClass}`} />
                        {opt.label}
                      </span>
                      {selected && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold capitalize ${currentStatus.pill}`}
          >
            <StatusIcon className={`h-3 w-3 ${currentStatus.iconClass}`} />
            {statusLabel}
          </span>
        )}
      </div>

      {/* Assignee — Jira-style avatar picker */}
      <div className="relative shrink-0" ref={assigneeRef} onClick={stopRowClick}>
        {canEdit && onAssigneeChange ? (
          <>
            <button
              type="button"
              onClick={() => {
                setStatusOpen(false);
                setAssigneeOpen((v) => !v);
              }}
              title={ticket.assigneeName ?? "Assign"}
              aria-label={`Assignee for ${ticket.key}`}
              aria-expanded={assigneeOpen}
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-accent/40 bg-accent-soft text-accent transition-colors hover:border-accent hover:ring-2 hover:ring-accent/25"
            >
              {ticket.assigneeId ? (
                <UserAvatar
                  name={assigneeMember?.name ?? ticket.assigneeName}
                  email={assigneeMember?.email}
                  avatarUrl={assigneeMember?.avatarUrl}
                  size="sm"
                  className="h-full w-full border-0 bg-transparent text-[9px] font-semibold text-inherit"
                />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </button>

            {assigneeOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border-hover bg-surface py-1 shadow-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeOpen(false);
                    void onAssigneeChange(ticket.id, null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-muted2 hover:bg-hover transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/30 bg-accent-soft text-accent">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  Unassigned
                  {!ticket.assigneeId && <Check className="ml-auto h-3.5 w-3.5 text-accent" />}
                </button>
                <div className="my-1 h-px bg-border" />
                {members.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => {
                      setAssigneeOpen(false);
                      void onAssigneeChange(ticket.id, m.userId);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-fg hover:bg-hover transition-colors"
                  >
                    <UserAvatar
                      name={m.name}
                      email={m.email}
                      avatarUrl={m.avatarUrl}
                      size="sm"
                      className="h-7 w-7 border border-accent/30 bg-accent-soft text-[9px] font-semibold text-accent"
                    />
                    <span className="truncate">{m.name}</span>
                    {ticket.assigneeId === m.userId && (
                      <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <UserAvatar
            name={ticket.assigneeName}
            avatarUrl={assigneeMember?.avatarUrl}
            size="sm"
            className="h-7 w-7 border-2 border-accent/40 bg-accent-soft text-[9px] font-semibold text-accent"
            title={ticket.assigneeName ?? "Unassigned"}
          />
        )}
      </div>
    </div>
  );
}
