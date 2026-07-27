import {
  Rocket,
  Flag,
  Target,
  Layers,
  Shield,
  Star,
  Package,
  Puzzle,
  Milestone,
  Compass,
  type LucideIcon,
} from "lucide-react";

export const EPIC_STATUSES = ["backlog", "in_progress", "done"] as const;
export type EpicStatus = (typeof EPIC_STATUSES)[number];

export const EPIC_STATUS_LABELS: Record<EpicStatus, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  done: "Done",
};

/** Fixed swatch allowlist — same "store a validated key, not raw color" convention
 * as the board column dot-color palette in `src/lib/board-columns.ts`. Shared
 * between server (validation) and client (rendering) since it's pure data. */
export const EPIC_COLORS = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;
export type EpicColor = (typeof EPIC_COLORS)[number];

export const EPIC_COLOR_DOT_CLASS: Record<EpicColor, string> = {
  slate: "bg-slate-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export const EPIC_ICONS = [
  "rocket",
  "flag",
  "target",
  "layers",
  "shield",
  "star",
  "package",
  "puzzle",
  "milestone",
  "compass",
] as const;
export type EpicIcon = (typeof EPIC_ICONS)[number];

export const EPIC_ICON_COMPONENT: Record<EpicIcon, LucideIcon> = {
  rocket: Rocket,
  flag: Flag,
  target: Target,
  layers: Layers,
  shield: Shield,
  star: Star,
  package: Package,
  puzzle: Puzzle,
  milestone: Milestone,
  compass: Compass,
};

export function isValidEpicStatus(value: unknown): value is EpicStatus {
  return typeof value === "string" && (EPIC_STATUSES as readonly string[]).includes(value);
}

export function isValidEpicColor(value: unknown): value is EpicColor {
  return typeof value === "string" && (EPIC_COLORS as readonly string[]).includes(value);
}

export function isValidEpicIcon(value: unknown): value is EpicIcon {
  return typeof value === "string" && (EPIC_ICONS as readonly string[]).includes(value);
}
