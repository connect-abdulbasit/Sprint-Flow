export type BoardColumnConfig = {
  id: string;
  title: string;
  /** Tailwind dot class, e.g. `bg-blue-500` */
  dotColor?: string;
};

export const DEFAULT_BOARD_COLUMNS: BoardColumnConfig[] = [
  { id: "todo", title: "To Do", dotColor: "bg-zinc-500" },
  { id: "in_progress", title: "In Progress", dotColor: "bg-blue-500" },
  { id: "review", title: "In Review", dotColor: "bg-purple-500" },
  { id: "done", title: "Done", dotColor: "bg-emerald-500" },
];

const DOT_PALETTE = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
  "bg-orange-500",
] as const;

function statusLabelForId(id: string, title: string): string {
  if (id === "todo") return "To do";
  if (id === "in_progress") return "In progress";
  if (id === "review") return "In review";
  if (id === "done") return "Done";
  return title;
}

export const DEFAULT_STATUS_FORM_OPTIONS = DEFAULT_BOARD_COLUMNS.map((c) => ({
  value: c.id,
  label: statusLabelForId(c.id, c.title),
}));

export function normalizeBoardColumns(input: unknown): BoardColumnConfig[] {
  if (!Array.isArray(input) || input.length === 0) {
    return DEFAULT_BOARD_COLUMNS.map((c) => ({ ...c }));
  }
  const out: BoardColumnConfig[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const dotColor = typeof o.dotColor === "string" ? o.dotColor.trim() : undefined;
    if (!id || !title || seen.has(id)) continue;
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(id)) continue;
    seen.add(id);
    out.push({
      id,
      title: title.slice(0, 80),
      dotColor: dotColor || DOT_PALETTE[out.length % DOT_PALETTE.length],
    });
  }
  if (out.length < 2) return DEFAULT_BOARD_COLUMNS.map((c) => ({ ...c }));
  if (out.length > 12) return out.slice(0, 12);
  return out;
}

export function parseBoardColumnsPayload(body: unknown): BoardColumnConfig[] {
  const normalized = normalizeBoardColumns(body);
  if (normalized.length < 2) {
    throw new Error("Board must have at least two columns");
  }
  if (normalized.length > 12) {
    throw new Error("Board cannot have more than 12 columns");
  }
  return normalized;
}

export function slugifyColumnId(title: string, existingIds: Set<string>): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "column";
  const first = /^[a-z]/.test(base) ? base : `c_${base}`;
  let id = first;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${first}_${n}`;
    n += 1;
  }
  return id.slice(0, 64);
}

export function statusOptionsFromColumns(cols: BoardColumnConfig[]) {
  return cols.map((c) => ({
    value: c.id,
    label: statusLabelForId(c.id, c.title),
  }));
}
