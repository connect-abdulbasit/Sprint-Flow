import { db } from "@/lib/db";
import { attachmentsTable } from "@/modules/attachment/attachment.schema";
import { usersTable } from "@/modules/user/user.schema";
import { eq, desc } from "drizzle-orm";

export type AttachmentInsert = typeof attachmentsTable.$inferInsert;
export type AttachmentRow = typeof attachmentsTable.$inferSelect;

export class AttachmentRepository {
  private async listWhere(whereClause: ReturnType<typeof eq>) {
    return db
      .select({
        id: attachmentsTable.id,
        taskId: attachmentsTable.taskId,
        epicId: attachmentsTable.epicId,
        fileUrl: attachmentsTable.fileUrl,
        label: attachmentsTable.label,
        uploadedBy: attachmentsTable.uploadedBy,
        uploaderName: usersTable.name,
        createdAt: attachmentsTable.createdAt,
        updatedAt: attachmentsTable.updatedAt,
      })
      .from(attachmentsTable)
      .innerJoin(usersTable, eq(attachmentsTable.uploadedBy, usersTable.id))
      .where(whereClause)
      .orderBy(desc(attachmentsTable.createdAt))
      .execute();
  }

  async findByTask(taskId: string) {
    return this.listWhere(eq(attachmentsTable.taskId, taskId));
  }

  async findByEpic(epicId: string) {
    return this.listWhere(eq(attachmentsTable.epicId, epicId));
  }

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(attachmentsTable)
      .where(eq(attachmentsTable.id, id))
      .execute();
    return row ?? null;
  }

  async create(data: AttachmentInsert) {
    const [row] = await db.insert(attachmentsTable).values(data).returning().execute();
    return row;
  }

  async delete(id: string) {
    await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id)).execute();
  }
}

export const attachmentRepository = new AttachmentRepository();
