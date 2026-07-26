export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "sf-theme";

/**
 * Inline script (stringified) injected into <head> before paint so the
 * correct theme class is on <html> immediately — no flash of the wrong theme.
 * Defaults to dark to preserve the existing product experience.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t='dark';}var e=document.documentElement;e.classList.remove('theme-light','theme-dark');e.classList.add('theme-'+t);e.style.colorScheme=t;}catch(_){document.documentElement.classList.add('theme-dark');}})();`;

export function applyTheme(theme: Theme) {
  const el = document.documentElement;
  el.classList.remove("theme-light", "theme-dark");
  el.classList.add(`theme-${theme}`);
  el.style.colorScheme = theme;
}

export function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — theme still applies for the session */
  }
}

type ThemeOrigin = { x: number; y: number };

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
};

const REVEAL_MS = 600;
const REVEAL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const THEME_BG: Record<Theme, string> = {
  light: "#f8fafc",
  dark: "#09090b",
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTransitions() {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

function currentTheme(): Theme {
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

/** Radius from origin that reaches every corner of the viewport. */
function revealRadius(x: number, y: number) {
  const { innerWidth: w, innerHeight: h } = window;
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
}

function freezeTransitions() {
  document.documentElement.classList.add("theme-revealing");
}

function unfreezeTransitions() {
  document.documentElement.classList.remove("theme-revealing");
}

/**
 * Fallback when View Transitions aren't available: cover with a frozen
 * bitmap of the old page (via canvas draw of the viewport isn't available
 * cross-browser), so we freeze CSS transitions and use a solid cover + hole.
 * Freezing is what makes every card flip at once under the hole.
 */
function circularRevealFallback(theme: Theme, origin: ThemeOrigin, onApply?: () => void) {
  return new Promise<void>((resolve) => {
    const { x, y } = origin;
    const maxRadius = revealRadius(x, y);
    const coverColor = THEME_BG[currentTheme()];

    freezeTransitions();

    const overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.className = "theme-reveal-overlay";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "pointer-events:none",
      `background:${coverColor}`,
      `mask-image:radial-gradient(circle 0px at ${x}px ${y}px, transparent 0, transparent 100%, #000 100%)`,
      `-webkit-mask-image:radial-gradient(circle 0px at ${x}px ${y}px, transparent 0, transparent 100%, #000 100%)`,
    ].join(";");
    document.body.appendChild(overlay);

    applyTheme(theme);
    persistTheme(theme);
    onApply?.();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      overlay.remove();
      // Keep transitions frozen for one frame after remove so cards don't
      // ease individually once the cover lifts.
      requestAnimationFrame(() => {
        unfreezeTransitions();
        resolve();
      });
    };

    const setHole = (radius: number) => {
      const mask = `radial-gradient(circle ${radius}px at ${x}px ${y}px, transparent 0, transparent 99.5%, #000 100%)`;
      overlay.style.maskImage = mask;
      overlay.style.webkitMaskImage = mask;
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / REVEAL_MS);
          const eased = 1 - Math.pow(1 - t, 3);
          setHole(maxRadius * eased);
          if (t < 1) requestAnimationFrame(tick);
          else finish();
        };
        requestAnimationFrame(tick);
      });
    });

    window.setTimeout(finish, REVEAL_MS + 120);
  });
}

/**
 * View Transitions capture the ENTIRE page (all cards) as one bitmap,
 * then reveal the new bitmap with a circle from the toggle — so every
 * grid box updates together inside the growing radius.
 */
async function circularRevealVT(theme: Theme, origin: ThemeOrigin, onApply?: () => void) {
  const { x, y } = origin;
  const radius = revealRadius(x, y);
  const root = document.documentElement;

  freezeTransitions();

  const doc = document as Document & {
    startViewTransition: (_cb: () => void) => ViewTransitionLike;
  };

  const transition = doc.startViewTransition(() => {
    applyTheme(theme);
    persistTheme(theme);
    onApply?.();
  });

  try {
    await transition.ready;
  } catch {
    unfreezeTransitions();
    return;
  }

  // Clip both layers so the wipe is a single circular reveal of the full page.
  root.animate(
    {
      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
    },
    {
      duration: REVEAL_MS,
      easing: REVEAL_EASING,
      fill: "both",
      pseudoElement: "::view-transition-new(root)",
    }
  );

  // Keep the old page fully visible underneath (no fade / slide).
  root.animate(
    { opacity: [1, 1] },
    {
      duration: REVEAL_MS,
      easing: "linear",
      fill: "both",
      pseudoElement: "::view-transition-old(root)",
    }
  );

  try {
    await transition.finished;
  } catch {
    /* aborted */
  } finally {
    unfreezeTransitions();
  }
}

/**
 * Applies a theme with a circular wipe from `origin` across the whole screen.
 * Prefer View Transitions so every card is part of one frozen snapshot.
 */
export async function transitionTheme(theme: Theme, origin?: ThemeOrigin, onApply?: () => void) {
  if (!origin || prefersReducedMotion()) {
    freezeTransitions();
    applyTheme(theme);
    persistTheme(theme);
    onApply?.();
    requestAnimationFrame(() => unfreezeTransitions());
    return;
  }

  if (supportsViewTransitions()) {
    await circularRevealVT(theme, origin, onApply);
    return;
  }

  await circularRevealFallback(theme, origin, onApply);
}
