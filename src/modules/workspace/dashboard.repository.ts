import { db } from "@/lib/db";
import { projectsTable } from "@/modules/project/project.schema";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { usersTable } from "@/modules/user/user.schema";
import { eq, inArray, desc, and } from "drizzle-orm";

export class DashboardRepository {
  async getWorkspaceProjects(workspaceId: string) {
    return db
      .select({ id: projectsTable.id, name: projectsTable.name })
      .from(projectsTable)
      .where(eq(projectsTable.workspaceId, workspaceId))
      .execute();
  }

  async getActiveSprintForProjects(projectIds: string[]) {
    if (projectIds.length === 0) return null;
    const [row] = await db
      .select({
        id: sprintsTable.id,
        name: sprintsTable.name,
        startDate: sprintsTable.startDate,
        endDate: sprintsTable.endDate,
        status: sprintsTable.status,
        projectId: sprintsTable.projectId,
        projectName: projectsTable.name,
      })
      .from(sprintsTable)
      .innerJoin(projectsTable, eq(sprintsTable.projectId, projectsTable.id))
      .where(and(inArray(sprintsTable.projectId, projectIds), eq(sprintsTable.status, "active")))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async getSprintTasks(sprintId: string) {
    return db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        status: tasksTable.status,
        priority: tasksTable.priority,
        assigneeId: tasksTable.assigneeId,
        assigneeName: tasksTable.assigneeName,
        storyPoints: tasksTable.storyPoints,
        ticketNumber: tasksTable.ticketNumber,
        projectId: tasksTable.projectId,
        updatedAt: tasksTable.updatedAt,
      })
      .from(tasksTable)
      .where(eq(tasksTable.sprintId, sprintId))
      .execute();
  }

  async getRecentWorkspaceTasks(projectIds: string[], limit = 5) {
    if (projectIds.length === 0) return [];
    return db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        status: tasksTable.status,
        priority: tasksTable.priority,
        assigneeName: tasksTable.assigneeName,
        ticketNumber: tasksTable.ticketNumber,
        projectId: tasksTable.projectId,
        updatedAt: tasksTable.updatedAt,
      })
      .from(tasksTable)
      .where(inArray(tasksTable.projectId, projectIds))
      .orderBy(desc(tasksTable.updatedAt))
      .limit(limit)
      .execute();
  }

  async getWorkspaceMemberCount(workspaceId: string) {
    const rows = await db
      .select({ userId: usersTable.id, name: usersTable.name })
      .from(workspaceMembersTable)
      .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(eq(workspaceMembersTable.workspaceId, workspaceId))
      .execute();
    return rows;
  }
}

export const dashboardRepository = new DashboardRepository();
