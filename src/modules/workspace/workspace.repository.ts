import { db } from "@/lib/db";
import {
  organizationsTable,
  workspacesTable,
  workspaceMembersTable,
  workspaceInvitesTable,
  usersTable,
  workspacePreferencesTable,
  workspaceNotificationSettingsTable,
} from "@/db";
import { organizationMembersTable } from "@/modules/organization/organization.schema";
import { and, asc, count, eq, gt, inArray } from "drizzle-orm";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export class WorkspaceRepository {
  async createWorkspace(data: typeof workspacesTable.$inferInsert) {
    const [workspace] = await db.insert(workspacesTable).values(data).returning().execute();
    return workspace;
  }

  async addMember(data: typeof workspaceMembersTable.$inferInsert) {
    const [member] = await db.insert(workspaceMembersTable).values(data).returning().execute();
    return member;
  }

  async getMember(userId: string, workspaceId: string) {
    const results = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.userId, userId),
          eq(workspaceMembersTable.workspaceId, workspaceId)
        )
      )
      .execute();
    return results[0];
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: "admin" | "project_manager" | "member"
  ) {
    const [updated] = await db
      .update(workspaceMembersTable)
      .set({ role })
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, workspaceId),
          eq(workspaceMembersTable.userId, userId)
        )
      )
      .returning()
      .execute();
    return updated;
  }

  async getUserWorkspaces(userId: string) {
    const results = await db
      .select({
        workspace: workspacesTable,
        role: workspaceMembersTable.role,
      })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, userId))
      .leftJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
      .execute();

    // AUD-053: the workspace switcher used to hardcode memberCount: 1 for every
    // workspace instead of fetching it — this replaces that with a real count.
    const workspaceIds = results
      .map((r) => r.workspace?.id)
      .filter((id): id is string => Boolean(id));
    const memberCounts = workspaceIds.length
      ? await db
          .select({ workspaceId: workspaceMembersTable.workspaceId, count: count() })
          .from(workspaceMembersTable)
          .where(inArray(workspaceMembersTable.workspaceId, workspaceIds))
          .groupBy(workspaceMembersTable.workspaceId)
          .execute()
      : [];
    const countByWorkspaceId = new Map(memberCounts.map((m) => [m.workspaceId, Number(m.count)]));

    return results
      .map((r) => {
        if (!r.workspace) return null;
        return {
          ...r.workspace,
          role: r.role,
          memberCount: countByWorkspaceId.get(r.workspace.id) ?? 1,
        };
      })
      .filter(Boolean);
  }

  async getWorkspaceById(idOrSlug: string) {
    const predicate = isUuid(idOrSlug)
      ? eq(workspacesTable.id, idOrSlug)
      : eq(workspacesTable.slug, idOrSlug);

    const results = await db.select().from(workspacesTable).where(predicate).execute();
    return results[0];
  }

  async listMembersWithUsers(workspaceId: string) {
    return db
      .select({
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: workspaceMembersTable.role,
      })
      .from(workspaceMembersTable)
      .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(eq(workspaceMembersTable.workspaceId, workspaceId))
      .orderBy(asc(usersTable.name))
      .execute();
  }
  async getWorkspaceMembers(workspaceId: string) {
    const results = await db
      .select({
        membership: workspaceMembersTable,
        user: usersTable,
      })
      .from(workspaceMembersTable)
      .leftJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(eq(workspaceMembersTable.workspaceId, workspaceId))
      .execute();
    return results;
  }

  async createInvite(data: typeof workspaceInvitesTable.$inferInsert) {
    const [invite] = await db.insert(workspaceInvitesTable).values(data).returning().execute();
    return invite;
  }

  async findAcceptedInvite(workspaceId: string, email: string) {
    const results = await db
      .select()
      .from(workspaceInvitesTable)
      .where(
        and(
          eq(workspaceInvitesTable.workspaceId, workspaceId),
          eq(workspaceInvitesTable.email, email),
          eq(workspaceInvitesTable.status, "accepted")
        )
      )
      .execute();
    return results[0];
  }

  async findInviteById(inviteId: string) {
    const results = await db
      .select()
      .from(workspaceInvitesTable)
      .where(eq(workspaceInvitesTable.id, inviteId))
      .execute();
    return results[0];
  }

  async findInviteByToken(token: string) {
    const results = await db
      .select()
      .from(workspaceInvitesTable)
      .where(
        and(eq(workspaceInvitesTable.token, token), eq(workspaceInvitesTable.status, "pending"))
      )
      .execute();
    return results[0];
  }

  async getInviteDetailsByToken(token: string) {
    const results = await db
      .select({
        invite: workspaceInvitesTable,
        workspace: workspacesTable,
        organization: organizationsTable,
        inviter: usersTable,
      })
      .from(workspaceInvitesTable)
      .leftJoin(workspacesTable, eq(workspaceInvitesTable.workspaceId, workspacesTable.id))
      .leftJoin(organizationsTable, eq(workspacesTable.organizationId, organizationsTable.id))
      .leftJoin(usersTable, eq(workspaceInvitesTable.invitedBy, usersTable.id))
      .where(eq(workspaceInvitesTable.token, token))
      .execute();
    return results[0];
  }

  async updateInviteStatus(
    inviteId: string,
    status: "pending" | "accepted" | "declined" | "revoked"
  ) {
    await db
      .update(workspaceInvitesTable)
      .set({ status })
      .where(eq(workspaceInvitesTable.id, inviteId))
      .execute();
  }

  /**
   * Atomically transitions an invite from pending -> accepted. Returns the updated row if
   * this call won the race, or undefined if the invite was already accepted/declined/revoked
   * by a concurrent request. See AUD-004.
   */
  async claimPendingInvite(inviteId: string) {
    const [claimed] = await db
      .update(workspaceInvitesTable)
      .set({ status: "accepted" })
      .where(
        and(eq(workspaceInvitesTable.id, inviteId), eq(workspaceInvitesTable.status, "pending"))
      )
      .returning()
      .execute();
    return claimed;
  }

  /**
   * Atomically transitions a pending invite to revoked, so it can never be redeemed again.
   * Returns the updated row, or undefined if it wasn't pending (already used/declined/revoked).
   * See AUD-011.
   */
  async revokePendingInvite(inviteId: string) {
    const [revoked] = await db
      .update(workspaceInvitesTable)
      .set({ status: "revoked" })
      .where(
        and(eq(workspaceInvitesTable.id, inviteId), eq(workspaceInvitesTable.status, "pending"))
      )
      .returning()
      .execute();
    return revoked;
  }

  async findUserByEmail(email: string) {
    const results = await db.select().from(usersTable).where(eq(usersTable.email, email)).execute();
    return results[0];
  }

  async getWorkspaceInvites(workspaceId: string) {
    const results = await db
      .select({
        invite: workspaceInvitesTable,
        inviter: usersTable,
      })
      .from(workspaceInvitesTable)
      .leftJoin(usersTable, eq(workspaceInvitesTable.invitedBy, usersTable.id))
      .where(
        and(
          eq(workspaceInvitesTable.workspaceId, workspaceId),
          eq(workspaceInvitesTable.status, "pending"),
          gt(workspaceInvitesTable.expiresAt, new Date())
        )
      )
      .execute();
    return results;
  }

  async addOrgMember(data: typeof organizationMembersTable.$inferInsert) {
    const [member] = await db.insert(organizationMembersTable).values(data).returning().execute();
    return member;
  }

  async getOrgMember(userId: string, organizationId: string) {
    const results = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.userId, userId),
          eq(organizationMembersTable.organizationId, organizationId)
        )
      )
      .execute();
    return results[0];
  }

  async getPrivilegedOrgMembers(organizationId: string) {
    const results = await db
      .select({
        userId: organizationMembersTable.userId,
        role: organizationMembersTable.role,
      })
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.organizationId, organizationId),
          inArray(organizationMembersTable.role, ["owner", "admin"])
        )
      )
      .execute();
    return results;
  }

  async getWorkspacesByOrganizationId(organizationId: string) {
    const results = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.organizationId, organizationId))
      .execute();
    return results;
  }

  async updateWorkspace(id: string, data: Partial<typeof workspacesTable.$inferInsert>) {
    const [workspace] = await db
      .update(workspacesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspacesTable.id, id))
      .returning()
      .execute();
    return workspace;
  }

  async deleteWorkspace(id: string) {
    await db.delete(workspacesTable).where(eq(workspacesTable.id, id)).execute();
  }

  // AUD-047: these previously had no backing storage at all — not even a table wired
  // into the schema barrel, let alone read/write code — so "Save" on the
  // preferences/notification-settings forms silently no-op'd every time.
  async getWorkspacePreferences(workspaceId: string) {
    const [row] = await db
      .select()
      .from(workspacePreferencesTable)
      .where(eq(workspacePreferencesTable.workspaceId, workspaceId))
      .execute();
    return row ?? null;
  }

  async upsertWorkspacePreferences(
    workspaceId: string,
    data: Partial<Omit<typeof workspacePreferencesTable.$inferInsert, "workspaceId">>
  ) {
    const [row] = await db
      .insert(workspacePreferencesTable)
      .values({ workspaceId, ...data })
      .onConflictDoUpdate({
        target: workspacePreferencesTable.workspaceId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning()
      .execute();
    return row;
  }

  async getWorkspaceNotificationSettings(workspaceId: string) {
    const [row] = await db
      .select()
      .from(workspaceNotificationSettingsTable)
      .where(eq(workspaceNotificationSettingsTable.workspaceId, workspaceId))
      .execute();
    return row ?? null;
  }

  async upsertWorkspaceNotificationSettings(
    workspaceId: string,
    data: Partial<Omit<typeof workspaceNotificationSettingsTable.$inferInsert, "workspaceId">>
  ) {
    const [row] = await db
      .insert(workspaceNotificationSettingsTable)
      .values({ workspaceId, ...data })
      .onConflictDoUpdate({
        target: workspaceNotificationSettingsTable.workspaceId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning()
      .execute();
    return row;
  }
}

export const workspaceRepository = new WorkspaceRepository();
