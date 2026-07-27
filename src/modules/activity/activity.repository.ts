import { db } from "@/lib/db";
import { activitiesTable } from "@/modules/activity/activity.schema";
import { usersTable } from "@/modules/user/user.schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { buildPaginationMeta, type PaginationInput } from "@/lib/pagination";

export type ActivityInsert = typeof activitiesTable.$inferInsert;
type ActivitySelect = {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  createdAt: Date;
};

export class ActivityRepository {
  async createActivity(data: ActivityInsert) {
    const [activity] = await db.insert(activitiesTable).values(data).returning().execute();
    return activity;
  }

  async getWorkspaceActivities(workspaceId: string, pagination: PaginationInput) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    const whereClause = eq(activitiesTable.workspaceId, workspaceId);

    const [totals, items] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(activitiesTable)
        .where(whereClause)
        .execute(),
      db
        .select({
          id: activitiesTable.id,
          workspaceId: activitiesTable.workspaceId,
          userId: activitiesTable.userId,
          userName: usersTable.name,
          action: activitiesTable.action,
          entityType: activitiesTable.entityType,
          entityId: activitiesTable.entityId,
          entityName: activitiesTable.entityName,
          createdAt: activitiesTable.createdAt,
        })
        .from(activitiesTable)
        .innerJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
        .where(whereClause)
        .orderBy(desc(activitiesTable.createdAt))
        .limit(pagination.pageSize)
        .offset(offset)
        .execute(),
    ]);

    const total = totals[0]?.count ?? 0;

    return {
      items: items as ActivitySelect[],
      pagination: buildPaginationMeta(pagination, total),
    };
  }

  /** Per-entity feed (e.g. one epic's or one task's activity), same shape as
   * `getWorkspaceActivities` but scoped to a single entityType+entityId. */
  async getEntityActivities(entityType: string, entityId: string, pagination: PaginationInput) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    const whereClause = and(
      eq(activitiesTable.entityType, entityType),
      eq(activitiesTable.entityId, entityId)
    );

    const [totals, items] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(activitiesTable)
        .where(whereClause)
        .execute(),
      db
        .select({
          id: activitiesTable.id,
          workspaceId: activitiesTable.workspaceId,
          userId: activitiesTable.userId,
          userName: usersTable.name,
          action: activitiesTable.action,
          entityType: activitiesTable.entityType,
          entityId: activitiesTable.entityId,
          entityName: activitiesTable.entityName,
          createdAt: activitiesTable.createdAt,
        })
        .from(activitiesTable)
        .innerJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
        .where(whereClause)
        .orderBy(desc(activitiesTable.createdAt))
        .limit(pagination.pageSize)
        .offset(offset)
        .execute(),
    ]);

    const total = totals[0]?.count ?? 0;

    return {
      items: items as ActivitySelect[],
      pagination: buildPaginationMeta(pagination, total),
    };
  }
}

export const activityRepository = new ActivityRepository();
