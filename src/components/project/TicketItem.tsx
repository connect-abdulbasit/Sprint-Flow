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
  Link2,
  GripVertical,
  ChevronDown,
  User,
  Check,
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
};

const STATUS_PILL: Record<string, string> = {
  todo: "bg-hover text-muted2 border-border",
  in_progress: "bg-accent-soft text-accent border-accent/25",
  review: "bg-accent2/15 text-accent2 border-accent2/25",
  done: "bg-success-soft text-success border-success/25",
};

function statusPillClass(status: string) {
  return STATUS_PILL[status] ?? "bg-accent-soft text-accent border-accent/25";
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
}: {
  ticket: ProjectTicket;
  onSelect?: (_ticket: ProjectTicket) => void;
  draggableTicketId?: string;
  members?: ProjectMember[];
  statusOptions?: StatusOption[];
  canEdit?: boolean;
  onStatusChange?: (_ticketId: string, _status: string) => void | Promise<void>;
  onAssigneeChange?: (_ticketId: string, _assigneeId: string | null) => void | Promise<void>;
}) {
  const suppressClickRef = useRef(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  const priority =
    priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
  const type = typeConfig[ticket.type];
  const PriorityIcon = priority.icon;
  const TypeIcon = type.icon;
  const isDraggable = Boolean(draggableTicketId);

  const assigneeMember = members.find((m) => m.userId === ticket.assigneeId);
  const statusLabel =
    statusOptions.find((o) => o.value === ticket.status)?.label ?? ticket.status.replace(/_/g, " ");

  useEffect(() => {
    if (!assigneeOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [assigneeOpen]);

  const stopRowClick = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2 transition-all hover:bg-hover"
      draggable={isDraggable}
      onDragStart={(e) => {
        if (!draggableTicketId) return;
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
        if (suppressClickRef.current) return;
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
        <div className="w-6 h-6 rounded bg-surface-2/80 flex items-center justify-center text-[10px] font-medium text-muted shrink-0">
          {ticket.storyPoints}
        </div>
      ) : (
        <div className="w-6 shrink-0" />
      )}

      {/* Status — Jira-style inline */}
      <div className="shrink-0" onClick={stopRowClick}>
        {canEdit && onStatusChange && statusOptions.length > 0 ? (
          <div className="relative">
            <select
              value={ticket.status}
              onChange={(e) => void onStatusChange(ticket.id, e.target.value)}
              aria-label={`Status for ${ticket.key}`}
              className={`appearance-none cursor-pointer rounded-md border pl-2.5 pr-7 py-1 text-[11px] font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-accent/25 ${statusPillClass(ticket.status)}`}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
          </div>
        ) : (
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusPillClass(ticket.status)}`}
          >
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
              onClick={() => setAssigneeOpen((v) => !v)}
              title={ticket.assigneeName ?? "Assign"}
              aria-label={`Assignee for ${ticket.key}`}
              aria-expanded={assigneeOpen}
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-accent-soft text-accent transition-colors hover:border-accent/40 hover:ring-2 hover:ring-accent/20"
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
              <div className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-border-hover bg-surface-hover py-1 shadow-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeOpen(false);
                    void onAssigneeChange(ticket.id, null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-muted2 hover:bg-hover transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-hover">
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
                      className="h-7 w-7 border border-border bg-accent-soft text-[9px] font-semibold text-accent"
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
            className="h-7 w-7 border border-border bg-accent-soft text-[9px] font-semibold text-accent"
            title={ticket.assigneeName ?? "Unassigned"}
          />
        )}
      </div>
    </div>
  );
}
