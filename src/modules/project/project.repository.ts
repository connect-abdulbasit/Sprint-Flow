import { db } from "@/lib/db";
import { projectsTable, projectMembersTable } from "@/modules/project/project.schema";
import { usersTable } from "@/modules/user/user.schema";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { and, asc, eq } from "drizzle-orm";

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
          eq(workspaceMembersTable.workspaceId, project.workspaceId),
          eq(workspaceMembersTable.userId, userId)
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
    return db.transaction(async (tx: any) => {
      const [project] = await tx
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
    });
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
    // Cascade deletes project_members automatically (FK constraint)
    await db.delete(projectsTable).where(eq(projectsTable.id, id)).execute();
  }

  async listMembersWithUsers(projectId: string) {
    return db
      .select({
        userId: projectMembersTable.userId,
        name: usersTable.name,
        email: usersTable.email,
        role: projectMembersTable.role,
      })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
      .where(eq(projectMembersTable.projectId, projectId))
      .orderBy(asc(usersTable.name))
      .execute();
  }
}

export const projectRepository = new ProjectRepository();
