import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationsTable } from "@/modules/notification/notification.schema";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { notificationService } from "@/modules/notification/notification.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

async function createTestNotification(workspaceId: string, userId: string) {
  const [row] = await db
    .insert(notificationsTable)
    .values({
      workspaceId,
      userId,
      type: "general",
      targetType: "none",
      title: "Historical notification",
      message: "You were mentioned before you left this workspace.",
    })
    .returning();
  return row;
}

describe("notifications after workspace removal (AUD-040 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    userIds.length = 0;
    orgIds.length = 0;
  });

  it("excludes a workspace's notifications from the global feed once the user is removed", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");
    await createTestNotification(workspace.id, member.id);

    const before = await notificationService.getUserNotifications(member.id, {
      page: 1,
      pageSize: 20,
    });
    expect(before.items).toHaveLength(1);

    // Remove the member from the workspace.
    await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.userId, member.id));

    const after = await notificationService.getUserNotifications(member.id, {
      page: 1,
      pageSize: 20,
    });
    expect(after.items).toHaveLength(0);
    expect(after.pagination.total).toBe(0);
  });

  it("returns an empty result from the workspace-scoped endpoint for a removed member", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");
    await createTestNotification(workspace.id, member.id);

    await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.userId, member.id));

    const result = await notificationService.getWorkspaceNotifications(member.id, workspace.id, {
      page: 1,
      pageSize: 20,
    });
    expect(result.items).toHaveLength(0);
  });

  it("still shows notifications to a current member", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);
    await createTestNotification(workspace.id, admin.id);

    const result = await notificationService.getWorkspaceNotifications(admin.id, workspace.id, {
      page: 1,
      pageSize: 20,
    });
    expect(result.items).toHaveLength(1);
  });
});
