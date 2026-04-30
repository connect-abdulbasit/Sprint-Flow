"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = destructive (red), default = primary action (emerald/blue tone) */
  variant?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) setBusy(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, busy, onClose]);

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  }, [onConfirm, onClose]);

  if (!isOpen) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30"
      : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-xl border border-white/[0.1] bg-[#111115] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 id="confirm-dialog-title" className="text-[15px] font-semibold text-zinc-100 pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="shrink-0 rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {description ? (
          <div className="px-5 py-4 text-[13px] leading-relaxed text-zinc-400">{description}</div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-40 ${confirmClass}`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
