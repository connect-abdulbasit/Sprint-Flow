import { db } from "@/lib/db";
import { workspacesTable, workspaceMembersTable, workspaceInvitesTable, usersTable } from "@/db";
import { organizationMembersTable } from "@/modules/organization/organization.schema";
import { and, asc, eq } from "drizzle-orm";

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

  async getUserWorkspaces(userId: string) {
    const results = await db
      .select()
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, userId))
      .leftJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
      .execute();

    return results.map((r) => r.workspaces).filter(Boolean);
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

  // ── Workspace Invite Repository Methods ──────────────────────────

  async createInvite(data: typeof workspaceInvitesTable.$inferInsert) {
    const [invite] = await db.insert(workspaceInvitesTable).values(data).returning().execute();
    return invite;
  }

  async findPendingInvite(workspaceId: string, email: string) {
    const results = await db
      .select()
      .from(workspaceInvitesTable)
      .where(
        and(
          eq(workspaceInvitesTable.workspaceId, workspaceId),
          eq(workspaceInvitesTable.email, email),
          eq(workspaceInvitesTable.status, "pending")
        )
      )
      .execute();
    return results[0];
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
        inviter: usersTable,
      })
      .from(workspaceInvitesTable)
      .leftJoin(workspacesTable, eq(workspaceInvitesTable.workspaceId, workspacesTable.id))
      .leftJoin(usersTable, eq(workspaceInvitesTable.invitedBy, usersTable.id))
      .where(eq(workspaceInvitesTable.token, token))
      .execute();
    return results[0];
  }

  async updateInviteStatus(inviteId: string, status: "pending" | "accepted" | "declined") {
    await db
      .update(workspaceInvitesTable)
      .set({ status })
      .where(eq(workspaceInvitesTable.id, inviteId))
      .execute();
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
          eq(workspaceInvitesTable.status, "pending")
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
}

export const workspaceRepository = new WorkspaceRepository();
