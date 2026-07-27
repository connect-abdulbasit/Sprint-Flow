import { db } from "@/lib/db";
import { epicsTable } from "@/modules/epic/epic.schema";
import { and, eq, isNull, max, sql, type SQL } from "drizzle-orm";

export type EpicInsert = typeof epicsTable.$inferInsert;
export type EpicRow = typeof epicsTable.$inferSelect;

export class EpicRepository {
  async findByProject(projectId: string, opts?: { includeArchived?: boolean }) {
    const conditions: SQL[] = [eq(epicsTable.projectId, projectId)];
    if (!opts?.includeArchived) {
      conditions.push(isNull(epicsTable.archivedAt));
    }
    return db
      .select()
      .from(epicsTable)
      .where(and(...conditions))
      .orderBy(epicsTable.orderIndex)
      .execute();
  }

  async findById(epicId: string) {
    const [row] = await db.select().from(epicsTable).where(eq(epicsTable.id, epicId)).execute();
    return row ?? null;
  }

  async findByIdAndProject(epicId: string, projectId: string) {
    const [row] = await db
      .select()
      .from(epicsTable)
      .where(and(eq(epicsTable.id, epicId), eq(epicsTable.projectId, projectId)))
      .execute();
    return row ?? null;
  }

  /** Advisory-lock-serialized, same idiom as `taskRepository.createWithNextTicketNumber`. */
  async insertWithNextOrderIndex(data: Omit<EpicInsert, "orderIndex">) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${data.projectId} || ':epics'))`);
      const [agg] = await tx
        .select({ maxIndex: max(epicsTable.orderIndex) })
        .from(epicsTable)
        .where(eq(epicsTable.projectId, data.projectId))
        .execute();
      const orderIndex = (agg?.maxIndex ?? -1) + 1;
      const [created] = await tx
        .insert(epicsTable)
        .values({ ...data, orderIndex })
        .returning()
        .execute();
      return created;
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      status: string;
      priority: string;
      ownerId: string | null;
      ownerName: string | null;
      color: string | null;
      icon: string | null;
      labels: string[] | null;
      startDate: string | null;
      dueDate: string | null;
      orderIndex: number;
      archivedAt: Date | null;
    }>
  ) {
    const [updated] = await db
      .update(epicsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(epicsTable.id, id))
      .returning()
      .execute();
    return updated ?? null;
  }

  async delete(id: string) {
    await db.delete(epicsTable).where(eq(epicsTable.id, id)).execute();
  }

  /** Rewrites orderIndex 0..n-1 for a project's non-archived epics in the given order. */
  async reindexOrder(projectId: string, orderedEpicIds: string[]) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedEpicIds.length; i++) {
        await tx
          .update(epicsTable)
          .set({ orderIndex: i, updatedAt: new Date() })
          .where(and(eq(epicsTable.id, orderedEpicIds[i]), eq(epicsTable.projectId, projectId)))
          .execute();
      }
    });
  }
}

export const epicRepository = new EpicRepository();
