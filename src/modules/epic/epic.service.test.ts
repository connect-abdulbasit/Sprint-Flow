import { describe, it, expect } from "vitest";
import { computeEpicProgress } from "./epic.service";

function issue(status: string, subtaskStatuses: string[] = []) {
  return { status, subtasks: subtaskStatuses.map((s) => ({ status: s })) };
}

describe("computeEpicProgress", () => {
  it("returns 0% progress and zero counts for an epic with no issues", () => {
    expect(computeEpicProgress([])).toEqual({
      issueCount: 0,
      completedIssueCount: 0,
      progressPercent: 0,
    });
  });

  it("computes progress from childless issues directly", () => {
    const result = computeEpicProgress([issue("done"), issue("todo"), issue("in_progress")]);
    expect(result).toEqual({ issueCount: 3, completedIssueCount: 1, progressPercent: 33 });
  });

  it("flattens an issue's subtasks into leaf units instead of counting the issue itself", () => {
    // One issue with 2/4 subtasks done — the issue is not "done" as a whole,
    // but its subtasks still contribute to the leaf-level percentage.
    const result = computeEpicProgress([issue("in_progress", ["done", "done", "todo", "todo"])]);
    expect(result.progressPercent).toBe(50); // 2 of 4 leaves done
    expect(result.issueCount).toBe(1);
    expect(result.completedIssueCount).toBe(0); // issue itself isn't "done" until all subtasks are
  });

  it("counts an issue as completed only when every one of its subtasks is done", () => {
    const allDone = computeEpicProgress([issue("in_progress", ["done", "done"])]);
    expect(allDone.completedIssueCount).toBe(1);
    expect(allDone.progressPercent).toBe(100);

    const partiallyDone = computeEpicProgress([issue("in_progress", ["done", "todo"])]);
    expect(partiallyDone.completedIssueCount).toBe(0);
    expect(partiallyDone.progressPercent).toBe(50);
  });

  it("keeps issueCount/completedIssueCount at the issue level even when progressPercent is leaf-level", () => {
    // 2 issues: one childless+done, one with 1/2 subtasks done.
    // Leaves: [done, done, todo] -> 2/3 = 67%. Issues: only the childless one is "done" -> 1/2.
    const result = computeEpicProgress([issue("done"), issue("in_progress", ["done", "todo"])]);
    expect(result.issueCount).toBe(2);
    expect(result.completedIssueCount).toBe(1);
    expect(result.progressPercent).toBe(67);
  });
});
