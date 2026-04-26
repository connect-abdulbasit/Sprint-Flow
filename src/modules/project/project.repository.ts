import { db } from "@/lib/db";
import type { BoardColumnConfig } from "@/lib/board-columns";
import { projectsTable } from "@/modules/project/project.schema";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { and, eq } from "drizzle-orm";

export class ProjectRepository {
  async findByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.workspaceId, workspaceId))
      .orderBy(projectsTable.createdAt)
      .execute();
  }

  async findById(id: string) {
    const results = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).execute();
    return results[0] ?? null;
  }

  async isProjectMember(projectId: string, userId: string) {
    const project = await this.findById(projectId);
    if (!project) return false;

    const [row] = await db
      .select({ userId: workspaceMembersTable.userId })
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.userId, userId),
          eq(workspaceMembersTable.workspaceId, project.workspaceId)
        )
      )
      .execute();
    return Boolean(row);
  }

  async getProjectIfMember(userId: string, projectId: string) {
    const project = await this.findById(projectId);
    if (!project) return null;
    const ok = await this.isProjectMember(projectId, userId);
    return ok ? project : null;
  }

  async create(data: {
    name: string;
    description?: string;
    workspaceId: string;
    createdBy: string;
  }) {
    const [project] = await db
      .insert(projectsTable)
      .values({
        name: data.name,
        description: data.description,
        workspaceId: data.workspaceId,
        createdBy: data.createdBy,
        status: "active",
      })
      .returning();

    return project;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      boardColumns?: BoardColumnConfig[] | null;
    }
  ) {
    const [updated] = await db
      .update(projectsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning()
      .execute();
    return updated ?? null;
  }

  async delete(id: string) {
    await db.delete(projectsTable).where(eq(projectsTable.id, id)).execute();
  }
}

export const projectRepository = new ProjectRepository();
