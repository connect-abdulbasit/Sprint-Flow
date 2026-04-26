import { db } from "@/lib/db";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { and, asc, eq } from "drizzle-orm";

export type SprintInsert = typeof sprintsTable.$inferInsert;
export type SprintRow = typeof sprintsTable.$inferSelect;

export class SprintRepository {
  async findByProject(projectId: string) {
    return db
      .select()
      .from(sprintsTable)
      .where(eq(sprintsTable.projectId, projectId))
      .orderBy(asc(sprintsTable.startDate), asc(sprintsTable.createdAt))
      .execute();
  }

  async findById(id: string) {
    const [row] = await db.select().from(sprintsTable).where(eq(sprintsTable.id, id)).execute();
    return row ?? null;
  }

  async findByIdAndProject(id: string, projectId: string) {
    const [row] = await db
      .select()
      .from(sprintsTable)
      .where(and(eq(sprintsTable.id, id), eq(sprintsTable.projectId, projectId)))
      .execute();
    return row ?? null;
  }

  async findActiveForProject(projectId: string) {
    const [row] = await db
      .select()
      .from(sprintsTable)
      .where(and(eq(sprintsTable.projectId, projectId), eq(sprintsTable.status, "active")))
      .execute();
    return row ?? null;
  }

  async insert(data: SprintInsert) {
    const [row] = await db.insert(sprintsTable).values(data).returning().execute();
    return row!;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      goal: string | null;
      startDate: string;
      endDate: string;
      status: string;
    }>
  ) {
    const [row] = await db
      .update(sprintsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sprintsTable.id, id))
      .returning()
      .execute();
    return row ?? null;
  }

  async delete(id: string) {
    await db.delete(sprintsTable).where(eq(sprintsTable.id, id)).execute();
  }
}

export const sprintRepository = new SprintRepository();
