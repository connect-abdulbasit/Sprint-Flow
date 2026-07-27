"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Layers, ChevronDown, User, Check, X } from "lucide-react";
import UserAvatar from "@/components/ui/user-avatar";
import type { Epic, ProjectMember } from "@/lib/projects-api";

export type GroupBy = "none" | "assignee" | "priority" | "type" | "epic";

const TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: "feature", label: "Feature" },
  { id: "bug", label: "Bug" },
  { id: "task", label: "Task" },
  { id: "improvement", label: "Improvement" },
];

const PRIORITY_OPTIONS: { id: string; label: string }[] = [
  { id: "urgent", label: "Urgent" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const GROUP_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: "none", label: "None" },
  { id: "assignee", label: "Assignee" },
  { id: "priority", label: "Priority" },
  { id: "type", label: "Type" },
  { id: "epic", label: "Epic" },
];

// Deterministic accent per assignee — semantic tokens stay vivid in light & dark.
const AVATAR_COLORS = [
  "bg-accent-soft text-accent",
  "bg-accent2/15 text-accent2",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-info-soft text-info",
  "bg-danger-soft text-danger",
];

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function assigneeAvatarClasses(selected: boolean, hasPhoto: boolean, userId: string) {
  const base =
    "relative -mr-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 transition-all duration-150 hover:z-20 hover:-translate-y-0.5";

  if (selected) {
    return `${base} z-10 scale-110 ring-accent ring-offset-2 ring-offset-surface-sunken shadow-[0_0_12px_var(--color-accent-soft)]`;
  }

  if (hasPhoto) {
    return `${base} ring-border hover:ring-accent/45 hover:scale-105`;
  }

  return `${base} ${colorForId(userId)} ring-transparent hover:ring-accent/35 hover:scale-105`;
}

interface BoardToolbarProps {
  search: string;
  onSearchChange: (_value: string) => void;
  members: ProjectMember[];
  assigneeFilter: string[];
  onToggleAssignee: (_id: string) => void;
  typeFilter: string[];
  priorityFilter: string[];
  onToggleType: (_type: string) => void;
  onTogglePriority: (_priority: string) => void;
  epics?: Epic[];
  epicFilter?: string[];
  onToggleEpic?: (_epicId: string) => void;
  groupBy: GroupBy;
  onGroupByChange: (_group: GroupBy) => void;
  onClearFilters: () => void;
}

const MAX_VISIBLE_AVATARS = 5;

export default function BoardToolbar({
  search,
  onSearchChange,
  members,
  assigneeFilter,
  onToggleAssignee,
  typeFilter,
  priorityFilter,
  onToggleType,
  onTogglePriority,
  epics = [],
  epicFilter = [],
  onToggleEpic,
  groupBy,
  onGroupByChange,
  onClearFilters,
}: BoardToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const activeFilterCount = typeFilter.length + priorityFilter.length + epicFilter.length;
  const hasAnyActive =
    activeFilterCount > 0 || assigneeFilter.length > 0 || search.trim().length > 0;

  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.length - visibleMembers.length;
  const groupLabel = GROUP_OPTIONS.find((g) => g.id === groupBy)?.label ?? "None";

  return (
    <div className="shrink-0 bg-surface-sunken px-6 pt-4">
      <div className="flex flex-wrap items-center gap-3 max-w-[1600px] mx-auto">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search board"
            aria-label="Search board"
            className="w-[220px] rounded-lg border border-border bg-hover pl-9 pr-3 py-2 text-[13px] text-fg placeholder-muted focus:outline-none focus:border-accent/50 focus:bg-hover-strong transition-all"
          />
        </div>

        {/* Assignee avatars */}
        <div className="flex items-center pr-1">
          {(() => {
            const selected = assigneeFilter.includes("unassigned");
            return (
              <button
                type="button"
                onClick={() => onToggleAssignee("unassigned")}
                title="Unassigned"
                aria-pressed={selected}
                className={`relative -mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent ring-2 transition-all duration-150 hover:z-20 hover:-translate-y-0.5 ${
                  selected
                    ? "z-10 scale-110 ring-accent ring-offset-2 ring-offset-surface-sunken shadow-[0_0_12px_var(--color-accent-soft)]"
                    : "ring-border hover:ring-accent/45 hover:scale-105"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                {selected && <SelectedTick />}
              </button>
            );
          })()}
          {visibleMembers.map((m) => {
            const selected = assigneeFilter.includes(m.userId);
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => onToggleAssignee(m.userId)}
                title={m.name || m.email}
                aria-pressed={selected}
                className={assigneeAvatarClasses(selected, Boolean(m.avatarUrl), m.userId)}
              >
                <UserAvatar
                  name={m.name}
                  email={m.email}
                  avatarUrl={m.avatarUrl}
                  size="sm"
                  className="h-full w-full bg-transparent text-inherit"
                />
                {selected && <SelectedTick />}
              </button>
            );
          })}
          {overflow > 0 && (
            <span className="relative -mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent ring-2 ring-border">
              +{overflow}
            </span>
          )}
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => {
              setFilterOpen((v) => !v);
              setGroupOpen(false);
            }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
              filterOpen || activeFilterCount > 0
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-hover text-muted2 hover:bg-hover"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-xl border border-border-hover bg-surface-hover p-3 shadow-lg">
              <FilterGroup
                title="Type"
                options={TYPE_OPTIONS}
                selected={typeFilter}
                onToggle={onToggleType}
              />
              <div className="my-2 h-px bg-hover-strong" />
              <FilterGroup
                title="Priority"
                options={PRIORITY_OPTIONS}
                selected={priorityFilter}
                onToggle={onTogglePriority}
              />
              {epics.length > 0 && onToggleEpic && (
                <>
                  <div className="my-2 h-px bg-hover-strong" />
                  <FilterGroup
                    title="Epic"
                    options={epics.map((e) => ({ id: e.id, label: e.name }))}
                    selected={epicFilter}
                    onToggle={onToggleEpic}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Group dropdown */}
        <div className="relative" ref={groupRef}>
          <button
            type="button"
            onClick={() => {
              setGroupOpen((v) => !v);
              setFilterOpen(false);
            }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
              groupOpen || groupBy !== "none"
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-hover text-muted2 hover:bg-hover"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Group{groupBy !== "none" ? `: ${groupLabel}` : ""}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {groupOpen && (
            <div className="absolute left-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-border-hover bg-surface-hover p-1.5 shadow-lg">
              {GROUP_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onGroupByChange(opt.id);
                    setGroupOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                    groupBy === opt.id
                      ? "bg-hover-strong text-fg"
                      : "text-muted2 hover:bg-hover hover:text-fg"
                  }`}
                >
                  {opt.label}
                  {groupBy === opt.id && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasAnyActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted hover:text-muted2 hover:bg-hover transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function SelectedTick() {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent ring-2 ring-surface-sunken">
      <Check className="h-2 w-2 text-white" strokeWidth={3.5} />
    </span>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (_id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <div className="space-y-0.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] text-muted2 hover:bg-hover transition-colors"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border-strong bg-transparent"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
