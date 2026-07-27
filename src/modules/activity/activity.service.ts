import { activityRepository } from "./activity.repository";
import type { PaginationInput } from "@/lib/pagination";

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

  async getWorkspaceActivities(workspaceId: string, pagination: PaginationInput) {
    return activityRepository.getWorkspaceActivities(workspaceId, pagination);
  }

  async getEntityActivities(entityType: string, entityId: string, pagination: PaginationInput) {
    return activityRepository.getEntityActivities(entityType, entityId, pagination);
  }
}

export const activityService = new ActivityService();
