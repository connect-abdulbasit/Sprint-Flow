import { describe, it, expect, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { workspaceService } from "@/modules/workspace/workspace.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("workspaceService.removeMember / updateMemberRole (AUD-012 / AUD-013 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("lets an admin remove another member", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    const result = await workspaceService.removeMember(admin.id, workspace.id, member.id);
    expect(result.success).toBe(true);

    const rows = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, workspace.id),
          eq(workspaceMembersTable.userId, member.id)
        )
      );
    expect(rows).toHaveLength(0);
  });

  it("rejects a plain member trying to remove someone else", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const memberA = await createTestUser();
    const memberB = await createTestUser();
    userIds.push(memberA.id, memberB.id);
    await addWorkspaceMember(workspace.id, memberA.id, "member");
    await addWorkspaceMember(workspace.id, memberB.id, "member");

    await expect(
      workspaceService.removeMember(memberA.id, workspace.id, memberB.id)
    ).rejects.toThrow(/Forbidden/);
  });

  it("allows a plain member to leave the workspace on their own (self-removal)", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    const result = await workspaceService.removeMember(member.id, workspace.id, member.id);
    expect(result.success).toBe(true);
  });

  it("blocks the sole admin from removing themselves", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    await expect(workspaceService.removeMember(admin.id, workspace.id, admin.id)).rejects.toThrow(
      /only admin/i
    );
  });

  it("does not block a non-admin from leaving just because the workspace happens to have exactly one admin", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    // Regression guard: a naive "admins.length <= 1" check with no role condition would
    // wrongly block this, since the workspace has exactly one admin (just not this user).
    await expect(
      workspaceService.removeMember(member.id, workspace.id, member.id)
    ).resolves.toMatchObject({ success: true });
  });

  it("lets an admin promote a member to project_manager", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    const result = await workspaceService.updateMemberRole(
      admin.id,
      workspace.id,
      member.id,
      "project_manager"
    );
    expect(result.role).toBe("project_manager");
  });

  it("rejects a non-admin trying to change roles", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    await expect(
      workspaceService.updateMemberRole(member.id, workspace.id, member.id, "admin")
    ).rejects.toThrow(/Forbidden/);
  });

  it("blocks demoting the only admin", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    await expect(
      workspaceService.updateMemberRole(admin.id, workspace.id, admin.id, "member")
    ).rejects.toThrow(/only remaining admin/i);
  });
});
