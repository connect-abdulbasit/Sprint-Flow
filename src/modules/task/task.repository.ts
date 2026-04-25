import { db } from "@/lib/db";
import { tasksTable } from "@/modules/task/task.schema";
import { and, eq, max } from "drizzle-orm";

export type TaskInsert = typeof tasksTable.$inferInsert;
export type TaskRow = typeof tasksTable.$inferSelect;

export class TaskRepository {
  async createWithNextTicketNumber(data: Omit<TaskInsert, "ticketNumber">) {
    return db.transaction(async (tx) => {
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

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      type: TaskRow["type"];
      priority: string;
      status: string;
      sprintId: string | null;
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
    await db.delete(tasksTable).where(eq(tasksTable.id, id)).execute();
  }

  async findByIdAndProject(taskId: string, projectId: string) {
    const [row] = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)))
      .execute();
    return row ?? null;
  }
}

export const taskRepository = new TaskRepository();
