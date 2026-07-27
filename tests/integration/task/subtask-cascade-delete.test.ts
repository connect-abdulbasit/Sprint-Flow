import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasksTable } from "@/modules/task/task.schema";
import { taskService } from "@/modules/task/task.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  cleanupTestData,
} from "../../helpers/db-fixtures";
import { asTestTicket } from "../../helpers/ticket-shape";

describe("deleting a parent ticket cascades to its subtasks", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("removes the parent's subtask rows from the database, not just the parent", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const parent = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent",
        reporterName: admin.name,
      })
    );
    const subtaskA = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask A",
        reporterName: admin.name,
        parentTaskId: parent.id,
      })
    );
    const subtaskB = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask B",
        reporterName: admin.name,
        parentTaskId: parent.id,
      })
    );

    await taskService.deleteTicket(admin.id, project.id, parent.id);

    const remaining = await db
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(eq(tasksTable.projectId, project.id));
    const remainingIds = new Set(remaining.map((r) => r.id));
    expect(remainingIds.has(parent.id)).toBe(false);
    expect(remainingIds.has(subtaskA.id)).toBe(false);
    expect(remainingIds.has(subtaskB.id)).toBe(false);
  });

  it("clears dependency edges involving the parent or its subtasks so the delete never hits a FK conflict", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const parent = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent",
        reporterName: admin.name,
      })
    );
    const subtask = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask",
        reporterName: admin.name,
        parentTaskId: parent.id,
      })
    );
    // An unrelated ticket depends on the subtask as a prerequisite.
    const dependent = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Depends on subtask",
        reporterName: admin.name,
        dependsOnTaskIds: [subtask.id],
      })
    );

    await expect(
      taskService.deleteTicket(admin.id, project.id, parent.id)
    ).resolves.toBeUndefined();

    const stillThere = asTestTicket(
      await taskService.getTicket(admin.id, project.id, dependent.id, false)
    );
    expect(stillThere.dependsOn).toEqual([]);
  });
});
