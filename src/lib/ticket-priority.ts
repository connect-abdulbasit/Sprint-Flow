/** Ordered from lowest to highest urgency (display / sort). */
export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_SET = new Set<string>(TICKET_PRIORITIES);

export function assertValidTicketPriority(priority: unknown): asserts priority is TicketPriority {
  const s = typeof priority === "string" ? priority.trim().toLowerCase() : "";
  if (!PRIORITY_SET.has(s)) {
    throw new Error(`priority must be one of: ${TICKET_PRIORITIES.join(", ")}`);
  }
}

export function normalizeTicketPriority(priority: unknown): TicketPriority {
  const s = typeof priority === "string" ? priority.trim().toLowerCase() : "";
  assertValidTicketPriority(s);
  return s as TicketPriority;
}
