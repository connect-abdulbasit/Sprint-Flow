import { notificationRepository } from "./notification.repository";
import { workspaceRepository } from "@/modules/workspace/workspace.repository";
import type { NotificationCreateInput, NotificationCreateParams } from "./notification.types";
import { buildNotificationContent } from "./notification.types";
import type {
  NotificationPaginatedResult,
  NotificationPaginationInput,
} from "./notification.repository";

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

  async getUserNotifications(
    userId: string,
    pagination: NotificationPaginationInput
  ): Promise<NotificationPaginatedResult> {
    return notificationRepository.getNotificationsForUser(userId, pagination);
  }

  async getWorkspaceNotifications(
    userId: string,
    workspaceId: string,
    pagination: NotificationPaginationInput
  ): Promise<NotificationPaginatedResult> {
    const workspace = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!workspace) {
      return {
        items: [],
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: 0,
          totalPages: 1,
          hasPreviousPage: pagination.page > 1,
          hasNextPage: false,
        },
        unreadCount: 0,
      };
    }

    return notificationRepository.getNotificationsForUserAndWorkspace(
      userId,
      workspace.id,
      pagination
    );
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    return notificationRepository.markNotificationAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllNotificationsAsRead(userId);
  }
}

export const notificationService = new NotificationService();
