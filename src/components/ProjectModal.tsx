import React, { useState, useEffect } from "react";
import { Project } from "../api/projects";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, projectToEdit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, description });
      onClose();
    } catch (err) {
      console.error("Failed to submit form", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background:
            "linear-gradient(180deg, rgba(22, 22, 30, 0.95) 0%, rgba(13, 13, 18, 1) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
          {projectToEdit ? "Edit Project" : "Create Project"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#6b6b80] uppercase tracking-widest ml-1">
              Project Name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3 text-[15px] text-white placeholder-[#333339] focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/[0.05] transition-all"
              placeholder="e.g. Website Redesign"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#6b6b80] uppercase tracking-widest ml-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-[14px] text-white placeholder-[#333339] focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/[0.05] transition-all resize-none"
              placeholder="What are you building?"
            ></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-accent,indigo)] text-white text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
