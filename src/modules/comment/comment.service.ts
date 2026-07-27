import { commentRepository } from "./comment.repository";
import { authRepository } from "@/modules/auth/auth.repository";
import { workspaceRepository } from "@/modules/workspace/workspace.repository";
import { taskRepository } from "@/modules/task/task.repository";
import { epicRepository } from "@/modules/epic/epic.repository";
import { projectRepository } from "@/modules/project/project.repository";
import { notificationService } from "@/modules/notification/notification.service";

function extractMentions(content: string): string[] {
  const regex = /@([a-zA-Z]+(?:\s[a-zA-Z]+)?)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim().toLowerCase());
  }
  return matches;
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function firstName(value: string | null | undefined) {
  return normalizeName(value).split(/\s+/).filter(Boolean)[0] ?? "";
}

function taskDetailUrl(workspaceId: string, projectId: string, taskId: string, commentId?: string) {
  const params = new URLSearchParams({ ticketId: taskId });
  if (commentId) params.set("commentId", commentId);
  return `/workspace/${workspaceId}/projects/${projectId}/backlog?${params.toString()}`;
}

function epicDetailUrl(workspaceId: string, projectId: string, epicId: string, commentId?: string) {
  const params = new URLSearchParams();
  if (commentId) params.set("commentId", commentId);
  const qs = params.toString();
  return `/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}${qs ? `?${qs}` : ""}`;
}

function resolveMentionedUserIds(
  content: string,
  members: { userId: string; name: string | null }[],
  excludeUserId: string
) {
  const mentionedNames = extractMentions(content);
  const byFullName = new Map<string, string>();
  const byFirstName = new Map<string, string[]>();
  for (const member of members) {
    const full = normalizeName(member.name);
    if (full) byFullName.set(full, member.userId);
    const first = firstName(member.name);
    if (first) {
      const existing = byFirstName.get(first) ?? [];
      existing.push(member.userId);
      byFirstName.set(first, existing);
    }
  }
  const mentionedUserIds = new Set<string>();
  for (const mentionName of mentionedNames) {
    const fullMatch = byFullName.get(mentionName);
    if (fullMatch) {
      mentionedUserIds.add(fullMatch);
      continue;
    }
    const firstMatches = byFirstName.get(mentionName);
    if (firstMatches?.length === 1) {
      mentionedUserIds.add(firstMatches[0]);
    }
  }
  mentionedUserIds.delete(excludeUserId);
  return mentionedUserIds;
}

export class CommentService {
  private async notifyWithFallback(
    params: Parameters<typeof notificationService.createNotificationWithType>[0]
  ) {
    try {
      await notificationService.createNotificationWithType(params);
    } catch (error) {
      console.error("Create notification error:", error);
    }
  }

  async addComment(data: {
    taskId: string;
    workspaceId: string;
    userId: string;
    content: string;
    parentId?: string;
  }) {
    const task = await taskRepository.findById(data.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // AUD-005: the workspaceId in the URL was previously trusted blindly with no check
    // that the caller actually belongs to the project the task lives in — any
    // authenticated user could comment on (or read comments from) any workspace's
    // tickets just by knowing/guessing a task id. Membership is derived from the task's
    // own project, not the client-supplied workspaceId, and re-verified here.
    const project = await projectRepository.findById(task.projectId);
    if (!project) {
      throw new Error("Task not found");
    }
    const isMember = await projectRepository.isProjectMember(task.projectId, data.userId);
    if (!isMember) {
      throw new Error("Forbidden: you do not have access to this task");
    }
    const workspaceId = project.workspaceId;

    const [actor, members] = await Promise.all([
      authRepository.findUserById(data.userId),
      workspaceRepository.listMembersWithUsers(workspaceId),
    ]);

    const mentionedNames = extractMentions(data.content);
    const byFullName = new Map<string, string>();
    const byFirstName = new Map<string, string[]>();
    for (const member of members) {
      const full = normalizeName(member.name);
      if (full) byFullName.set(full, member.userId);
      const first = firstName(member.name);
      if (first) {
        const existing = byFirstName.get(first) ?? [];
        existing.push(member.userId);
        byFirstName.set(first, existing);
      }
    }

    const mentionedUserIds = new Set<string>();
    for (const mentionName of mentionedNames) {
      const fullMatch = byFullName.get(mentionName);
      if (fullMatch) {
        mentionedUserIds.add(fullMatch);
        continue;
      }
      const firstMatches = byFirstName.get(mentionName);
      if (firstMatches?.length === 1) {
        mentionedUserIds.add(firstMatches[0]);
      }
    }
    mentionedUserIds.delete(data.userId);

    const comment = await commentRepository.createComment({
      taskId: data.taskId,
      workspaceId,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId ?? null,
      mentionedUserIds: mentionedUserIds.size > 0 ? [...mentionedUserIds] : null,
    });

    const actorName = actor?.name ?? "Someone";
    const mentionRedirectUrl = taskDetailUrl(workspaceId, task.projectId, task.id, comment.id);
    const ticketLabel = task.ticketNumber ? `#${task.ticketNumber}` : "task";

    for (const mentionedUserId of mentionedUserIds) {
      await this.notifyWithFallback({
        workspaceId,
        userId: mentionedUserId,
        originUserId: data.userId,
        type: "mention",
        targetType: "comment",
        targetId: comment.id,
        redirectUrl: mentionRedirectUrl,
        payload: JSON.stringify({
          projectId: task.projectId,
          taskId: task.id,
          commentId: comment.id,
        }),
        title: `${actorName} mentioned you`,
        message: `${actorName} mentioned you in a comment on ${ticketLabel}.`,
      });
    }

    const relatedUserIds = new Set<string>();
    if (task.assigneeId) relatedUserIds.add(task.assigneeId);
    if (task.reporterId) relatedUserIds.add(task.reporterId);
    relatedUserIds.delete(data.userId);
    for (const mentionedUserId of mentionedUserIds) {
      relatedUserIds.delete(mentionedUserId);
    }

    for (const recipientId of relatedUserIds) {
      await this.notifyWithFallback({
        workspaceId,
        userId: recipientId,
        originUserId: data.userId,
        type: "task_comment",
        targetType: "task",
        targetId: data.taskId,
        redirectUrl: mentionRedirectUrl,
        payload: JSON.stringify({
          projectId: task.projectId,
          taskId: task.id,
          commentId: comment.id,
        }),
        title: `New comment on ${ticketLabel}`,
        message: `${actorName} commented on ${ticketLabel}: "${data.content.slice(0, 110)}${data.content.length > 110 ? "..." : ""}"`,
      });
    }

    return comment;
  }

  async addEpicComment(data: {
    epicId: string;
    workspaceId: string;
    userId: string;
    content: string;
    parentId?: string;
  }) {
    const epic = await epicRepository.findById(data.epicId);
    if (!epic) {
      throw new Error("Epic not found");
    }
    // Same AUD-005-style membership derivation as task comments: never trust the
    // client-supplied workspaceId, re-derive it from the epic's own project.
    const project = await projectRepository.findById(epic.projectId);
    if (!project) {
      throw new Error("Epic not found");
    }
    const isMember = await projectRepository.isProjectMember(epic.projectId, data.userId);
    if (!isMember) {
      throw new Error("Forbidden: you do not have access to this epic");
    }
    const workspaceId = project.workspaceId;

    const [actor, members] = await Promise.all([
      authRepository.findUserById(data.userId),
      workspaceRepository.listMembersWithUsers(workspaceId),
    ]);
    const mentionedUserIds = resolveMentionedUserIds(data.content, members, data.userId);

    const comment = await commentRepository.createComment({
      epicId: data.epicId,
      workspaceId,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId ?? null,
      mentionedUserIds: mentionedUserIds.size > 0 ? [...mentionedUserIds] : null,
    });

    const actorName = actor?.name ?? "Someone";
    const mentionRedirectUrl = epicDetailUrl(workspaceId, epic.projectId, epic.id, comment.id);

    for (const mentionedUserId of mentionedUserIds) {
      await this.notifyWithFallback({
        workspaceId,
        userId: mentionedUserId,
        originUserId: data.userId,
        type: "mention",
        targetType: "comment",
        targetId: comment.id,
        redirectUrl: mentionRedirectUrl,
        title: `${actorName} mentioned you`,
        message: `${actorName} mentioned you in a comment on epic "${epic.name}".`,
      });
    }

    const relatedUserIds = new Set<string>();
    if (epic.ownerId) relatedUserIds.add(epic.ownerId);
    relatedUserIds.delete(data.userId);
    for (const mentionedUserId of mentionedUserIds) relatedUserIds.delete(mentionedUserId);

    for (const recipientId of relatedUserIds) {
      await this.notifyWithFallback({
        workspaceId,
        userId: recipientId,
        originUserId: data.userId,
        type: "task_comment",
        targetType: "task",
        targetId: data.epicId,
        redirectUrl: mentionRedirectUrl,
        title: `New comment on epic "${epic.name}"`,
        message: `${actorName} commented: "${data.content.slice(0, 110)}${data.content.length > 110 ? "..." : ""}"`,
      });
    }

    return comment;
  }

  async getEpicComments(epicId: string, currentUserId: string) {
    const epic = await epicRepository.findById(epicId);
    if (!epic) {
      throw new Error("Epic not found");
    }
    const isMember = await projectRepository.isProjectMember(epic.projectId, currentUserId);
    if (!isMember) {
      throw new Error("Forbidden: you do not have access to this epic");
    }
    return commentRepository.getEpicComments(epicId, currentUserId);
  }

  async getTaskComments(taskId: string, currentUserId: string) {
    // AUD-005: reading comments previously required no membership check at all — any
    // authenticated user could list another workspace's ticket comments by task id.
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const isMember = await projectRepository.isProjectMember(task.projectId, currentUserId);
    if (!isMember) {
      throw new Error("Forbidden: you do not have access to this task");
    }
    return commentRepository.getTaskComments(taskId, currentUserId);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await commentRepository.getCommentById(commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== userId)
      throw new Error("Forbidden: you can only delete your own comments");
    await commentRepository.deleteComment(commentId, userId);
    return { success: true };
  }
}

export const commentService = new CommentService();
