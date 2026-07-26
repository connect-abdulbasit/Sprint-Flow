import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { commentsTable } from "@/modules/comment/comment.schema";
import { commentService } from "@/modules/comment/comment.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestTask,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("commentService IDOR (AUD-005 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];
  const taskIds: string[] = [];

  afterEach(async () => {
    for (const taskId of taskIds) {
      await db.delete(commentsTable).where(eq(commentsTable.taskId, taskId));
    }
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
    taskIds.length = 0;
  });

  async function setupWorkspaceWithTask() {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    const project = await createTestProject(workspace.id, owner.id);
    const task = await createTestTask(project.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);
    taskIds.push(task.id);
    return { owner, org, workspace, project, task };
  }

  it("blocks a non-member from posting a comment on another workspace's task", async () => {
    const { task } = await setupWorkspaceWithTask();
    const outsider = await createTestUser();
    userIds.push(outsider.id);

    await expect(
      commentService.addComment({
        taskId: task.id,
        workspaceId: "irrelevant-does-not-grant-access",
        userId: outsider.id,
        content: "I should not be able to post this.",
      })
    ).rejects.toThrow(/Forbidden/);

    const comments = await db.select().from(commentsTable).where(eq(commentsTable.taskId, task.id));
    expect(comments).toHaveLength(0);
  });

  it("blocks a non-member from reading comments on another workspace's task", async () => {
    const { task, owner } = await setupWorkspaceWithTask();
    await commentService.addComment({
      taskId: task.id,
      workspaceId: "ignored",
      userId: owner.id,
      content: "A legitimate comment.",
    });

    const outsider = await createTestUser();
    userIds.push(outsider.id);

    await expect(commentService.getTaskComments(task.id, outsider.id)).rejects.toThrow(/Forbidden/);
  });

  it("allows a genuine workspace member to post and read comments", async () => {
    const { task, workspace } = await setupWorkspaceWithTask();
    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    const comment = await commentService.addComment({
      taskId: task.id,
      workspaceId: workspace.id,
      userId: member.id,
      content: "Legitimate member comment.",
    });
    expect(comment.content).toBe("Legitimate member comment.");

    const comments = await commentService.getTaskComments(task.id, member.id);
    expect(comments.some((c) => c.id === comment.id)).toBe(true);
  });

  it("stores the comment under the task's real workspace, ignoring a spoofed workspaceId", async () => {
    const { task, workspace } = await setupWorkspaceWithTask();

    // task.reporterId (the workspace owner) is a legitimate member; the workspaceId
    // argument below is deliberately wrong to prove it's never trusted.
    const stored = await commentService.addComment({
      taskId: task.id,
      workspaceId: "00000000-0000-0000-0000-000000000000",
      userId: task.reporterId,
      content: "Real comment, spoofed workspaceId in the request.",
    });

    const [row] = await db.select().from(commentsTable).where(eq(commentsTable.id, stored.id));
    expect(row.workspaceId).toBe(workspace.id);
  });
});
