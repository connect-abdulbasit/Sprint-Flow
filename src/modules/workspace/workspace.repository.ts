import { db } from "@/lib/db";
import { workspacesTable, workspaceMembersTable } from "@/db";
import { eq, and } from "drizzle-orm";

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
}

export const workspaceRepository = new WorkspaceRepository();
