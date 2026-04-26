import { db } from "@/lib/db";
import { activitiesTable } from "@/modules/activity/activity.schema";
import { usersTable } from "@/modules/user/user.schema";
import { eq, desc } from "drizzle-orm";

export type ActivityInsert = typeof activitiesTable.$inferInsert;

export class ActivityRepository {
    async createActivity(data: ActivityInsert) {
        const [activity] = await db
            .insert(activitiesTable)
            .values(data)
            .returning()
            .execute();
        return activity;
    }

    async getWorkspaceActivities(workspaceId: string, limit = 20) {
        return db
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
            .where(eq(activitiesTable.workspaceId, workspaceId))
            .orderBy(desc(activitiesTable.createdAt))
            .limit(limit)
            .execute();
    }
}

export const activityRepository = new ActivityRepository();

