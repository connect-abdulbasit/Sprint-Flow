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
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(20px); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        <div
          className={`relative w-full max-w-2xl rounded-[2.5rem] overflow-hidden ${animClass}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            background:
              "linear-gradient(180deg, rgba(22, 22, 30, 0.95) 0%, rgba(13, 13, 18, 1) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 40px 100px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Top Glow Accent */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] opacity-50"
            style={{
              background: `linear-gradient(90deg, transparent, ${selectedColor}, transparent)`,
            }}
          />

          <div className="flex">
            {/* Left Sidebar - Preview */}
            <div className="w-[240px] bg-white/[0.02] border-r border-white/[0.05] p-8 flex flex-col items-center justify-center text-center">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl mb-6 relative group"
                style={{
                  backgroundColor: `${selectedColor}15`,
                  color: selectedColor,
                  border: `1px solid ${selectedColor}30`,
                  boxShadow: `0 20px 40px -12px ${selectedColor}40`,
                }}
              >
                <div
                  className="absolute inset-0 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: selectedColor }}
                />
                {(() => {
                  const ActiveIcon =
                    icons.find((i) => i.id === selectedIcon)?.icon || LayoutDashboard;
                  return <ActiveIcon className="w-12 h-12 relative z-10" />;
                })()}
              </div>

              <div className="space-y-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#333339]">
                  Preview
                </h3>
                <div className="text-xl font-black text-white font-syne uppercase truncate w-full px-2">
                  {name || "My Project"}
                </div>
                <div className="text-[11px] font-mono text-[#6b6b80] uppercase tracking-widest">
                  {key || "KEY"}
                </div>
              </div>

              <div className="mt-12 w-full space-y-4">
                <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full w-[40%] rounded-full opacity-50"
                    style={{ backgroundColor: selectedColor }}
                  />
                </div>
                <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full w-[60%] rounded-full opacity-50"
                    style={{ backgroundColor: selectedColor }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight font-syne uppercase">
                    Ignite Project
                  </h2>
                  <p className="text-[11px] font-bold text-[#6b6b80] uppercase tracking-[0.2em] mt-1">
                    Configure your next journey
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.08] text-[#6b6b80] hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[11px] font-black text-[#6b6b80] uppercase tracking-widest ml-1">
                      Project Name
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Phoenix Rising"
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3 text-[15px] text-white placeholder-[#333339] focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.05] transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#6b6b80] uppercase tracking-widest ml-1">
                      Key ID
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toUpperCase())}
                      placeholder="KEY"
                      maxLength={5}
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-3 text-[15px] font-mono text-center text-white placeholder-[#333339] focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.05] transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-[#6b6b80] uppercase tracking-widest ml-1">
                    Branding & Identity
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-xl transition-all duration-300 relative ${selectedColor === color ? "scale-110 shadow-lg" : "hover:scale-105 opacity-60 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <div className="absolute inset-0 rounded-xl border-2 border-white/50 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-8 gap-3 pt-2">
                    {icons.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIcon(item.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                          selectedIcon === item.id
                            ? "bg-white/[0.08] border-white/20 text-white shadow-xl"
                            : "bg-white/[0.02] border-white/[0.05] text-[#333339] hover:text-[#6b6b80] hover:bg-white/[0.04]"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#6b6b80] uppercase tracking-widest ml-1">
                    Manifesto (Description)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is the objective of this project?"
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-[14px] text-white placeholder-[#333339] focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.05] transition-all shadow-inner resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#333339] uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-generating workspace context
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !name}
                    className="group flex items-center gap-2 px-8 py-3.5 bg-white text-black text-[14px] font-black rounded-2xl transition-all active:scale-[0.98] shadow-2xl relative overflow-hidden disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Launch Project
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
