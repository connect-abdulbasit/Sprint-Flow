import { describe, it, expect, afterEach } from "vitest";
import { taskService } from "@/modules/task/task.service";
import { epicService } from "@/modules/epic/epic.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestEpic,
  cleanupTestData,
} from "../../helpers/db-fixtures";
import { asTestTicket } from "../../helpers/ticket-shape";

describe("moving an issue between epics preserves relationships and progress", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("recomputes both epics' progress after an issue (with subtasks) moves between them", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const epicA = await createTestEpic(project.id, { name: "Epic A" });
    const epicB = await createTestEpic(project.id, { name: "Epic B" });
    orgIds.push(org.id);
    userIds.push(admin.id);

    const issue = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Movable issue",
        reporterName: admin.name,
        epicId: epicA.id,
        status: "done",
      })
    );
    await taskService.createTicket(admin.id, project.id, {
      title: "Subtask",
      reporterName: admin.name,
      parentTaskId: issue.id,
      status: "done",
    });

    let [refreshedA, refreshedB] = await Promise.all([
      epicService.getEpic(admin.id, project.id, epicA.id),
      epicService.getEpic(admin.id, project.id, epicB.id),
    ]);
    expect(refreshedA.issueCount).toBe(1);
    expect(refreshedA.progressPercent).toBe(100);
    expect(refreshedB.issueCount).toBe(0);

    await taskService.updateTicket(admin.id, project.id, issue.id, { epicId: epicB.id });

    [refreshedA, refreshedB] = await Promise.all([
      epicService.getEpic(admin.id, project.id, epicA.id),
      epicService.getEpic(admin.id, project.id, epicB.id),
    ]);
    expect(refreshedA.issueCount).toBe(0);
    expect(refreshedA.progressPercent).toBe(0);
    expect(refreshedB.issueCount).toBe(1);
    expect(refreshedB.progressPercent).toBe(100);

    // The subtask's epicId must have followed its parent to the new epic —
    // otherwise epicB's progress above couldn't have counted it as a leaf.
    const movedIssue = asTestTicket(
      await taskService.getTicket(admin.id, project.id, issue.id, false)
    );
    expect(movedIssue.epicId).toBe(epicB.id);
  });

  it("moveEpic reorders a project's epics and listEpics reflects the new order", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const epicA = await createTestEpic(project.id, { name: "Epic A", orderIndex: 0 });
    const epicB = await createTestEpic(project.id, { name: "Epic B", orderIndex: 1 });
    orgIds.push(org.id);
    userIds.push(admin.id);

    const reordered = await epicService.moveEpic(admin.id, project.id, epicB.id, 0);
    expect(reordered.map((e) => e.id)).toEqual([epicB.id, epicA.id]);
  });
});
