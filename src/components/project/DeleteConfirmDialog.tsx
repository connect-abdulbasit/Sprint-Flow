"use client";

import { useState, useEffect, type FormEvent } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmDialog({
  isOpen,
  projectName,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const handleClose = () => {
    if (deleting) return;
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 200);
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } catch {
      // Error handling managed by parent hook
    } finally {
      setDeleting(false);
    }
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
        className={`fixed inset-0 z-[1001] flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleClose}
        role="presentation"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Delete project confirmation"
          aria-describedby="delete-dialog-desc"
          className={`relative w-full max-w-sm rounded-2xl overflow-hidden bg-[#0c0c0f] border border-red-500/20 shadow-2xl ${animClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleConfirm} className="p-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>

            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Delete project?</h2>
            <p id="delete-dialog-desc" className="text-[13px] text-zinc-400 leading-relaxed mb-8">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-200">{projectName}</span>? This action is
              permanent and cannot be undone.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={deleting}
                className="w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-[14px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Yes, delete project"
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="w-full py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 font-medium text-[14px] transition-all disabled:opacity-50"
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
