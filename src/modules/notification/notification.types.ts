import { notificationsTable } from "@/modules/notification/notification.schema";

export type NotificationType =
  | "mention"
  | "task_assignment"
  | "task_comment"
  | "task_status"
  | "sprint_update"
  | "project_update"
  | "invite"
  | "activity"
  | "reminder"
  | "general";

export type NotificationTargetType =
  | "task"
  | "comment"
  | "sprint"
  | "project"
  | "workspace"
  | "organization"
  | "invite"
  | "user"
  | "activity"
  | "none";

export type NotificationCreateInput = typeof notificationsTable.$inferInsert;

export type NotificationCreateParams = {
  workspaceId: string;
  userId: string;
  originUserId?: string | null;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetId?: string | null;
  redirectUrl?: string | null;
  payload?: string | null;
  title?: string;
  message?: string;
};

export function buildNotificationContent({
  type,
  targetType,
  payload,
  title,
  message,
}: {
  type: NotificationType;
  targetType: NotificationTargetType;
  payload?: string | null;
  title?: string;
  message?: string;
}) {
  const typeText: Record<NotificationType, { title: string; message: string }> = {
    mention: {
      title: title ?? "You were mentioned",
      message:
        message ?? `Someone mentioned you in a ${targetType}. ${payload ?? "Open it to reply."}`,
    },
    task_assignment: {
      title: title ?? "Task assigned",
      message:
        message ??
        `A new task assignment was created for you. ${payload ?? "Open the task to view details."}`,
    },
    task_comment: {
      title: title ?? "New comment",
      message:
        message ??
        `A comment was added to the ${targetType}. ${payload ?? "Open it to read and respond."}`,
    },
    task_status: {
      title: title ?? "Task status changed",
      message:
        message ??
        `The status of a ${targetType} changed. ${payload ?? "Open it to see the current state."}`,
    },
    sprint_update: {
      title: title ?? "Sprint updated",
      message:
        message ??
        `A sprint was updated in your workspace. ${payload ?? "Open the sprint to review changes."}`,
    },
    project_update: {
      title: title ?? "Project update",
      message:
        message ??
        `A project update is available. ${payload ?? "Open the project for the latest changes."}`,
    },
    invite: {
      title: title ?? "Invitation received",
      message: message ?? `You have a new invite. ${payload ?? "Open it to accept or review."}`,
    },
    activity: {
      title: title ?? "Activity alert",
      message:
        message ??
        `There is new activity in your workspace. ${payload ?? "Open it to see the details."}`,
    },
    reminder: {
      title: title ?? "Reminder",
      message: message ?? `A reminder is waiting for you. ${payload ?? "Open it to take action."}`,
    },
    general: {
      title: title ?? "Update",
      message: message ?? `You have a new notification. ${payload ?? "Open it to view more."}`,
    },
  };

  return typeText[type];
}

export function isValidNotificationType(value: string): value is NotificationType {
  return [
    "mention",
    "task_assignment",
    "task_comment",
    "task_status",
    "sprint_update",
    "project_update",
    "invite",
    "activity",
    "reminder",
    "general",
  ].includes(value);
}

export function isValidNotificationTargetType(value: string): value is NotificationTargetType {
  return [
    "task",
    "comment",
    "sprint",
    "project",
    "workspace",
    "organization",
    "invite",
    "user",
    "activity",
    "none",
  ].includes(value);
}
