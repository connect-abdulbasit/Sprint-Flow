"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Layers, ChevronDown, User, Check, X } from "lucide-react";
import { initialsFromName } from "@/lib/initials";
import type { ProjectMember } from "@/lib/projects-api";

export type GroupBy = "none" | "assignee" | "priority" | "type";

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
];

// A deterministic accent per assignee avatar, so the same person keeps a stable color.
const AVATAR_COLORS = [
  "bg-blue-500/25 text-blue-200",
  "bg-violet-500/25 text-violet-200",
  "bg-emerald-500/25 text-emerald-200",
  "bg-amber-500/25 text-amber-200",
  "bg-rose-500/25 text-rose-200",
  "bg-cyan-500/25 text-cyan-200",
];

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

  const activeFilterCount = typeFilter.length + priorityFilter.length;
  const hasAnyActive =
    activeFilterCount > 0 || assigneeFilter.length > 0 || search.trim().length > 0;

  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.length - visibleMembers.length;
  const groupLabel = GROUP_OPTIONS.find((g) => g.id === groupBy)?.label ?? "None";

  return (
    <div className="shrink-0 bg-[#09090b] px-6 pt-4">
      <div className="flex flex-wrap items-center gap-3 max-w-[1600px] mx-auto">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search board"
            aria-label="Search board"
            className="w-[220px] rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
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
                className={`relative -mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 ring-2 transition-all duration-150 hover:z-20 hover:-translate-y-0.5 ${
                  selected
                    ? "z-10 scale-110 ring-blue-400 ring-offset-2 ring-offset-[#09090b] brightness-110"
                    : "opacity-55 grayscale ring-[#09090b] hover:opacity-100 hover:grayscale-0"
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
                className={`relative -mr-2 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold ring-2 transition-all duration-150 hover:z-20 hover:-translate-y-0.5 ${colorForId(
                  m.userId
                )} ${
                  selected
                    ? "z-10 scale-110 ring-blue-400 ring-offset-2 ring-offset-[#09090b] brightness-125"
                    : "opacity-55 grayscale ring-[#09090b] hover:opacity-100 hover:grayscale-0"
                }`}
              >
                {initialsFromName(m.name || m.email)}
                {selected && <SelectedTick />}
              </button>
            );
          })}
          {overflow > 0 && (
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-400 ring-2 ring-[#09090b]">
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
                ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                : "border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-xl border border-white/[0.1] bg-[#141418] p-3 shadow-2xl shadow-black/50">
              <FilterGroup
                title="Type"
                options={TYPE_OPTIONS}
                selected={typeFilter}
                onToggle={onToggleType}
              />
              <div className="my-2 h-px bg-white/[0.06]" />
              <FilterGroup
                title="Priority"
                options={PRIORITY_OPTIONS}
                selected={priorityFilter}
                onToggle={onTogglePriority}
              />
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
                ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                : "border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Group{groupBy !== "none" ? `: ${groupLabel}` : ""}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {groupOpen && (
            <div className="absolute left-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-white/[0.1] bg-[#141418] p-1.5 shadow-2xl shadow-black/50">
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
                      ? "bg-white/[0.06] text-zinc-100"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                  {groupBy === opt.id && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasAnyActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
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
    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-[#09090b]">
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
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
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
              className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] text-zinc-300 hover:bg-white/[0.04] transition-colors"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-zinc-600 bg-transparent"
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
