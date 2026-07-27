import {
  attachmentRepository,
  type AttachmentRow,
} from "@/modules/attachment/attachment.repository";
import {
  assertValidAttachmentUrl,
  normalizeAttachmentLabel,
} from "@/modules/attachment/attachment.types";
import { taskRepository } from "@/modules/task/task.repository";
import { epicRepository } from "@/modules/epic/epic.repository";
import { projectRepository } from "@/modules/project/project.repository";
import { activityService } from "@/modules/activity/activity.service";
import { hasRole, type WorkspaceRole } from "@/lib/auth/rbac";

function serializeAttachment(row: AttachmentRow & { uploaderName?: string | null }) {
  return {
    id: row.id,
    taskId: row.taskId,
    epicId: row.epicId,
    fileUrl: row.fileUrl,
    label: row.label,
    uploadedBy: row.uploadedBy,
    uploaderName: row.uploaderName ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class AttachmentService {
  async listForTask(userId: string, projectId: string, taskId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) throw new Error("Project not found or access denied");
    const task = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!task) throw new Error("Ticket not found");
    const rows = await attachmentRepository.findByTask(taskId);
    return rows.map(serializeAttachment);
  }

  async addForTask(
    userId: string,
    projectId: string,
    taskId: string,
    body: { fileUrl: unknown; label?: unknown }
  ) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) throw new Error("Project not found or access denied");
    const { project } = membership;
    const task = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!task) throw new Error("Ticket not found");
    assertValidAttachmentUrl(body.fileUrl);
    const label = normalizeAttachmentLabel(body.label);

    const created = await attachmentRepository.create({
      taskId,
      epicId: null,
      fileUrl: body.fileUrl,
      label,
      uploadedBy: userId,
    });

    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "attachment_added",
      entityType: task.parentTaskId ? "subtask" : "task",
      entityId: taskId,
      entityName: task.title,
    });

    return serializeAttachment({ ...created, uploaderName: null });
  }

  async listForEpic(userId: string, projectId: string, epicId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) throw new Error("Project not found or access denied");
    const epic = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!epic) throw new Error("Epic not found");
    const rows = await attachmentRepository.findByEpic(epicId);
    return rows.map(serializeAttachment);
  }

  async addForEpic(
    userId: string,
    projectId: string,
    epicId: string,
    body: { fileUrl: unknown; label?: unknown }
  ) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) throw new Error("Project not found or access denied");
    const { project } = membership;
    const epic = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!epic) throw new Error("Epic not found");
    assertValidAttachmentUrl(body.fileUrl);
    const label = normalizeAttachmentLabel(body.label);

    const created = await attachmentRepository.create({
      taskId: null,
      epicId,
      fileUrl: body.fileUrl,
      label,
      uploadedBy: userId,
    });

    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "attachment_added",
      entityType: "epic",
      entityId: epicId,
      entityName: epic.name,
    });

    return serializeAttachment({ ...created, uploaderName: null });
  }

  /** Deletable by the original uploader, or by a project_manager+/admin —
   * more permissive than comments (a link is closer to ticket metadata than a
   * personal remark, so a lead should be able to clean up a bad link). */
  async delete(userId: string, projectId: string, attachmentId: string) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) throw new Error("Project not found or access denied");
    const attachment = await attachmentRepository.findById(attachmentId);
    if (!attachment) throw new Error("Attachment not found");

    const belongsToProject = attachment.taskId
      ? await taskRepository.findByIdAndProject(attachment.taskId, projectId)
      : attachment.epicId
        ? await epicRepository.findByIdAndProject(attachment.epicId, projectId)
        : null;
    if (!belongsToProject) throw new Error("Attachment not found");

    const isUploader = attachment.uploadedBy === userId;
    const isLeadership = hasRole(membership.role as WorkspaceRole, "project_manager");
    if (!isUploader && !isLeadership) {
      throw new Error("Forbidden: you can only delete your own attachments");
    }
    await attachmentRepository.delete(attachmentId);
  }
}

export const attachmentService = new AttachmentService();
