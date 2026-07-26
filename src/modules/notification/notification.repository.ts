import { db } from "@/lib/db";
import { notificationsTable } from "@/db";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

export type NotificationPaginationInput = {
  page: number;
  pageSize: number;
};

export type NotificationPaginatedResult = {
  items: Array<typeof notificationsTable.$inferSelect>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  unreadCount: number;
};

export class NotificationRepository {
  async createNotification(data: typeof notificationsTable.$inferInsert) {
    const [notification] = await db.insert(notificationsTable).values(data).returning().execute();
    return notification;
  }

  async getNotificationsForUser(
    userId: string,
    pagination: NotificationPaginationInput
  ): Promise<NotificationPaginatedResult> {
    // AUD-040: this previously filtered only by userId, with no live membership check —
    // a user removed from a workspace kept seeing that workspace's historical
    // notifications forever via this global endpoint. Scope to workspaces the user is
    // still actually a member of.
    const currentWorkspaceIds = db
      .select({ workspaceId: workspaceMembersTable.workspaceId })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, userId));
    const whereClause = and(
      eq(notificationsTable.userId, userId),
      inArray(notificationsTable.workspaceId, currentWorkspaceIds)
    );
    const offset = (pagination.page - 1) * pagination.pageSize;

    const [totals, unreadTotals, items] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(whereClause)
        .execute(),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(and(whereClause, eq(notificationsTable.isRead, false)))
        .execute(),
      db
        .select()
        .from(notificationsTable)
        .where(whereClause)
        .orderBy(desc(notificationsTable.createdAt))
        .limit(pagination.pageSize)
        .offset(offset)
        .execute(),
    ]);

    const total = totals[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

    return {
      items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages,
        hasPreviousPage: pagination.page > 1,
        hasNextPage: pagination.page < totalPages,
      },
      unreadCount: unreadTotals[0]?.count ?? 0,
    };
  }

  async getNotificationsForUserAndWorkspace(
    userId: string,
    workspaceId: string,
    pagination: NotificationPaginationInput
  ): Promise<NotificationPaginatedResult> {
    const whereClause = and(
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.workspaceId, workspaceId)
    );
    const offset = (pagination.page - 1) * pagination.pageSize;

    const [totals, unreadTotals, items] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(whereClause)
        .execute(),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(and(whereClause, eq(notificationsTable.isRead, false)))
        .execute(),
      db
        .select()
        .from(notificationsTable)
        .where(whereClause)
        .orderBy(desc(notificationsTable.createdAt))
        .limit(pagination.pageSize)
        .offset(offset)
        .execute(),
    ]);

    const total = totals[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

    return {
      items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages,
        hasPreviousPage: pagination.page > 1,
        hasNextPage: pagination.page < totalPages,
      },
      unreadCount: unreadTotals[0]?.count ?? 0,
    };
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
