import { db } from "@/lib/db";
import { timeEntriesTable } from "@/modules/time_entry/time_entry.schema";
import { usersTable } from "@/modules/user/user.schema";
import { and, desc, eq } from "drizzle-orm";

export type TimeEntryInsert = typeof timeEntriesTable.$inferInsert;
export type TimeEntryRow = typeof timeEntriesTable.$inferSelect;

export class TimeEntryRepository {
  async findByTaskWithUsers(taskId: string) {
    return db
      .select({
        id: timeEntriesTable.id,
        taskId: timeEntriesTable.taskId,
        userId: timeEntriesTable.userId,
        hours: timeEntriesTable.hours,
        description: timeEntriesTable.description,
        createdAt: timeEntriesTable.createdAt,
        updatedAt: timeEntriesTable.updatedAt,
        userName: usersTable.name,
      })
      .from(timeEntriesTable)
      .innerJoin(usersTable, eq(usersTable.id, timeEntriesTable.userId))
      .where(eq(timeEntriesTable.taskId, taskId))
      .orderBy(desc(timeEntriesTable.createdAt))
      .execute();
  }

  async findByIdAndTask(entryId: string, taskId: string) {
    const [row] = await db
      .select()
      .from(timeEntriesTable)
      .where(and(eq(timeEntriesTable.id, entryId), eq(timeEntriesTable.taskId, taskId)))
      .execute();
    return row ?? null;
  }

  async create(data: TimeEntryInsert) {
    const [row] = await db.insert(timeEntriesTable).values(data).returning().execute();
    return row ?? null;
  }

  async delete(entryId: string) {
    await db.delete(timeEntriesTable).where(eq(timeEntriesTable.id, entryId)).execute();
  }
}

export const timeEntryRepository = new TimeEntryRepository();
