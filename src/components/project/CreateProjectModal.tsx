"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  LayoutDashboard,
  Smartphone,
  Palette,
  Settings,
  Rocket,
  Target,
  Zap,
  Globe,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";

const icons = [
  { id: "LayoutDashboard", icon: LayoutDashboard },
  { id: "Smartphone", icon: Smartphone },
  { id: "Palette", icon: Palette },
  { id: "Target", icon: Target },
  { id: "Zap", icon: Zap },
  { id: "Globe", icon: Globe },
  { id: "Shield", icon: Shield },
  { id: "Layers", icon: Layers },
];

const colors = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ef4444", // Red
  "#06b6d4", // Cyan
];

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("LayoutDashboard");
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setName("");
      setKey("");
      setDescription("");
      setClosing(false);
    }, 200);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key === name.slice(0, 3).toUpperCase()) {
      setKey(val.slice(0, 3).toUpperCase());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    handleClose();
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
          className={`relative w-full max-w-2xl rounded-2xl overflow-hidden bg-[#0c0c0f] border border-white/[0.08] shadow-2xl ${animClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Sidebar - Preview */}
            <div className="w-full md:w-[220px] bg-white/[0.02] border-r border-white/[0.05] p-8 flex flex-col items-center justify-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 relative group border border-white/[0.05] shadow-lg"
                style={{
                  backgroundColor: `${selectedColor}10`,
                  color: selectedColor,
                }}
              >
                {(() => {
                  const ActiveIcon =
                    icons.find((i) => i.id === selectedIcon)?.icon || LayoutDashboard;
                  return <ActiveIcon className="w-8 h-8 relative z-10" />;
                })()}
              </div>

              <div className="space-y-1 w-full overflow-hidden">
                <div className="text-sm font-semibold text-zinc-100 truncate w-full px-2">
                  {name || "Project Name"}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {key || "KEY"}
                </div>
              </div>

              <div className="mt-10 w-full space-y-3 opacity-40">
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full w-[40%] bg-zinc-600 rounded-full" />
                </div>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full w-[60%] bg-zinc-600 rounded-full" />
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100">Create new project</h2>
                  <p className="text-[13px] text-zinc-500 mt-1">Set up your workspace and team.</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5">
                      Name
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Design System"
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5">
                      Key
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toUpperCase())}
                      placeholder="KEY"
                      maxLength={5}
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-2.5 text-[14px] font-mono text-center text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5">
                    Appearance
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-full transition-all relative ${selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#0c0c0f]" : "opacity-40 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {icons.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIcon(item.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                          selectedIcon === item.id
                            ? "bg-white/[0.08] border-white/20 text-blue-400"
                            : "bg-white/[0.02] border-white/[0.05] text-zinc-600 hover:text-zinc-400"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-0.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe the project goals..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading || !name}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[14px] font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create Project
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
