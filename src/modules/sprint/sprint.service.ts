import { db } from "@/lib/db";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { projectsTable } from "@/modules/project/project.schema";
import { activityService } from "@/modules/activity/activity.service";
import { eq } from "drizzle-orm";

export class SprintService {
    async startSprint(userId: string, sprintId: string) {
        const [sprint] = await db
            .select()
            .from(sprintsTable)
            .where(eq(sprintsTable.id, sprintId))
            .execute();

        if (!sprint) {
            throw new Error("Sprint not found");
        }

        const [project] = await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.id, sprint.projectId))
            .execute();

        const [updated] = await db
            .update(sprintsTable)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(sprintsTable.id, sprintId))
            .returning()
            .execute();

        await activityService.logActivity({
            workspaceId: project?.workspaceId ?? "",
            userId,
            action: "started",
            entityType: "sprint",
            entityId: updated.id,
            entityName: updated.name,
        });

        return updated;
    }

    async completeSprint(userId: string, sprintId: string) {
        const [sprint] = await db
            .select()
            .from(sprintsTable)
            .where(eq(sprintsTable.id, sprintId))
            .execute();

        if (!sprint) {
            throw new Error("Sprint not found");
        }

        const [project] = await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.id, sprint.projectId))
            .execute();

        const [updated] = await db
            .update(sprintsTable)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(sprintsTable.id, sprintId))
            .returning()
            .execute();

        await activityService.logActivity({
            workspaceId: project?.workspaceId ?? "",
            userId,
            action: "completed",
            entityType: "sprint",
            entityId: updated.id,
            entityName: updated.name,
        });

        return updated;
    }
}

export const sprintService = new SprintService();

