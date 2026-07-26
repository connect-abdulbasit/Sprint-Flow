import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaceInvitesTable } from "@/modules/workspace/workspace.schema";
import { workspaceService } from "@/modules/workspace/workspace.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestInvite,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("workspaceService.revokeInvite (AUD-011 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("permanently invalidates the invite so it can no longer be accepted", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "invitee@example.com",
      invitedBy: admin.id,
    });

    const result = await workspaceService.revokeInvite(admin.id, workspace.id, invite.id);
    expect(result.success).toBe(true);

    const [row] = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.id, invite.id));
    expect(row.status).toBe("revoked");

    const invitee = await createTestUser({ email: "invitee@example.com" });
    userIds.push(invitee.id);
    await expect(workspaceService.acceptInvite(invitee.id, invite.token)).rejects.toThrow(
      /revoked/i
    );
  });

  it("rejects revocation attempts from a plain member (requires project_manager+)", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "someone@example.com",
      invitedBy: admin.id,
    });

    const plainMember = await createTestUser();
    userIds.push(plainMember.id);
    await addWorkspaceMember(workspace.id, plainMember.id, "member");

    await expect(
      workspaceService.revokeInvite(plainMember.id, workspace.id, invite.id)
    ).rejects.toThrow(/Forbidden/);

    const [row] = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.id, invite.id));
    expect(row.status).toBe("pending");
  });

  it("rejects revoking an invite that isn't pending (already accepted)", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "already@example.com",
      invitedBy: admin.id,
      status: "accepted",
    });

    await expect(workspaceService.revokeInvite(admin.id, workspace.id, invite.id)).rejects.toThrow(
      /already accepted/i
    );
  });
});
