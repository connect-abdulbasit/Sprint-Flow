import { db } from "@/lib/db";
import type { BoardColumnConfig } from "@/lib/board-columns";
import { projectsTable } from "@/modules/project/project.schema";
import { taskDependenciesTable, tasksTable } from "@/modules/task/task.schema";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { and, eq, inArray, or } from "drizzle-orm";

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

  async getProjectIfMemberWithRole(userId: string, projectId: string) {
    const [row] = await db
      .select({
        project: projectsTable,
        role: workspaceMembersTable.role,
      })
      .from(projectsTable)
      .innerJoin(
        workspaceMembersTable,
        eq(workspaceMembersTable.workspaceId, projectsTable.workspaceId)
      )
      .where(and(eq(projectsTable.id, projectId), eq(workspaceMembersTable.userId, userId)))
      .execute();

    if (!row) return null;
    return row;
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

  /**
   * Removes the project and all dependent data. Task dependency rows must be
   * cleared first because `depends_on_task_id` uses ON DELETE RESTRICT and
   * would otherwise block cascading task deletes when tickets reference each other.
   */
  async delete(id: string) {
    await db.transaction(async (tx) => {
      const taskRows = await tx
        .select({ id: tasksTable.id })
        .from(tasksTable)
        .where(eq(tasksTable.projectId, id))
        .execute();
      const taskIds = taskRows.map((r) => r.id);
      if (taskIds.length > 0) {
        await tx
          .delete(taskDependenciesTable)
          .where(
            or(
              inArray(taskDependenciesTable.taskId, taskIds),
              inArray(taskDependenciesTable.dependsOnTaskId, taskIds)
            )
          )
          .execute();
      }
      await tx.delete(projectsTable).where(eq(projectsTable.id, id)).execute();
    });
  }
}

export const projectRepository = new ProjectRepository();
