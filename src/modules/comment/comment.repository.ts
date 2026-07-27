import { db } from "@/lib/db";
import { commentsTable } from "./comment.schema";
import { usersTable } from "@/modules/user/user.schema";
import { eq, and, asc } from "drizzle-orm";

export type CommentInsert = typeof commentsTable.$inferInsert;
export type CommentSelect = typeof commentsTable.$inferSelect;

interface CommentRow {
  id: string;
  taskId: string | null;
  epicId: string | null;
  workspaceId: string;
  userId: string;
  content: string;
  parentId: string | null;
  mentionedUserIds: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userAvatarUrl: string | null;
  canDelete: boolean;
}

export class CommentRepository {
  async createComment(data: CommentInsert) {
    const [row] = await db.insert(commentsTable).values(data).returning().execute();
    return row;
  }

  async getTaskComments(taskId: string, currentUserId?: string): Promise<CommentRow[]> {
    return this.getCommentsWhere(eq(commentsTable.taskId, taskId), currentUserId);
  }

  async getEpicComments(epicId: string, currentUserId?: string): Promise<CommentRow[]> {
    return this.getCommentsWhere(eq(commentsTable.epicId, epicId), currentUserId);
  }

  private async getCommentsWhere(
    whereClause: ReturnType<typeof eq>,
    currentUserId?: string
  ): Promise<CommentRow[]> {
    const rows = await db
      .select({
        id: commentsTable.id,
        taskId: commentsTable.taskId,
        epicId: commentsTable.epicId,
        workspaceId: commentsTable.workspaceId,
        userId: commentsTable.userId,
        content: commentsTable.content,
        parentId: commentsTable.parentId,
        mentionedUserIds: commentsTable.mentionedUserIds,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        userName: usersTable.name,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(asc(commentsTable.createdAt))
      .execute();

    return rows.map((row) => ({
      ...row,
      userName: row.userName ?? "Unknown",
      userAvatarUrl: null,
      canDelete: currentUserId ? row.userId === currentUserId : false,
    }));
  }

  async getCommentById(commentId: string) {
    const [row] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async deleteComment(commentId: string, userId: string) {
    await db
      .delete(commentsTable)
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.userId, userId)))
      .execute();
  }
}

export const commentRepository = new CommentRepository();
