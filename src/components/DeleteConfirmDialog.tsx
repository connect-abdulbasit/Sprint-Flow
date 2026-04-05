import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmDialog: React.FC<Props> = ({
  isOpen,
  projectName,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(22, 22, 30, 0.95) 0%, rgba(13, 13, 18, 1) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(239, 68, 68, 0.1)",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-500 text-2xl font-black">!</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-3">Delete Project?</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Are you completely sure you want to delete{" "}
          <span className="text-white font-bold">{projectName}</span>? This action is permanent and
          cannot be undone.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition-all disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Project"}
          </button>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
