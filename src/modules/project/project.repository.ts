import { db } from "@/lib/db";
import { projectsTable } from "@/modules/project/project.schema";
import { eq } from "drizzle-orm";

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

  async update(id: string, data: { name?: string; description?: string }) {
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
