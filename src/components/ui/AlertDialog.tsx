"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, Info, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "error" | "info";
  /** Primary button label */
  okLabel?: string;
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  variant = "error",
  okLabel = "OK",
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const Icon = variant === "error" ? AlertCircle : Info;
  const iconWrap =
    variant === "error"
      ? "bg-danger-soft border-danger/25 text-danger"
      : "bg-accent-soft border-accent/25 text-accent";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-desc"
        className="relative w-full max-w-md rounded-xl border border-border-hover bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconWrap}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <h2 id="alert-dialog-title" className="text-[15px] font-semibold text-fg">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-muted hover:bg-hover-strong hover:text-muted2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p id="alert-dialog-desc" className="mt-2 text-[13px] leading-relaxed text-muted2">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-fg px-5 py-2.5 text-[13px] font-semibold text-bg hover:bg-fg-strong"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
