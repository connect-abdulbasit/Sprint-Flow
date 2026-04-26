import { activityRepository } from "./activity.repository";

export class ActivityService {
    async logActivity(data: {
        workspaceId: string;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        entityName: string;
    }) {
        return activityRepository.createActivity({
            workspaceId: data.workspaceId,
            userId: data.userId,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            entityName: data.entityName,
        });
    }

    async getWorkspaceActivities(workspaceId: string, limit?: number) {
        return activityRepository.getWorkspaceActivities(workspaceId, limit);
    }
}

export const activityService = new ActivityService();

