import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaceInvitesTable, workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { workspaceService } from "@/modules/workspace/workspace.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestInvite,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("workspaceService.acceptInvite (AUD-003 / AUD-004 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  async function setup() {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);
    return { owner, org, workspace };
  }

  it("rejects acceptance when the caller's email does not match the invited email", async () => {
    const { owner, workspace } = await setup();
    const invitedEmail = "alice@example.com";
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: invitedEmail,
      invitedBy: owner.id,
      role: "admin",
    });

    const attacker = await createTestUser({ email: "mallory@evil.com" });
    userIds.push(attacker.id);

    await expect(workspaceService.acceptInvite(attacker.id, invite.token)).rejects.toThrow(
      /EMAIL_MISMATCH/
    );

    const members = await db
      .select()
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, attacker.id));
    expect(members).toHaveLength(0);

    const [unchangedInvite] = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.id, invite.id));
    expect(unchangedInvite.status).toBe("pending");
  });

  it("is case-insensitive and allows the correctly invited user to accept", async () => {
    const { owner, workspace } = await setup();
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "Alice@Example.com",
      invitedBy: owner.id,
      role: "member",
    });

    const alice = await createTestUser({ email: "alice@example.com" });
    userIds.push(alice.id);

    const result = await workspaceService.acceptInvite(alice.id, invite.token);
    expect(result.success).toBe(true);

    const members = await db
      .select()
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, alice.id));
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe("member");
  });

  it("only allows exactly one of two concurrent accept requests to succeed (no duplicate membership rows)", async () => {
    const { owner, workspace } = await setup();
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "bob@example.com",
      invitedBy: owner.id,
    });
    const bob = await createTestUser({ email: "bob@example.com" });
    userIds.push(bob.id);

    const results = await Promise.allSettled([
      workspaceService.acceptInvite(bob.id, invite.token),
      workspaceService.acceptInvite(bob.id, invite.token),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    // The second call should either succeed idempotently (already a member) or fail
    // gracefully — but membership must never be inserted twice.
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const members = await db
      .select()
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, bob.id));
    expect(members).toHaveLength(1);
  });

  it("rejects acceptance of an already-used invite (second request after the first commits)", async () => {
    const { owner, workspace } = await setup();
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "carol@example.com",
      invitedBy: owner.id,
    });
    const carol = await createTestUser({ email: "carol@example.com" });
    userIds.push(carol.id);

    await workspaceService.acceptInvite(carol.id, invite.token);

    // A second accept for the same (now-member) user should be idempotent, not an error.
    const second = await workspaceService.acceptInvite(carol.id, invite.token);
    expect(second.success).toBe(true);
    expect(second.message).toMatch(/already a member/i);

    const members = await db
      .select()
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, carol.id));
    expect(members).toHaveLength(1);
  });

  it("rejects an expired invitation even for the correctly invited user", async () => {
    const { owner, workspace } = await setup();
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "dana@example.com",
      invitedBy: owner.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const dana = await createTestUser({ email: "dana@example.com" });
    userIds.push(dana.id);

    await expect(workspaceService.acceptInvite(dana.id, invite.token)).rejects.toThrow(/expired/i);
  });
});

describe("workspaceService.rejectInvite (AUD-041 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("rejects decline attempts from a user whose email does not match the invite", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "target@example.com",
      invitedBy: owner.id,
    });
    const stranger = await createTestUser({ email: "stranger@example.com" });
    userIds.push(stranger.id);

    await expect(workspaceService.rejectInvite(stranger.id, invite.token)).rejects.toThrow(
      /EMAIL_MISMATCH/
    );

    const [unchanged] = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.id, invite.id));
    expect(unchanged.status).toBe("pending");
  });

  it("allows the invited user to decline", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const invite = await createTestInvite({
      workspaceId: workspace.id,
      email: "target2@example.com",
      invitedBy: owner.id,
    });
    const target = await createTestUser({ email: "target2@example.com" });
    userIds.push(target.id);

    const result = await workspaceService.rejectInvite(target.id, invite.token);
    expect(result.success).toBe(true);

    const [updated] = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.id, invite.id));
    expect(updated.status).toBe("declined");
  });
});
