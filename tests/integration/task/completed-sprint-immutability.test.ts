import { describe, it, expect, afterEach } from "vitest";
import { taskService } from "@/modules/task/task.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestSprint,
  createTestTask,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("taskService.updateTicket completed-sprint immutability (AUD-009 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  async function setup(sprintStatus: "planning" | "active" | "completed") {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const sprint = await createTestSprint(project.id, { status: sprintStatus });
    const task = await createTestTask(project.id, admin.id, { sprintId: sprint.id });
    orgIds.push(org.id);
    userIds.push(admin.id);
    return { admin, project, sprint, task };
  }

  it("rejects any edit to a ticket whose current sprint is completed", async () => {
    const { admin, project, task } = await setup("completed");

    await expect(
      taskService.updateTicket(admin.id, project.id, task.id, { title: "Renamed after completion" })
    ).rejects.toThrow(/completed sprint/i);
  });

  it("rejects moving a ticket out of a completed sprint into the backlog", async () => {
    const { admin, project, task } = await setup("completed");

    await expect(
      taskService.updateTicket(admin.id, project.id, task.id, { sprintId: null })
    ).rejects.toThrow(/completed sprint/i);
  });

  it("rejects a status-only change (drag on the board) for a completed-sprint ticket", async () => {
    const { admin, project, task } = await setup("completed");

    await expect(
      taskService.updateTicket(admin.id, project.id, task.id, { status: "done" })
    ).rejects.toThrow(/completed sprint/i);
  });

  it("still allows edits to a ticket in an active sprint", async () => {
    const { admin, project, task } = await setup("active");

    const updated = await taskService.updateTicket(admin.id, project.id, task.id, {
      title: "Updated while active",
    });
    expect(updated.title).toBe("Updated while active");
  });

  it("still allows edits to a backlog ticket with no sprint", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const task = await createTestTask(project.id, admin.id, { sprintId: null });
    orgIds.push(org.id);
    userIds.push(admin.id);

    const updated = await taskService.updateTicket(admin.id, project.id, task.id, {
      title: "Backlog edit",
    });
    expect(updated.title).toBe("Backlog edit");
  });
});
