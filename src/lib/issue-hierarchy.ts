import type { ProjectTicket } from "@/lib/projects-api";

export type IssueWithSubtasks = ProjectTicket & { subtasks: ProjectTicket[] };

/** Groups a project's flat ticket list into top-level issues (parentTaskId ===
 * null) with their direct subtasks nested — the same shape the server uses to
 * compute epic progress, and the single source every list/board/backlog view
 * derives its issue+subtask rendering from (no separate "issues" endpoint). */
export function groupIssuesWithSubtasks(tickets: ProjectTicket[]): IssueWithSubtasks[] {
  const subtasksByParent = new Map<string, ProjectTicket[]>();
  for (const t of tickets) {
    if (!t.parentTaskId) continue;
    const list = subtasksByParent.get(t.parentTaskId) ?? [];
    list.push(t);
    subtasksByParent.set(t.parentTaskId, list);
  }
  return tickets
    .filter((t) => !t.parentTaskId)
    .map((t) => ({ ...t, subtasks: subtasksByParent.get(t.id) ?? [] }));
}

/** Groups top-level issues (with their subtasks nested) by epicId — `null` key
 * for issues with no epic. Mirrors the server's `epicService` grouping. */
export function groupIssuesByEpic(
  tickets: ProjectTicket[]
): Map<string | null, IssueWithSubtasks[]> {
  const issues = groupIssuesWithSubtasks(tickets);
  const byEpic = new Map<string | null, IssueWithSubtasks[]>();
  for (const issue of issues) {
    const key = issue.epicId ?? null;
    const list = byEpic.get(key) ?? [];
    list.push(issue);
    byEpic.set(key, list);
  }
  return byEpic;
}

export function isIssueDone(issue: IssueWithSubtasks): boolean {
  return issue.subtasks.length
    ? issue.subtasks.every((s) => s.status === "done")
    : issue.status === "done";
}

export function computeIssueProgress(issue: IssueWithSubtasks) {
  const total = issue.subtasks.length;
  const done = issue.subtasks.filter((s) => s.status === "done").length;
  return { total, done, percent: total ? Math.round((100 * done) / total) : 0 };
}

/** Client-side mirror of the server's `computeEpicProgress` (epic.service.ts) —
 * used only for optimistic UI; the server response is always the source of
 * truth on refresh. */
export function computeEpicProgressClient(issues: IssueWithSubtasks[]) {
  const leaves = issues.flatMap((issue) => (issue.subtasks.length ? issue.subtasks : [issue]));
  const doneLeaves = leaves.filter((l) => l.status === "done").length;
  const progressPercent = leaves.length ? Math.round((100 * doneLeaves) / leaves.length) : 0;
  const completedIssueCount = issues.filter(isIssueDone).length;
  return { issueCount: issues.length, completedIssueCount, progressPercent };
}
