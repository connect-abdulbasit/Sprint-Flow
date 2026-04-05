import { db } from "@/lib/db";
import { projectsTable, projectMembersTable } from "./project.schema";
import { eq, and } from "drizzle-orm";

export const projectRepository = {
  async findProjectsByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.workspaceId, workspaceId))
      .orderBy(projectsTable.createdAt);
  },

  async createProject(data: {
    name: string;
    description?: string;
    workspaceId: string;
    createdBy: string;
  }) {
    // We use a transaction because we need to safely create the Project AND add the creator as an owner in project_members
    return db.transaction(async (tx: any) => {
      const [newProject] = await tx
        .insert(projectsTable)
        .values({
          name: data.name,
          description: data.description,
          workspaceId: data.workspaceId,
          createdBy: data.createdBy,
          status: "active",
        })
        .returning();

      if (newProject) {
        await tx.insert(projectMembersTable).values({
          projectId: newProject.id,
          userId: data.createdBy,
          role: "owner",
        });
      }

      return newProject;
    });
  },

  async updateProject(id: string, data: { name?: string; description?: string }) {
    const [updatedProject] = await db
      .update(projectsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projectsTable.id, id))
      .returning();

    return updatedProject;
  },

  async deleteProject(id: string) {
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
  },
};
