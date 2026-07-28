import { normalizeTicketPriority } from "@/lib/ticket-priority";
import {
  EPIC_STATUSES,
  isValidEpicColor,
  isValidEpicIcon,
  isValidEpicStatus,
  type EpicColor,
  type EpicIcon,
  type EpicStatus,
} from "@/lib/epic-style";

export type EpicCreateInput = {
  name: string;
  description: string;
  status: EpicStatus;
  priority: string;
  ownerId: string;
  color: EpicColor;
  icon: EpicIcon;
  labels: string[];
  startDate: string;
  dueDate: string;
};

function requireNonEmptyTrimmed(value: unknown, field: string): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    throw new Error(`${field} is required and cannot be empty or whitespace`);
  }
  return trimmed;
}

export function parseEpicLabels(raw: unknown): string[] {
  let items: unknown[] | undefined;
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "string") {
    items = raw.split(",");
  } else if (raw === undefined || raw === null) {
    throw new Error("labels are required");
  } else {
    throw new Error("labels must be an array or comma-separated string");
  }

  const labels = items.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  if (labels.length === 0) {
    throw new Error("at least one label is required");
  }
  return labels;
}

function validateDateRange(startDate: string, dueDate: string) {
  if (dueDate < startDate) {
    throw new Error("due date cannot be before start date");
  }
}

export function validateEpicCreateInput(body: Record<string, unknown>): EpicCreateInput {
  const name = requireNonEmptyTrimmed(body.name, "name");
  const description = requireNonEmptyTrimmed(body.description, "description");

  if (!isValidEpicStatus(body.status)) {
    throw new Error(`status is required and must be one of: ${EPIC_STATUSES.join(", ")}`);
  }

  if (typeof body.priority !== "string" || !body.priority.trim()) {
    throw new Error("priority is required");
  }
  const priority = normalizeTicketPriority(body.priority);

  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  if (!ownerId) {
    throw new Error("owner is required");
  }

  if (!isValidEpicColor(body.color)) {
    throw new Error("color is required");
  }

  if (!isValidEpicIcon(body.icon)) {
    throw new Error("icon is required");
  }

  const labels = parseEpicLabels(body.labels);
  const startDate = requireNonEmptyTrimmed(body.startDate, "start date");
  const dueDate = requireNonEmptyTrimmed(body.dueDate, "due date");
  validateDateRange(startDate, dueDate);

  return {
    name,
    description,
    status: body.status,
    priority,
    ownerId,
    color: body.color,
    icon: body.icon,
    labels,
    startDate,
    dueDate,
  };
}

export type EpicUpdateInput = Partial<EpicCreateInput>;

export function validateEpicUpdateInput(body: Partial<Record<string, unknown>>): EpicUpdateInput {
  const patch: EpicUpdateInput = {};

  if (body.name !== undefined) patch.name = requireNonEmptyTrimmed(body.name, "name");
  if (body.description !== undefined) {
    patch.description = requireNonEmptyTrimmed(body.description, "description");
  }
  if (body.status !== undefined) {
    if (!isValidEpicStatus(body.status)) {
      throw new Error(`status must be one of: ${EPIC_STATUSES.join(", ")}`);
    }
    patch.status = body.status;
  }
  if (body.priority !== undefined) {
    if (typeof body.priority !== "string" || !body.priority.trim()) {
      throw new Error("priority cannot be empty");
    }
    patch.priority = normalizeTicketPriority(body.priority);
  }
  if (body.ownerId !== undefined) {
    const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
    if (!ownerId) throw new Error("owner is required");
    patch.ownerId = ownerId;
  }
  if (body.color !== undefined) {
    if (!isValidEpicColor(body.color)) throw new Error("color is required");
    patch.color = body.color;
  }
  if (body.icon !== undefined) {
    if (!isValidEpicIcon(body.icon)) throw new Error("icon is required");
    patch.icon = body.icon;
  }
  if (body.labels !== undefined) patch.labels = parseEpicLabels(body.labels);
  if (body.startDate !== undefined) {
    patch.startDate = requireNonEmptyTrimmed(body.startDate, "start date");
  }
  if (body.dueDate !== undefined) {
    patch.dueDate = requireNonEmptyTrimmed(body.dueDate, "due date");
  }

  if (patch.startDate && patch.dueDate) {
    validateDateRange(patch.startDate, patch.dueDate);
  }

  return patch;
}

export function validateEpicFormInput(
  body: Record<string, unknown>
): { ok: true; data: EpicCreateInput } | { ok: false; error: string } {
  try {
    return { ok: true, data: validateEpicCreateInput(body) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/** Convenience helper for tests and seed data. */
export function buildValidEpicCreateInput(
  ownerId: string,
  overrides: Partial<EpicCreateInput> = {}
): EpicCreateInput {
  return {
    name: "Test Epic",
    description: "Test epic description",
    status: "backlog",
    priority: "medium",
    ownerId,
    color: "blue",
    icon: "rocket",
    labels: ["test"],
    startDate: "2026-01-01",
    dueDate: "2026-12-31",
    ...overrides,
  };
}
