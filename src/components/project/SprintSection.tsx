"use client";

import { useState, useEffect, type DragEvent } from "react";
import type { ProjectMember, ProjectTicket, SprintGroup } from "@/lib/projects-api";
import TicketItem, { TICKET_DRAG_MIME } from "./TicketItem";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  MoreHorizontal,
  Play,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Flag,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface TicketMoveOption {
  sprintId: string | null;
  label: string;
}

interface SprintSectionProps {
  sprint: SprintGroup;
  isBacklog?: boolean;
  onCreateTask?: () => void;
  onTicketSelect?: (_ticket: ProjectTicket) => void;
  onStartSprint?: (_sprintId: string) => void;
  onCompleteSprint?: (_sprintId: string) => void;
  onDeleteSprint?: (_sprintId: string) => void;
  ticketMoveOptions?: TicketMoveOption[];
  onMoveTicket?: (_ticketId: string, _sprintId: string | null) => void | Promise<void>;
  members?: ProjectMember[];
  statusOptions?: { value: string; label: string }[];
  canEditTickets?: boolean;
  onStatusChange?: (_ticketId: string, _status: string) => void | Promise<void>;
  onAssigneeChange?: (_ticketId: string, _assigneeId: string | null) => void | Promise<void>;
  /** When true, tickets can be dragged to another section that accepts drops. */
  enableTicketDrag?: boolean;
  /** When set, dropping a ticket onto this section runs the handler (target sprint is implicit). */
  onTicketDrop?: (_ticketId: string) => void | Promise<void>;
}

export default function SprintSection({
  sprint,
  isBacklog,
  onCreateTask,
  onTicketSelect,
  onStartSprint,
  onCompleteSprint,
  onDeleteSprint,
  ticketMoveOptions = [],
  onMoveTicket,
  members = [],
  statusOptions = [],
  canEditTickets = false,
  onStatusChange,
  onAssigneeChange,
  enableTicketDrag = false,
  onTicketDrop,
}: SprintSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropHighlight, setDropHighlight] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "complete" | "delete";
    sprintId: string;
    sprintName: string;
  }>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPoints = sprint.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const doneTickets = sprint.tickets.filter((t) => t.status === "done").length;

  const statusBadgeClass =
    sprint.status === "active"
      ? "bg-success-soft text-success border border-success/10"
      : sprint.status === "completed"
        ? "bg-hover text-muted2 border border-border"
        : "bg-accent-soft text-accent border border-accent/10";

  const showMove = Boolean(onMoveTicket && ticketMoveOptions.length > 0);
  const dropEnabled = Boolean(onTicketDrop);

  const hasTicketPayload = (e: DragEvent) => [...e.dataTransfer.types].includes(TICKET_DRAG_MIME);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!dropEnabled) return;
    if (!hasTicketPayload(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!dropEnabled) return;
    if (!hasTicketPayload(e)) return;
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
    if (!ticketId) return;
    void onTicketDrop(ticketId);
  };

  return (
    <>
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
            )}

            <span className="text-[13px] font-semibold text-fg truncate">
              {isBacklog ? "Backlog" : sprint.name}
            </span>

            {!isBacklog && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadgeClass}`}
              >
                {sprint.status}
              </span>
            )}

            <span className="text-[11px] text-muted shrink-0">
              {sprint.tickets.length} {sprint.tickets.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {!isBacklog && sprint.startDate && mounted && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <Calendar className="w-3 h-3 text-muted" />
                {new Date(sprint.startDate + "T12:00:00Z").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {" — "}
                {new Date((sprint.endDate ?? sprint.startDate) + "T12:00:00Z").toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}
              </div>
            )}

            {!isBacklog && (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1 text-[11px] text-muted"
                  title="Story Points"
                >
                  <Clock className="w-3 h-3 text-muted" />
                  {totalPoints} pts
                </div>
                <div className="flex items-center gap-1 text-[11px] text-success" title="Completed">
                  <CheckCircle2 className="w-3 h-3" />
                  {doneTickets}/{sprint.tickets.length}
                </div>
              </div>
            )}

            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {!isBacklog && sprint.status === "planning" && onStartSprint && (
                <button
                  type="button"
                  onClick={() => onStartSprint(sprint.id)}
                  className="px-2.5 py-1 bg-accent/10 hover:bg-accent/15 text-[11px] font-medium text-accent border border-accent/20 rounded-md transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Start
                </button>
              )}
              {!isBacklog && sprint.status === "active" && onCompleteSprint && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      type: "complete",
                      sprintId: sprint.id,
                      sprintName: sprint.name,
                    })
                  }
                  className="px-2.5 py-1 bg-success/10 hover:bg-success/15 text-[11px] font-medium text-success border border-success/20 rounded-md transition-colors flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" />
                  Complete
                </button>
              )}
              {!isBacklog && sprint.status === "planning" && onDeleteSprint && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="p-1 text-muted hover:text-muted2 hover:bg-hover rounded-md transition-all"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-[5] cursor-default bg-transparent"
                        aria-label="Close menu"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border border-border bg-surface-hover py-1 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setConfirmAction({
                              type: "delete",
                              sprintId: sprint.id,
                              sprintName: sprint.name,
                            });
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-danger hover:bg-hover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete sprint
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isBacklog && sprint.goal?.trim() && isExpanded && (
          <div className="border-x border-border border-t-0 bg-surface-sunken px-4 py-2 text-[12px] text-muted">
            <span className="font-medium text-muted2">Goal: </span>
            {sprint.goal}
          </div>
        )}

        {isExpanded && (
          <div className="border-x border-b border-border bg-surface-sunken rounded-b-lg overflow-hidden">
            {sprint.tickets.length > 0 ? (
              sprint.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-stretch border-b border-border last:border-b-0"
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
                    />
                  </div>
                  {showMove && (
                    <div
                      className="flex shrink-0 items-center border-l border-border bg-surface-sunken px-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <label className="sr-only" htmlFor={`move-${ticket.id}`}>
                        Move ticket
                      </label>
                      <select
                        id={`move-${ticket.id}`}
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v || !onMoveTicket) return;
                          const next = v === "__backlog__" ? null : v;
                          void onMoveTicket(ticket.id, next);
                          e.target.selectedIndex = 0;
                        }}
                        className="max-w-[120px] cursor-pointer rounded border border-border bg-surface-2/80 py-1 pl-1.5 pr-1 text-[10px] text-muted2 focus:border-accent/30 focus:outline-none"
                      >
                        <option value="">Move…</option>
                        {ticketMoveOptions.map((opt) => (
                          <option
                            key={opt.sprintId === null ? "__backlog__" : opt.sprintId}
                            value={opt.sprintId === null ? "__backlog__" : opt.sprintId}
                          >
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
                No tasks yet. Add tickets from the backlog or create one here.
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateTask?.();
              }}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-[12px] text-muted transition-all hover:bg-hover hover:text-muted2"
            >
              <Plus className="w-3 h-3" />
              Create task
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "complete"
            ? `Complete “${confirmAction.sprintName}”?`
            : confirmAction?.type === "delete"
              ? `Delete “${confirmAction?.sprintName}”?`
              : ""
        }
        description={
          confirmAction?.type === "complete" ? (
            <>
              Incomplete tickets move to the <strong className="text-muted2">backlog</strong>. Done
              tickets stay on this sprint for history.
            </>
          ) : confirmAction?.type === "delete" ? (
            <>
              This planned sprint will be removed. Tickets in it return to the{" "}
              <strong className="text-muted2">backlog</strong>.
            </>
          ) : null
        }
        confirmLabel={confirmAction?.type === "complete" ? "Complete sprint" : "Delete sprint"}
        cancelLabel="Cancel"
        variant={confirmAction?.type === "delete" ? "danger" : "default"}
        onConfirm={async () => {
          if (!confirmAction) return;
          if (confirmAction.type === "complete") {
            await onCompleteSprint?.(confirmAction.sprintId);
          } else {
            await onDeleteSprint?.(confirmAction.sprintId);
          }
        }}
      />
    </>
  );
}
