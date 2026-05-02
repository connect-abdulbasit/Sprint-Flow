import { db } from "@/lib/db";
import {
  organizationsTable,
  organizationMembersTable,
  usersTable,
  workspacesTable,
  workspaceMembersTable,
  projectsTable,
  tasksTable,
} from "@/db";
import { eq, and, asc, inArray, sql } from "drizzle-orm";

export class OrganizationRepository {
  async createOrganization(data: typeof organizationsTable.$inferInsert) {
    const [organization] = await db.insert(organizationsTable).values(data).returning().execute();
    return organization;
  }

  async addMember(data: typeof organizationMembersTable.$inferInsert) {
    const [member] = await db.insert(organizationMembersTable).values(data).returning().execute();
    return member;
  }

  async getMember(userId: string, organizationId: string) {
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

  async getUserOrganizations(userId: string) {
    const results = await db
      .select({
        organization: organizationsTable,
        role: organizationMembersTable.role,
      })
      .from(organizationMembersTable)
      .where(eq(organizationMembersTable.userId, userId))
      .leftJoin(
        organizationsTable,
        eq(organizationMembersTable.organizationId, organizationsTable.id)
      )
      .execute();

    return results
      .map((r) => {
        if (!r.organization) return null;
        return {
          ...r.organization,
          role: r.role,
        };
      })
      .filter(Boolean);
  }

  async getOrganization(userId: string, organizationId: string) {
    const results = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.userId, userId),
          eq(organizationMembersTable.organizationId, organizationId)
        )
      )
      .leftJoin(
        organizationsTable,
        eq(organizationMembersTable.organizationId, organizationsTable.id)
      )
      .execute();

    const first = results[0];
    return first ? first.organizations : null;
  }

  async getOrganizationMembers(organizationId: string) {
    return db
      .select({
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        role: organizationMembersTable.role,
      })
      .from(organizationMembersTable)
      .innerJoin(usersTable, eq(organizationMembersTable.userId, usersTable.id))
      .where(eq(organizationMembersTable.organizationId, organizationId))
      .orderBy(asc(usersTable.name))
      .execute();
  }

  async getOrganizationWorkspaces(organizationId: string) {
    return db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.organizationId, organizationId))
      .execute();
  }

  async getUserOrganizationWorkspaces(userId: string, organizationId: string) {
    const results = await db
      .select({
        workspace: workspacesTable,
      })
      .from(workspaceMembersTable)
      .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
      .where(
        and(
          eq(workspaceMembersTable.userId, userId),
          eq(workspacesTable.organizationId, organizationId)
        )
      )
      .execute();

    return results.map((r) => r.workspace);
  }

  async getOrganizationActiveTasksCount(organizationId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasksTable)
      .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .innerJoin(workspacesTable, eq(projectsTable.workspaceId, workspacesTable.id))
      .where(
        and(
          eq(workspacesTable.organizationId, organizationId),
          sql`lower(${tasksTable.status}) <> 'done'`
        )
      )
      .execute();

    return row?.count ?? 0;
  }

  async getActiveTasksCountForWorkspaceIds(workspaceIds: string[]) {
    if (workspaceIds.length === 0) return 0;

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasksTable)
      .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .where(
        and(
          inArray(projectsTable.workspaceId, workspaceIds),
          sql`lower(${tasksTable.status}) <> 'done'`
        )
      )
      .execute();

    return row?.count ?? 0;
  }

  async updateOrganization(
    organizationId: string,
    data: Partial<typeof organizationsTable.$inferInsert>
  ) {
    const [organization] = await db
      .update(organizationsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationsTable.id, organizationId))
      .returning()
      .execute();
    return organization;
  }

  async deleteOrganization(organizationId: string) {
    await db.delete(organizationsTable).where(eq(organizationsTable.id, organizationId)).execute();
  }
}

export const organizationRepository = new OrganizationRepository();
