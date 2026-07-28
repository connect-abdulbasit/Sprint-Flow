import { db } from "@/lib/db";
import { taskDependenciesTable, tasksTable } from "@/modules/task/task.schema";
import { projectsTable } from "@/modules/project/project.schema";
import { and, eq, inArray, max, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export type TaskInsert = typeof tasksTable.$inferInsert;
export type TaskRow = typeof tasksTable.$inferSelect;

export class TaskRepository {
  async createWithNextTicketNumber(data: Omit<TaskInsert, "ticketNumber">) {
    return db.transaction(async (tx) => {
      // AUD-034: SELECT MAX + INSERT was two statements with no locking. The unique
      // index on (projectId, ticketNumber) stopped a silent duplicate, but two
      // concurrent creates in the same project could both read the same MAX and then
      // have the loser blow up with an unhandled constraint-violation 500. An
      // advisory lock scoped to the project serializes ticket-number assignment so the
      // race — and that failure mode — can't happen at all.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${data.projectId}))`);

      const [agg] = await tx
        .select({ maxNum: max(tasksTable.ticketNumber) })
        .from(tasksTable)
        .where(eq(tasksTable.projectId, data.projectId))
        .execute();
      const ticketNumber = (agg?.maxNum ?? 0) + 1;
      const [created] = await tx
        .insert(tasksTable)
        .values({ ...data, ticketNumber })
        .returning()
        .execute();
      return created;
    });
  }

  async findById(id: string) {
    const [row] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).execute();
    return row ?? null;
  }

  async findByProject(projectId: string) {
    return db
      .select({
        id: tasksTable.id,
        projectId: tasksTable.projectId,
        ticketNumber: tasksTable.ticketNumber,
        sprintId: tasksTable.sprintId,
        epicId: tasksTable.epicId,
        parentTaskId: tasksTable.parentTaskId,
        orderIndex: tasksTable.orderIndex,
        labels: tasksTable.labels,
        title: tasksTable.title,
        description: tasksTable.description,
        type: tasksTable.type,
        priority: tasksTable.priority,
        status: tasksTable.status,
        assigneeId: tasksTable.assigneeId,
        assigneeName: tasksTable.assigneeName,
        reporterId: tasksTable.reporterId,
        reporterName: tasksTable.reporterName,
        dueDate: tasksTable.dueDate,
        storyPoints: tasksTable.storyPoints,
        imageMimeType: tasksTable.imageMimeType,
        createdAt: tasksTable.createdAt,
        updatedAt: tasksTable.updatedAt,
      })
      .from(tasksTable)
      .where(eq(tasksTable.projectId, projectId))
      .orderBy(tasksTable.ticketNumber)
      .execute();
  }

  /** Minimal columns for epic progress aggregation — avoids loading full ticket rows. */
  async findProgressInputsByProject(projectId: string) {
    return db
      .select({
        id: tasksTable.id,
        epicId: tasksTable.epicId,
        parentTaskId: tasksTable.parentTaskId,
        status: tasksTable.status,
      })
      .from(tasksTable)
      .where(eq(tasksTable.projectId, projectId))
      .execute();
  }

  /** All tasks assigned to a user across every project in a workspace. */
  async findByAssigneeInWorkspace(assigneeId: string, workspaceId: string) {
    return db
      .select({
        id: tasksTable.id,
        projectId: tasksTable.projectId,
        projectName: projectsTable.name,
        ticketNumber: tasksTable.ticketNumber,
        sprintId: tasksTable.sprintId,
        epicId: tasksTable.epicId,
        parentTaskId: tasksTable.parentTaskId,
        orderIndex: tasksTable.orderIndex,
        labels: tasksTable.labels,
        title: tasksTable.title,
        description: tasksTable.description,
        type: tasksTable.type,
        priority: tasksTable.priority,
        status: tasksTable.status,
        assigneeId: tasksTable.assigneeId,
        assigneeName: tasksTable.assigneeName,
        reporterId: tasksTable.reporterId,
        reporterName: tasksTable.reporterName,
        dueDate: tasksTable.dueDate,
        storyPoints: tasksTable.storyPoints,
        imageMimeType: tasksTable.imageMimeType,
        createdAt: tasksTable.createdAt,
        updatedAt: tasksTable.updatedAt,
      })
      .from(tasksTable)
      .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .where(and(eq(tasksTable.assigneeId, assigneeId), eq(projectsTable.workspaceId, workspaceId)))
      .orderBy(tasksTable.updatedAt)
      .execute();
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      type: TaskRow["type"];
      priority: string;
      status: string;
      sprintId: string | null;
      epicId: string | null;
      parentTaskId: string | null;
      orderIndex: number;
      labels: string[] | null;
      assigneeId: string | null;
      assigneeName: string | null;
      reporterId: string;
      reporterName: string;
      dueDate: string | null;
      storyPoints: number | null;
      image: Buffer | null;
      imageMimeType: string | null;
    }>
  ) {
    const [updated] = await db
      .update(tasksTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasksTable.id, id))
      .returning()
      .execute();
    return updated ?? null;
  }

  async delete(id: string) {
    await db.transaction(async (tx) => {
      const subtaskRows = await tx
        .select({ id: tasksTable.id })
        .from(tasksTable)
        .where(eq(tasksTable.parentTaskId, id))
        .execute();
      const idsBeingRemoved = [id, ...subtaskRows.map((r) => r.id)];
      await tx
        .delete(taskDependenciesTable)
        .where(
          or(
            inArray(taskDependenciesTable.taskId, idsBeingRemoved),
            inArray(taskDependenciesTable.dependsOnTaskId, idsBeingRemoved)
          )
        )
        .execute();
      await tx.delete(tasksTable).where(eq(tasksTable.id, id)).execute();
    });
  }

  /** Direct subtasks of a task (one level only). */
  async findSubtasks(parentTaskId: string) {
    return db.select().from(tasksTable).where(eq(tasksTable.parentTaskId, parentTaskId)).execute();
  }

  async countSubtasks(parentTaskId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasksTable)
      .where(eq(tasksTable.parentTaskId, parentTaskId))
      .execute();
    return row?.count ?? 0;
  }

  /** Keeps subtasks' denormalized epicId in sync when their parent's epic changes. */
  async setEpicIdForSubtasks(parentTaskId: string, epicId: string | null) {
    await db
      .update(tasksTable)
      .set({ epicId, updatedAt: new Date() })
      .where(eq(tasksTable.parentTaskId, parentTaskId))
      .execute();
  }

  /** Ticket ids (outside `excludeTaskIds`) that depend on any of `taskIds` as a
   * prerequisite — used to pre-check the `dependsOnTaskId` ON DELETE RESTRICT
   * constraint before a cascade-delete, so a raw constraint violation never
   * surfaces as an opaque 500. */
  async findExternalDependents(taskIds: string[], excludeTaskIds: string[]) {
    if (taskIds.length === 0) return [];
    const rows = await db
      .select({ taskId: taskDependenciesTable.taskId })
      .from(taskDependenciesTable)
      .where(inArray(taskDependenciesTable.dependsOnTaskId, taskIds))
      .execute();
    const excluded = new Set(excludeTaskIds);
    return [...new Set(rows.map((r) => r.taskId))].filter((id) => !excluded.has(id));
  }

  async findByIdAndProject(taskId: string, projectId: string) {
    const [row] = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)))
      .execute();
    return row ?? null;
  }

  /** Task IDs that have at least one linked prerequisite still not in `done` status. */
  async findTaskIdsBlockedByOpenWork(projectId: string) {
    const selfTask = alias(tasksTable, "task_dep_self");
    const prereqTask = alias(tasksTable, "task_dep_prereq");
    const rows = await db
      .select({ taskId: taskDependenciesTable.taskId })
      .from(taskDependenciesTable)
      .innerJoin(selfTask, eq(selfTask.id, taskDependenciesTable.taskId))
      .innerJoin(prereqTask, eq(prereqTask.id, taskDependenciesTable.dependsOnTaskId))
      .where(
        and(
          eq(selfTask.projectId, projectId),
          eq(prereqTask.projectId, projectId),
          ne(prereqTask.status, "done")
        )
      )
      .execute();
    return new Set(rows.map((r) => r.taskId));
  }

  /** Build prerequisite adjacency within a project after removing outgoing deps from `excludeSourceTaskId` (optional). */
  async buildPrerequisiteAdjacency(projectId: string, excludeOutgoingFrom?: string | null) {
    const deps = await db
      .select({
        taskId: taskDependenciesTable.taskId,
        dependsOn: taskDependenciesTable.dependsOnTaskId,
      })
      .from(taskDependenciesTable)
      .innerJoin(tasksTable, eq(tasksTable.id, taskDependenciesTable.taskId))
      .where(eq(tasksTable.projectId, projectId))
      .execute();

    const map = new Map<string, string[]>();
    for (const d of deps) {
      if (excludeOutgoingFrom && d.taskId === excludeOutgoingFrom) continue;
      const cur = map.get(d.taskId);
      if (cur) cur.push(d.dependsOn);
      else map.set(d.taskId, [d.dependsOn]);
    }
    return map;
  }

  async replaceTaskDependencies(taskId: string, dependsOnTaskIds: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .delete(taskDependenciesTable)
        .where(eq(taskDependenciesTable.taskId, taskId))
        .execute();
      if (dependsOnTaskIds.length === 0) return;
      await tx
        .insert(taskDependenciesTable)
        .values(dependsOnTaskIds.map((dependsOnTaskId) => ({ taskId, dependsOnTaskId })))
        .execute();
    });
  }

  async listDependsOnIds(taskId: string) {
    const rows = await db
      .select({ id: taskDependenciesTable.dependsOnTaskId })
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.taskId, taskId))
      .execute();
    return rows.map((r) => r.id);
  }

  async listDependentTaskIds(prerequisiteTaskId: string) {
    const rows = await db
      .select({ taskId: taskDependenciesTable.taskId })
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.dependsOnTaskId, prerequisiteTaskId))
      .execute();
    return rows.map((r) => r.taskId);
  }

  async findTicketLinkRows(taskIds: string[], projectId: string) {
    if (taskIds.length === 0) return [];
    return db
      .select({
        id: tasksTable.id,
        ticketNumber: tasksTable.ticketNumber,
        title: tasksTable.title,
        status: tasksTable.status,
      })
      .from(tasksTable)
      .where(and(eq(tasksTable.projectId, projectId), inArray(tasksTable.id, taskIds)))
      .execute();
  }
}

export const taskRepository = new TaskRepository();
