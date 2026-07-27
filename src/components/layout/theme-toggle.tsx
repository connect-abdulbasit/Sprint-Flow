"use client";

import { Moon, Sun } from "lucide-react";
import { useRef, type MouseEvent } from "react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lockedRef = useRef(false);
  const isDark = theme === "dark";

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const el = buttonRef.current;
    const rect = el?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : event.clientX;
    const y = rect ? rect.top + rect.height / 2 : event.clientY;

    try {
      await toggleTheme({ x, y });
    } finally {
      lockedRef.current = false;
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={(e) => void handleClick(e)}
      className={`cursor-pointer p-2 text-muted hover:text-fg bg-surface/25 hover:bg-surface/65 border border-border rounded-xl transition-colors duration-200 ${className}`}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {!mounted ? (
        <Moon className="w-[18px] h-[18px]" />
      ) : isDark ? (
        <Sun className="w-[18px] h-[18px]" />
      ) : (
        <Moon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
