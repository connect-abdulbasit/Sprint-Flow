"use client";

import { useState, type DragEvent } from "react";
import Link from "next/link";
import type { Epic, ProjectMember, ProjectTicket } from "@/lib/projects-api";
import TicketItem, { TICKET_DRAG_MIME } from "./TicketItem";
import { ProgressBar } from "./detail/ProgressRing";
import { ChevronDown, ChevronRight, Milestone } from "lucide-react";
import {
  EPIC_COLOR_DOT_CLASS,
  EPIC_ICON_COMPONENT,
  type EpicColor,
  type EpicIcon,
} from "@/lib/epic-style";

export interface TicketEpicMoveOption {
  epicId: string | null;
  label: string;
}

interface EpicSectionProps {
  /** Omitted when `isNoEpic` is true. */
  epic?: Epic;
  tickets: ProjectTicket[];
  isNoEpic?: boolean;
  epicHref?: string;
  onCreateTask?: () => void;
  onTicketSelect?: (_ticket: ProjectTicket) => void;
  ticketMoveOptions?: TicketEpicMoveOption[];
  onMoveTicket?: (_ticketId: string, _epicId: string | null) => void | Promise<void>;
  members?: ProjectMember[];
  statusOptions?: { value: string; label: string }[];
  canEditTickets?: boolean;
  onStatusChange?: (_ticketId: string, _status: string) => void | Promise<void>;
  onAssigneeChange?: (_ticketId: string, _assigneeId: string | null) => void | Promise<void>;
  enableTicketDrag?: boolean;
  onTicketDrop?: (_ticketId: string) => void | Promise<void>;
  selectedIds?: Set<string>;
  onToggleSelect?: (_ticketId: string) => void;
}

/** Backlog's "Group by Epic" section — structurally mirrors SprintSection
 * (collapse, drag-drop, "Move…" select) but with epic progress instead of a
 * sprint lifecycle. */
export default function EpicSection({
  epic,
  tickets,
  isNoEpic,
  epicHref,
  onCreateTask,
  onTicketSelect,
  ticketMoveOptions = [],
  onMoveTicket,
  members = [],
  statusOptions = [],
  canEditTickets = false,
  onStatusChange,
  onAssigneeChange,
  enableTicketDrag = false,
  onTicketDrop,
  selectedIds,
  onToggleSelect,
}: EpicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dropHighlight, setDropHighlight] = useState(false);

  const doneTickets = tickets.filter((t) => t.status === "done").length;
  const progressPercent = tickets.length ? Math.round((100 * doneTickets) / tickets.length) : 0;
  const showMove = Boolean(onMoveTicket && ticketMoveOptions.length > 0);
  const dropEnabled = Boolean(onTicketDrop);

  const IconComponent =
    !isNoEpic && epic?.icon ? EPIC_ICON_COMPONENT[epic.icon as EpicIcon] : Milestone;
  const dotClass =
    !isNoEpic && epic?.color ? EPIC_COLOR_DOT_CLASS[epic.color as EpicColor] : "bg-muted";

  const hasTicketPayload = (e: DragEvent) => [...e.dataTransfer.types].includes(TICKET_DRAG_MIME);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!dropEnabled || !hasTicketPayload(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!dropEnabled || !hasTicketPayload(e)) return;
    e.preventDefault();
    setDropHighlight(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!dropEnabled) return;
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setDropHighlight(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!dropEnabled || !onTicketDrop) return;
    e.preventDefault();
    setDropHighlight(false);
    const ticketId = e.dataTransfer.getData(TICKET_DRAG_MIME);
    if (ticketId) void onTicketDrop(ticketId);
  };

  return (
    <div
      className={`mb-3 last:mb-0 rounded-lg transition-shadow ${
        dropHighlight ? "ring-2 ring-accent/35 ring-offset-0 ring-offset-surface-sunken" : ""
      }`}
      onDragOver={dropEnabled ? handleDragOver : undefined}
      onDragEnter={dropEnabled ? handleDragEnter : undefined}
      onDragLeave={dropEnabled ? handleDragLeave : undefined}
      onDrop={dropEnabled ? handleDrop : undefined}
    >
      <div
        className="group flex cursor-pointer items-center gap-3 rounded-t-lg border border-border bg-surface px-4 py-2.5 transition-all hover:bg-surface-hover"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
          )}
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-white ${dotClass}`}
          >
            <IconComponent className="h-3 w-3" />
          </span>
          {epicHref && !isNoEpic && epic ? (
            <Link
              href={epicHref}
              onClick={(e) => e.stopPropagation()}
              className="truncate text-[13px] font-semibold text-fg hover:text-accent hover:underline"
            >
              {epic.name}
            </Link>
          ) : (
            <span className="truncate text-[13px] font-semibold text-fg">
              {isNoEpic ? "No epic" : (epic?.name ?? "")}
            </span>
          )}
          <span className="shrink-0 text-[11px] text-muted">
            {tickets.length} {tickets.length === 1 ? "task" : "tasks"}
          </span>
        </div>
        <div className="w-28 shrink-0">
          <ProgressBar percent={progressPercent} />
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-visible rounded-b-lg border-x border-b border-border bg-surface-sunken">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="relative flex items-stretch border-b border-border last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <TicketItem
                    ticket={ticket}
                    onSelect={onTicketSelect}
                    draggableTicketId={enableTicketDrag ? ticket.id : undefined}
                    members={members}
                    statusOptions={statusOptions}
                    canEdit={canEditTickets}
                    onStatusChange={onStatusChange}
                    onAssigneeChange={onAssigneeChange}
                    selectable={Boolean(selectedIds)}
                    selected={selectedIds?.has(ticket.id) ?? false}
                    onToggleSelect={onToggleSelect}
                  />
                </div>
                {showMove && (
                  <div
                    className="flex shrink-0 items-center border-l border-border bg-surface-sunken px-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <label className="sr-only" htmlFor={`move-epic-${ticket.id}`}>
                      Move to epic
                    </label>
                    <select
                      id={`move-epic-${ticket.id}`}
                      defaultValue=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v || !onMoveTicket) return;
                        const next = v === "__none__" ? null : v;
                        void onMoveTicket(ticket.id, next);
                        e.target.selectedIndex = 0;
                      }}
                      className="max-w-[130px] cursor-pointer rounded border border-border bg-surface-2/80 py-1 pl-1.5 pr-1 text-[10px] text-muted2 focus:border-accent/30 focus:outline-none"
                    >
                      <option value="">Move…</option>
                      {ticketMoveOptions.map((opt) => (
                        <option key={opt.epicId ?? "__none__"} value={opt.epicId ?? "__none__"}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-[12px] text-muted">
              No tasks in this epic yet.
            </div>
          )}
          {onCreateTask && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateTask();
              }}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-[12px] text-muted transition-all hover:bg-hover hover:text-muted2"
            >
              Create task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
