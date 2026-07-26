import { describe, it, expect, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaceInvitesTable } from "@/modules/workspace/workspace.schema";
import { workspaceService } from "@/modules/workspace/workspace.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("workspaceService.sendInvite concurrency (AUD-042 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("never creates two pending invites for the same (workspace, email) under concurrent sends", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const email = "race-target@example.com";
    await Promise.all(
      Array.from({ length: 5 }, () =>
        workspaceService.sendInvite(admin.id, { workspaceId: workspace.id, email, role: "member" })
      )
    );

    const pendingInvites = await db
      .select()
      .from(workspaceInvitesTable)
      .where(
        and(
          eq(workspaceInvitesTable.workspaceId, workspace.id),
          eq(workspaceInvitesTable.email, email),
          eq(workspaceInvitesTable.status, "pending")
        )
      );
    expect(pendingInvites).toHaveLength(1);
  });

  it("still creates separate pending invites for different emails", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    await workspaceService.sendInvite(admin.id, {
      workspaceId: workspace.id,
      email: "a@example.com",
      role: "member",
    });
    await workspaceService.sendInvite(admin.id, {
      workspaceId: workspace.id,
      email: "b@example.com",
      role: "member",
    });

    const invites = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.workspaceId, workspace.id));
    expect(invites).toHaveLength(2);
  });
});
