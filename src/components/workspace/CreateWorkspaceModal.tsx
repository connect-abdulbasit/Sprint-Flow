"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Loader2, ChevronRight } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setName("");
      setDescription("");
      setError(null);
      setClosing(false);
    }, 200);
  }, [onClose]);

  // AUD-015 / AUD-056: no Escape-to-close handler existed here before.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          organizationId,
        }),
      });

      if (res.ok) {
        onSuccess();
        handleClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to create workspace. Please try again.");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
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
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.98) translateY(10px); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-workspace-title"
          className={`relative w-full max-w-md rounded-2xl overflow-hidden bg-[#0c0c0f] border border-white/[0.08] shadow-2xl ${animClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 id="create-workspace-title" className="text-xl font-semibold text-zinc-100">
                  New Workspace
                </h2>
                <p className="text-[13px] text-zinc-500 mt-1">
                  Create a new workspace for your projects.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5">
                  Name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Product Development"
                  required
                  disabled={loading}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/[0.05] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the workspace purpose..."
                  rows={3}
                  disabled={loading}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/[0.05] transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-[14px] font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Create Workspace
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
