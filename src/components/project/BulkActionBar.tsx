"use client";

import { Loader2, X } from "lucide-react";
import type { ReactNode } from "react";

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

/** Floating action bar shown when 1+ rows are selected — shared by the Backlog
 * (ticket bulk select) and Epic List (epic bulk select) screens so bulk
 * actions look and behave identically everywhere they appear. */
export default function BulkActionBar({
  count,
  onClear,
  actions,
  busy,
}: {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
  busy?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[900] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-border-hover bg-surface px-4 py-2.5 shadow-2xl">
        <span className="text-[13px] font-medium text-fg">{count} selected</span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={busy || action.disabled}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium disabled:opacity-40 ${
                action.variant === "danger"
                  ? "text-danger hover:bg-danger-soft"
                  : "text-muted2 hover:bg-hover"
              }`}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action.icon}
              {action.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
