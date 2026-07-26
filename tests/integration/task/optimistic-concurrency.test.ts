import { describe, it, expect, afterEach } from "vitest";
import { taskService } from "@/modules/task/task.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestTask,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("taskService.updateTicket optimistic concurrency (AUD-036 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("rejects an update whose expectedUpdatedAt no longer matches (someone else changed it first)", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const task = await createTestTask(project.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const staleUpdatedAt = task.updatedAt.toISOString();

    // Someone else's change lands first.
    await taskService.updateTicket(admin.id, project.id, task.id, { status: "in_progress" });

    // This caller is still holding the pre-change updatedAt.
    await expect(
      taskService.updateTicket(admin.id, project.id, task.id, {
        status: "done",
        expectedUpdatedAt: staleUpdatedAt,
      })
    ).rejects.toThrow(/CONFLICT/);
  });

  it("allows the update when expectedUpdatedAt matches the current row", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const task = await createTestTask(project.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const updated = await taskService.updateTicket(admin.id, project.id, task.id, {
      status: "in_progress",
      expectedUpdatedAt: task.updatedAt.toISOString(),
    });
    expect(updated.status).toBe("in_progress");
  });

  it("allows the update when expectedUpdatedAt is omitted (opt-in only)", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const task = await createTestTask(project.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    await taskService.updateTicket(admin.id, project.id, task.id, { status: "in_progress" });
    const updated = await taskService.updateTicket(admin.id, project.id, task.id, {
      status: "done",
    });
    expect(updated.status).toBe("done");
  });
});
