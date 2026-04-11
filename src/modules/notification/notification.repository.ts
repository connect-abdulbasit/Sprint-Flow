import { db } from "@/lib/db";
import { notificationsTable } from "@/db";
import { eq, and } from "drizzle-orm";

export class NotificationRepository {
  async createNotification(data: typeof notificationsTable.$inferInsert) {
    const [notification] = await db.insert(notificationsTable).values(data).returning().execute();
    return notification;
  }

  async getNotificationsForUser(userId: string) {
    const results = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(notificationsTable.createdAt)
      .execute();

    return results;
  }

  async getNotificationsForUserAndWorkspace(userId: string, workspaceId: string) {
    const results = await db
      .select()
      .from(notificationsTable)
      .where(
        and(eq(notificationsTable.userId, userId), eq(notificationsTable.workspaceId, workspaceId))
      )
      .orderBy(notificationsTable.createdAt)
      .execute();

    return results;
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    await db
      .update(notificationsTable)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, userId)))
      .execute();
  }

  async markAllNotificationsAsRead(userId: string) {
    await db
      .update(notificationsTable)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notificationsTable.userId, userId))
      .execute();
  }
}

export const notificationRepository = new NotificationRepository();
