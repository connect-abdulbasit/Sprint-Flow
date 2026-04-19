"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { X, ChevronRight, Loader2 } from "lucide-react";
import type { Project } from "@/lib/projects-api";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with form data. Throw to keep the modal open and show an error. */
  onSubmit: (_data: { name: string; description: string }) => Promise<void>;
  /** If provided, the modal opens in "Edit" mode with prefilled values. */
  projectToEdit?: Project | null;
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  projectToEdit,
}: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditMode = Boolean(projectToEdit);

  // Sync form fields when modal opens / changes mode
  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setFormError(null);
      if (projectToEdit) {
        setName(projectToEdit.name);
        setDescription(projectToEdit.description ?? "");
      } else {
        setName("");
        setDescription("");
      }
      // Auto-focus name input after animation starts
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, projectToEdit]);

  const handleClose = () => {
    if (submitting) return;
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 200);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Project name is required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, description: description.trim() });
      handleClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

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

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleClose}
        role="presentation"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? "Edit project" : "Create new project"}
          className={`relative w-full max-w-lg rounded-2xl overflow-hidden bg-[#0c0c0f] border border-white/[0.08] shadow-2xl ${animClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  {isEditMode ? "Edit project" : "Create new project"}
                </h2>
                <p className="text-[13px] text-zinc-500 mt-1">
                  {isEditMode
                    ? "Update the project details below."
                    : "Set up your project and get started."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="project-name"
                  className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={inputRef}
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Design System"
                  required
                  aria-required="true"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="project-desc"
                  className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5"
                >
                  Description
                </label>
                <textarea
                  id="project-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the project goals…"
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all resize-none"
                />
              </div>

              {/* Inline error */}
              {formError && (
                <p
                  className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[14px] font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isEditMode ? "Save Changes" : "Create Project"}
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
