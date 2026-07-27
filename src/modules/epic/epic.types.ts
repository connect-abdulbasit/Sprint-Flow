// The status/color/icon allowlists are pure data shared with the client (for
// rendering/pickers), so they live in src/lib (same convention as
// src/lib/ticket-priority.ts) rather than being duplicated here.
export * from "@/lib/epic-style";

export type EpicIssueProgress = {
  issueCount: number;
  completedIssueCount: number;
  progressPercent: number;
};
