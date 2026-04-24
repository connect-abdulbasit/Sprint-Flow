import { db } from "@/lib/db";
import { workspacesTable, workspaceMembersTable } from "@/db";
import { eq, and } from "drizzle-orm";
import { BaseRepository } from "@/repositories/base.repository";

export class WorkspaceRepository extends BaseRepository<any> {
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

  async getWorkspaceById(id: string) {
    const results = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, id))
      .execute();
    return results[0];
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
}

export const workspaceRepository = new WorkspaceRepository();
