"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { createSprint, type ProjectSprint } from "@/lib/projects-api";
import { useFocusTrap } from "@/hooks/useFocusTrap";

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function defaultTwoWeekWindow(): { start: string; end: string } {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const start = `${y}-${m}-${d}`;
  return { start, end: addDaysYmd(start, 13) };
}

export interface CreateSprintModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (_sprint: ProjectSprint) => void;
}

export default function CreateSprintModal({
  projectId,
  isOpen,
  onClose,
  onCreated,
}: CreateSprintModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const w = defaultTwoWeekWindow();
    setName("");
    setGoal("");
    setStartDate(w.start);
    setEndDate(w.end);
    setError(null);
  }, [isOpen]);

  // AUD-015 / AUD-056: this modal previously only closed via the backdrop click, with
  // no Escape-key handler at all.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Sprint name is required.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Start and end dates are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const sprint = await createSprint(projectId, {
        name: trimmedName,
        goal: goal.trim() || null,
        startDate,
        endDate,
      });
      onCreated(sprint);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#111115] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-sprint-title"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 id="create-sprint-title" className="text-[15px] font-semibold text-zinc-100">
              New sprint
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                Sprint name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                placeholder="e.g. Sprint 24"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                Goal (optional)
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                placeholder="What will this sprint deliver?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-200 focus:border-blue-500/40 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:bg-white/[0.05] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-[13px] font-semibold text-zinc-950 disabled:opacity-40"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
