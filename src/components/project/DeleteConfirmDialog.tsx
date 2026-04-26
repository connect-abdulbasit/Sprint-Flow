"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  /** Exact name the user must type (e.g. project or workspace name). Comparison trims both sides. */
  nameToConfirm: string;
  /** Lowercase noun for copy, e.g. "project", "workspace", "organization" */
  resourceLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  /** Shown above the action buttons when the last confirm attempt failed */
  error?: string | null;
}

export default function DeleteConfirmDialog({
  isOpen,
  nameToConfirm,
  resourceLabel,
  onClose,
  onConfirm,
  error = null,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const expected = nameToConfirm.trim();
  const matches = expected.length > 0 && typed.trim() === expected;
  const titleCased = resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1);

  useEffect(() => {
    if (!isOpen) return;
    setTyped("");
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (deleting) return;
    setTyped("");
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 200);
  }, [deleting, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, deleting, handleClose]);

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!matches || deleting) return;
    setDeleting(true);
    let succeeded = false;
    try {
      await onConfirm();
      succeeded = true;
    } catch {
      // Parent sets `error` and rethrows; keep dialog open
    } finally {
      setDeleting(false);
    }
    if (succeeded) handleClose();
  };

  if (!isOpen && !closing) return null;

  const animClass = closing
    ? "animate-[modalOut_0.2s_ease_forwards]"
    : "animate-[modalIn_0.3s_ease_forwards]";
  const backdropClass = closing
    ? "animate-[fadeOut_0.2s_ease_forwards]"
    : "animate-[fadeIn_0.2s_ease_forwards]";

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.98) translateY(10px); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <div
        className={`fixed inset-0 z-[1001] flex items-center justify-center p-4 ${backdropClass} cursor-default`}
        onClick={handleClose}
        role="presentation"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={`Delete ${resourceLabel} confirmation`}
          aria-describedby="delete-dialog-desc"
          className={`relative w-full max-w-md rounded-2xl overflow-hidden bg-[#0c0c0f] border border-red-500/20 shadow-2xl ${animClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleConfirm} className="p-8 text-left">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>

            <h2 className="text-lg font-semibold text-zinc-100 mb-2 text-center">
              Delete this {resourceLabel}?
            </h2>
            <p
              id="delete-dialog-desc"
              className="text-[13px] text-zinc-400 leading-relaxed mb-6 text-center"
            >
              This will permanently delete the {resourceLabel} and related data. This cannot be
              undone.
            </p>

            <div className="space-y-2 mb-2">
              <label
                htmlFor="delete-confirm-name"
                className="block text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500"
              >
                Type{" "}
                <span className="text-zinc-300 font-mono font-semibold normal-case">
                  {nameToConfirm}
                </span>{" "}
                to confirm
              </label>
              <input
                ref={inputRef}
                id="delete-confirm-name"
                type="text"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={deleting}
                placeholder={expected || titleCased}
                className="w-full bg-[#0f0f12] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all font-mono disabled:opacity-50"
              />
            </div>

            {error ? (
              <p role="alert" className="text-[13px] text-red-400 mb-4 leading-snug">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2.5 mt-6">
              <button
                type="submit"
                disabled={deleting || !matches}
                className="w-full py-2.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-semibold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  `I understand, delete this ${resourceLabel}`
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="w-full py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 font-medium text-[14px] transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
