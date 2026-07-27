"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { THEME_STORAGE_KEY, transitionTheme, type Theme } from "@/lib/theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function currentDomTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

/**
 * Reads/controls the active theme. The initial class is set pre-paint by the
 * inline script in the root layout, so this only mirrors + updates state.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const transitioningRef = useRef(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setMounted(true);
  }, []);

  const setTheme = useCallback(async (next: Theme, origin?: { x: number; y: number }) => {
    if (transitioningRef.current) return;
    if (next === currentDomTheme()) return;

    transitioningRef.current = true;
    try {
      // Avoid React setState before the reveal — it re-renders cards and
      // breaks the frozen full-page snapshot used by the circular wipe.
      await transitionTheme(next, origin, () => setThemeState(next));
    } finally {
      transitioningRef.current = false;
    }
  }, []);

  const toggleTheme = useCallback(
    async (origin?: { x: number; y: number }) => {
      const next: Theme = currentDomTheme() === "light" ? "dark" : "light";
      await setTheme(next, origin);
    },
    [setTheme]
  );

  return {
    theme,
    setTheme,
    toggleTheme,
    mounted,
    isTransitioning: transitioningRef.current,
  };
}
