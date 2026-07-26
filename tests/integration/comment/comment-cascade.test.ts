import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { commentsTable } from "@/modules/comment/comment.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { commentService } from "@/modules/comment/comment.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestTask,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("comments cascade on ticket delete (AUD-019 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("deletes comments automatically when their ticket is deleted", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    const project = await createTestProject(workspace.id, owner.id);
    const task = await createTestTask(project.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const comment = await commentService.addComment({
      taskId: task.id,
      workspaceId: workspace.id,
      userId: owner.id,
      content: "This comment should not outlive its ticket.",
    });

    // Delete the ticket directly at the DB level (equivalent to taskService.deleteTicket).
    await db.delete(tasksTable).where(eq(tasksTable.id, task.id));

    const remaining = await db.select().from(commentsTable).where(eq(commentsTable.id, comment.id));
    expect(remaining).toHaveLength(0);
  });
});
