import { notificationRepository } from "./notification.repository";
import { workspaceRepository } from "@/modules/workspace/workspace.repository";
import type { NotificationCreateInput, NotificationCreateParams } from "./notification.types";
import { buildNotificationContent } from "./notification.types";

export class NotificationService {
  async createNotification(data: NotificationCreateInput) {
    return notificationRepository.createNotification(data);
  }

  async createNotificationWithType(params: NotificationCreateParams) {
    const { title, message } = buildNotificationContent(params);
    return notificationRepository.createNotification({
      workspaceId: params.workspaceId,
      userId: params.userId,
      originUserId: params.originUserId ?? null,
      type: params.type,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      redirectUrl: params.redirectUrl ?? null,
      payload: params.payload ?? null,
      title,
      message,
    });
  }

  async getUserNotifications(userId: string) {
    return notificationRepository.getNotificationsForUser(userId);
  }

  async getWorkspaceNotifications(userId: string, workspaceId: string) {
    const workspace = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!workspace) {
      return [];
    }

    return notificationRepository.getNotificationsForUserAndWorkspace(userId, workspace.id);
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    return notificationRepository.markNotificationAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllNotificationsAsRead(userId);
  }
}

export const notificationService = new NotificationService();
