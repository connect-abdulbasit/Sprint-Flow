import { authRepository } from "@/modules/auth/auth.repository";
import { projectRepository } from "@/modules/project/project.repository";
import { sprintRepository } from "@/modules/sprint/sprint.repository";
import { epicRepository } from "@/modules/epic/epic.repository";
import { taskRepository, type TaskInsert, type TaskRow } from "@/modules/task/task.repository";
import { activityService } from "@/modules/activity/activity.service";
import { ticketKey } from "@/lib/ticket-key";
import { normalizeTicketPriority, type TicketPriority } from "@/lib/ticket-priority";
import { timeEntryService } from "@/modules/time_entry/time_entry.service";
import type { SerializedTimeEntry } from "@/modules/time_entry/time_entry.types";
import { hasRole, type WorkspaceRole } from "@/lib/auth/rbac";
import { notificationService } from "@/modules/notification/notification.service";

// AUD-002 / AUD-037: the image is later served back with a `Content-Type` header taken
// directly from `imageMimeType`, so any non-image value accepted here becomes a
// same-origin stored-XSS primitive (e.g. "text/html"). Only real, safely-renderable
// image types may ever be stored. Size is also capped server-side — the client-side
// `accept="image/*"` hint on upload inputs is not enforced by browsers or attackers.
export const ALLOWED_TICKET_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const MAX_TICKET_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function parseImagePayload(imageBase64: unknown, imageMimeType: unknown) {
  if (imageBase64 === null) {
    return { image: null as Buffer | null, imageMimeType: null as string | null };
  }
  const raw = String(imageBase64).trim();
  if (!raw) {
    return { image: null as Buffer | null, imageMimeType: null as string | null };
  }
  let b64 = raw;
  let mime = typeof imageMimeType === "string" ? imageMimeType.trim().toLowerCase() : "";
  const dataUrl = /^data:([^;]+);base64,([\s\S]+)$/.exec(raw);
  if (dataUrl) {
    mime = mime || dataUrl[1].toLowerCase();
    b64 = dataUrl[2];
  }
  if (!mime) {
    throw new Error("imageMimeType is required when imageBase64 is provided");
  }
  if (
    !ALLOWED_TICKET_IMAGE_MIME_TYPES.includes(
      mime as (typeof ALLOWED_TICKET_IMAGE_MIME_TYPES)[number]
    )
  ) {
    throw new Error(
      `Unsupported image type "${mime}". Allowed types: ${ALLOWED_TICKET_IMAGE_MIME_TYPES.join(", ")}`
    );
  }
  const buf = Buffer.from(b64, "base64");
  if (!buf.length) {
    throw new Error("imageBase64 is not valid base64");
  }
  if (buf.length > MAX_TICKET_IMAGE_BYTES) {
    throw new Error(
      `Image is too large (${(buf.length / (1024 * 1024)).toFixed(1)}MB). Maximum size is ${MAX_TICKET_IMAGE_BYTES / (1024 * 1024)}MB.`
    );
  }
  return { image: buf, imageMimeType: mime };
}

type TicketFields = {
  id: string;
  projectId: string;
  ticketNumber: number;
  sprintId: string | null;
  epicId: string | null;
  parentTaskId: string | null;
  orderIndex: number;
  labels: string[] | null;
  title: string;
  description: string | null;
  type: TaskRow["type"];
  priority: string;
  status: string;
  assigneeId: string | null;
  assigneeName: string | null;
  reporterId: string;
  reporterName: string;
  dueDate: string | null;
  storyPoints: number | null;
  imageMimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedTicketLink = {
  id: string;
  key: string;
  title: string;
  status: string;
};

function serializeTicket(
  row: TicketFields & { image?: Buffer | null },
  projectName: string,
  opts?: {
    includeImageBase64?: boolean;
    blockedByOpenDependencies?: boolean;
    dependsOn?: SerializedTicketLink[];
    blocks?: SerializedTicketLink[];
    timeEntries?: SerializedTimeEntry[];
    totalLoggedHours?: number;
  }
) {
  const base: Record<string, unknown> = {
    id: row.id,
    projectId: row.projectId,
    ticketNumber: row.ticketNumber,
    key: ticketKey(projectName, row.ticketNumber),
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority as TicketPriority,
    status: row.status,
    sprintId: row.sprintId,
    epicId: row.epicId,
    parentTaskId: row.parentTaskId,
    orderIndex: row.orderIndex,
    labels: row.labels ?? [],
    assigneeId: row.assigneeId,
    assigneeName: row.assigneeName,
    reporterId: row.reporterId,
    reporterName: row.reporterName,
    dueDate: row.dueDate,
    storyPoints: row.storyPoints,
    hasImage: Boolean(row.imageMimeType),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (opts?.blockedByOpenDependencies !== undefined) {
    base.blockedByOpenDependencies = opts.blockedByOpenDependencies;
  }
  if (opts?.dependsOn) base.dependsOn = opts.dependsOn;
  if (opts?.blocks) base.blocks = opts.blocks;
  if (opts?.timeEntries) base.timeEntries = opts.timeEntries;
  if (opts?.totalLoggedHours !== undefined) base.totalLoggedHours = opts.totalLoggedHours;

  if (opts?.includeImageBase64 && row.image && row.imageMimeType) {
    return {
      ...base,
      imageMimeType: row.imageMimeType,
      imageBase64: row.image.toString("base64"),
    };
  }
  return base;
}

function prerequisitesReachTask(
  adj: Map<string, string[]>,
  start: string,
  target: string
): boolean {
  const stack = [start];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === target) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const next = adj.get(cur);
    if (next) for (const n of next) stack.push(n);
  }
  return false;
}

export class TaskService {
  private async notifyWithFallback(
    params: Parameters<typeof notificationService.createNotificationWithType>[0]
  ) {
    try {
      await notificationService.createNotificationWithType(params);
    } catch (error) {
      console.error("Create notification error:", error);
    }
  }

  private ticketDetailUrl(
    workspaceId: string,
    projectId: string,
    ticketId: string,
    commentId?: string | null
  ) {
    const params = new URLSearchParams({ ticketId });
    if (commentId) params.set("commentId", commentId);
    return `/workspace/${workspaceId}/projects/${projectId}/backlog?${params.toString()}`;
  }

  async listTickets(userId: string, projectId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const rows = await taskRepository.findByProject(projectId);
    const blockedSet = await taskRepository.findTaskIdsBlockedByOpenWork(projectId);
    return rows.map((r) =>
      serializeTicket(r, project.name, {
        blockedByOpenDependencies: blockedSet.has(r.id),
      })
    );
  }

  async getTicket(
    userId: string,
    projectId: string,
    ticketId: string,
    includeImageBase64: boolean
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const row = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!row) {
      throw new Error("Ticket not found");
    }
    const [dependsOnIds, blocksIds] = await Promise.all([
      taskRepository.listDependsOnIds(ticketId),
      taskRepository.listDependentTaskIds(ticketId),
    ]);
    const name = project.name;
    const [dependsRows, blocksRows] = await Promise.all([
      taskRepository.findTicketLinkRows(dependsOnIds, projectId),
      taskRepository.findTicketLinkRows(blocksIds, projectId),
    ]);
    const toLink = (t: (typeof dependsRows)[0]): SerializedTicketLink => ({
      id: t.id,
      key: ticketKey(name, t.ticketNumber),
      title: t.title,
      status: t.status,
    });
    const dependsOnSerialized = dependsRows.map(toLink);
    const blockedByOpenDependencies = dependsOnSerialized.some((l) => l.status !== "done");
    const timeEntries = await timeEntryService.listForTicket(userId, projectId, ticketId);
    const totalLoggedHours = timeEntries.reduce((s, e) => s + e.hours, 0);
    return serializeTicket(row, project.name, {
      includeImageBase64,
      blockedByOpenDependencies,
      dependsOn: dependsOnSerialized,
      blocks: blocksRows.map(toLink),
      timeEntries,
      totalLoggedHours,
    });
  }

  /** Validates IDs and dependency graph; replaces edges for `taskId`. Pass `undefined` to skip updates. */
  private async validateAndPersistDependencies(
    projectId: string,
    taskId: string,
    dependsOnTaskIds: string[] | undefined
  ): Promise<void> {
    if (dependsOnTaskIds === undefined) return;
    const unique = [...new Set(dependsOnTaskIds)].filter((id) => id && id !== taskId);
    for (const depId of unique) {
      const exists = await taskRepository.findByIdAndProject(depId, projectId);
      if (!exists) {
        throw new Error(`Linked ticket not found in this project: ${depId}`);
      }
    }
    const baseAdj = await taskRepository.buildPrerequisiteAdjacency(projectId, taskId);
    const working = new Map<string, string[]>();
    for (const [k, v] of baseAdj) working.set(k, [...v]);
    working.set(taskId, unique);
    for (const d of unique) {
      if (prerequisitesReachTask(working, d, taskId)) {
        throw new Error("Cannot link tickets: this would create a circular dependency");
      }
    }
    await taskRepository.replaceTaskDependencies(taskId, unique);
  }

  async getTicketImage(userId: string, projectId: string, ticketId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const row = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!row?.image || !row.imageMimeType) {
      throw new Error("Ticket image not found");
    }
    return { buffer: row.image, mimeType: row.imageMimeType };
  }

  private async assertSprintAssignable(projectId: string, sprintId: string | null | undefined) {
    if (sprintId === undefined || sprintId === null) return;
    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new Error("Sprint not found or does not belong to this project");
    }
    if (sprint.status === "completed") {
      throw new Error("Cannot assign tickets to a completed sprint");
    }
  }

  private async assertEpicAssignable(projectId: string, epicId: string | null | undefined) {
    if (epicId === undefined || epicId === null) return;
    const epic = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!epic) {
      throw new Error("Epic not found or does not belong to this project");
    }
  }

  /** Enforces the single-level subtask cap: a subtask's parent must not itself
   * be a subtask, and a task that already has subtasks can never become one.
   * Returns the parent row (used by callers to denormalize epicId/sprintId). */
  private async assertSubtaskAllowed(projectId: string, parentTaskId: string, forTaskId?: string) {
    const parent = await taskRepository.findByIdAndProject(parentTaskId, projectId);
    if (!parent) {
      throw new Error("Parent ticket not found or does not belong to this project");
    }
    if (parent.parentTaskId) {
      throw new Error("Subtasks cannot be nested more than one level deep");
    }
    if (forTaskId) {
      const childCount = await taskRepository.countSubtasks(forTaskId);
      if (childCount > 0) {
        throw new Error("A ticket that already has subtasks cannot itself become a subtask");
      }
    }
    return parent;
  }

  private async resolveAssignee(projectId: string, assigneeId: string | null) {
    if (assigneeId === null) {
      return { assigneeId: null, assigneeName: null as string | null };
    }
    if (!(await projectRepository.isProjectMember(projectId, assigneeId))) {
      throw new Error("Assignee must be a member of this project");
    }
    const user = await authRepository.findUserById(assigneeId);
    if (!user) {
      throw new Error("Assignee user not found");
    }
    return { assigneeId, assigneeName: user.name };
  }

  async createTicket(
    userId: string,
    projectId: string,
    body: {
      title: string;
      reporterName: string;
      description?: string | null;
      type?: TaskRow["type"];
      priority?: string;
      status?: string;
      sprintId?: string | null;
      epicId?: string | null;
      parentTaskId?: string | null;
      labels?: string[] | null;
      assigneeId?: string | null;
      dueDate?: string | null;
      storyPoints?: number | null;
      imageBase64?: string | null;
      imageMimeType?: string | null;
      dependsOnTaskIds?: string[];
    }
  ) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: only admins and project managers can create tickets");
    }
    const { project } = membership;
    const assignee = await this.resolveAssignee(projectId, body.assigneeId ?? null);

    // A subtask is not independently sprint-scheduled and its epic is always
    // denormalized from its parent, regardless of what the client sent.
    let sprintId = body.sprintId ?? null;
    let epicId = body.epicId ?? null;
    if (body.parentTaskId) {
      const parent = await this.assertSubtaskAllowed(projectId, body.parentTaskId);
      sprintId = null;
      epicId = parent.epicId;
    } else {
      await this.assertSprintAssignable(projectId, sprintId);
      await this.assertEpicAssignable(projectId, epicId);
    }

    const priority: TicketPriority =
      body.priority !== undefined && body.priority !== ""
        ? normalizeTicketPriority(body.priority)
        : "medium";
    const imageFields =
      body.imageBase64 !== undefined
        ? parseImagePayload(body.imageBase64, body.imageMimeType)
        : { image: null as Buffer | null, imageMimeType: null as string | null };

    const insert: Omit<TaskInsert, "ticketNumber"> = {
      projectId,
      title: body.title.trim(),
      description: body.description ?? null,
      type: body.type ?? "task",
      priority,
      status: body.status ?? "todo",
      sprintId,
      epicId,
      parentTaskId: body.parentTaskId ?? null,
      labels: body.labels ?? null,
      assigneeId: assignee.assigneeId,
      assigneeName: assignee.assigneeName,
      reporterId: userId,
      reporterName: body.reporterName,
      dueDate: body.dueDate ?? null,
      storyPoints: body.storyPoints ?? null,
      image: imageFields.image,
      imageMimeType: imageFields.imageMimeType,
    };

    const created = await taskRepository.createWithNextTicketNumber(insert);

    if (body.dependsOnTaskIds !== undefined && body.dependsOnTaskIds.length > 0) {
      await this.validateAndPersistDependencies(projectId, created.id, body.dependsOnTaskIds);
    }

    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "created",
      entityType: created.parentTaskId ? "subtask" : "task",
      entityId: created.id,
      entityName: created.title,
    });

    if (created.assigneeId && created.assigneeId !== userId) {
      await this.notifyWithFallback({
        workspaceId: project.workspaceId,
        userId: created.assigneeId,
        originUserId: userId,
        type: "task_assignment",
        targetType: "task",
        targetId: created.id,
        redirectUrl: this.ticketDetailUrl(project.workspaceId, projectId, created.id),
        title: `Task assigned: ${ticketKey(project.name, created.ticketNumber)}`,
        message: `You were assigned "${created.title}".`,
      });
    }

    return this.getTicket(userId, projectId, created.id, false);
  }

  async updateTicket(
    userId: string,
    projectId: string,
    ticketId: string,
    body: Partial<{
      title: string;
      description: string | null;
      type: TaskRow["type"];
      priority: string;
      status: string;
      sprintId: string | null;
      epicId: string | null;
      parentTaskId: string | null;
      orderIndex: number;
      labels: string[] | null;
      assigneeId: string | null;
      reporterId: string;
      dueDate: string | null;
      storyPoints: number | null;
      imageBase64: string | null | undefined;
      imageMimeType: string | null;
      dependsOnTaskIds: string[];
      /**
       * AUD-036: optional optimistic-concurrency token — the `updatedAt` the caller last
       * saw for this ticket. When provided and it no longer matches the current row, the
       * update is rejected instead of silently overwriting a change the caller never saw
       * (e.g. two users dragging the same ticket to different board columns at once).
       * Omitted by callers that don't need this (e.g. the full edit form, where the user
       * is looking directly at the ticket and a last-write-wins is an acceptable, visible
       * outcome of their own explicit save).
       */
      expectedUpdatedAt: string;
    }>
  ) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    const role = membership.role as WorkspaceRole;
    const workspaceIdForActivity = membership.project.workspaceId;
    const existing = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!existing) {
      throw new Error("Ticket not found");
    }

    if (
      body.expectedUpdatedAt !== undefined &&
      body.expectedUpdatedAt !== existing.updatedAt.toISOString()
    ) {
      throw new Error(
        "CONFLICT: This ticket was changed by someone else. Refresh to see the latest version."
      );
    }

    // AUD-009: a completed sprint's ticket composition must be immutable — the UI already
    // promises "Done tickets stay on this sprint for history" (SprintSection.tsx), but
    // nothing previously enforced it server-side. Without this, a ticket could be dragged
    // out of (or edited within) a completed sprint, silently corrupting historical data
    // that any future velocity/burndown report would depend on.
    if (existing.sprintId) {
      const currentSprint = await sprintRepository.findByIdAndProject(existing.sprintId, projectId);
      if (currentSprint?.status === "completed") {
        throw new Error("Cannot modify a ticket that belongs to a completed sprint");
      }
    }

    const patch: Parameters<typeof taskRepository.update>[1] = {};

    if (body.title !== undefined) {
      const t = body.title.trim();
      if (!t) throw new Error("title cannot be empty");
      patch.title = t;
    }
    if (body.description !== undefined) patch.description = body.description;
    if (body.type !== undefined) patch.type = body.type;
    if (body.priority !== undefined) patch.priority = normalizeTicketPriority(body.priority);
    if (body.status !== undefined) patch.status = body.status;
    if (body.sprintId !== undefined) {
      await this.assertSprintAssignable(projectId, body.sprintId);
      patch.sprintId = body.sprintId;
    }
    if (body.labels !== undefined) patch.labels = body.labels;
    if (body.orderIndex !== undefined) patch.orderIndex = body.orderIndex;

    // A subtask's epic always follows its parent's, and it's never independently
    // sprint-scheduled — this takes precedence over any sprintId/epicId also
    // present in the same request.
    let epicCascadeToSubtasks: string | null | undefined;
    if (body.parentTaskId !== undefined) {
      if (body.parentTaskId === null) {
        patch.parentTaskId = null;
      } else {
        const parent = await this.assertSubtaskAllowed(projectId, body.parentTaskId, ticketId);
        patch.parentTaskId = body.parentTaskId;
        patch.sprintId = null;
        patch.epicId = parent.epicId;
      }
    } else if (body.epicId !== undefined) {
      await this.assertEpicAssignable(projectId, body.epicId);
      patch.epicId = body.epicId;
      epicCascadeToSubtasks = body.epicId;
    }
    if (body.dueDate !== undefined) patch.dueDate = body.dueDate;
    if (body.storyPoints !== undefined) patch.storyPoints = body.storyPoints;

    if (body.assigneeId !== undefined) {
      const a = await this.resolveAssignee(projectId, body.assigneeId);
      patch.assigneeId = a.assigneeId;
      patch.assigneeName = a.assigneeName;
    }

    if (body.reporterId !== undefined) {
      if (!(await projectRepository.isProjectMember(projectId, body.reporterId))) {
        throw new Error("Reporter must be a member of this project");
      }
      const rep = await authRepository.findUserById(body.reporterId);
      if (!rep) {
        throw new Error("Reporter user not found");
      }
      patch.reporterId = body.reporterId;
      patch.reporterName = rep.name;
    }

    if (body.imageBase64 !== undefined) {
      const parsed = parseImagePayload(body.imageBase64, body.imageMimeType);
      patch.image = parsed.image;
      patch.imageMimeType = parsed.imageMimeType;
    }

    if (body.dependsOnTaskIds !== undefined) {
      await this.validateAndPersistDependencies(projectId, ticketId, body.dependsOnTaskIds);
    }

    if (!hasRole(role, "project_manager")) {
      const allowedKeysForMember = new Set(["status", "expectedUpdatedAt"]);
      const requestedKeys = Object.keys(body).filter(
        (k) => (body as Record<string, unknown>)[k] !== undefined
      );
      const hasRestrictedChanges = requestedKeys.some((k) => !allowedKeysForMember.has(k));
      if (hasRestrictedChanges) {
        throw new Error("Forbidden: members can only update ticket status");
      }
    }

    if (Object.keys(patch).length === 0) {
      return this.getTicket(userId, projectId, ticketId, false);
    }

    const updated = await taskRepository.update(ticketId, patch);
    if (!updated) {
      throw new Error("Ticket not found");
    }

    if (epicCascadeToSubtasks !== undefined) {
      await taskRepository.setEpicIdForSubtasks(ticketId, epicCascadeToSubtasks);
    }

    const activityEntityType = updated.parentTaskId ? "subtask" : "task";

    if (body.status === "done" && existing.status !== "done") {
      await activityService.logActivity({
        workspaceId: workspaceIdForActivity,
        userId,
        action: "completed",
        entityType: activityEntityType,
        entityId: updated.id,
        entityName: updated.title,
      });
    }

    if (body.priority !== undefined && patch.priority !== existing.priority) {
      await activityService.logActivity({
        workspaceId: workspaceIdForActivity,
        userId,
        action: "priority_changed",
        entityType: activityEntityType,
        entityId: updated.id,
        entityName: updated.title,
      });
    }

    if (
      (body.epicId !== undefined && patch.epicId !== existing.epicId) ||
      (body.parentTaskId !== undefined && patch.parentTaskId !== existing.parentTaskId) ||
      (body.sprintId !== undefined && patch.sprintId !== existing.sprintId)
    ) {
      await activityService.logActivity({
        workspaceId: workspaceIdForActivity,
        userId,
        action: "moved",
        entityType: activityEntityType,
        entityId: updated.id,
        entityName: updated.title,
      });
    }

    if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
      await activityService.logActivity({
        workspaceId: workspaceIdForActivity,
        userId,
        action: "assigned",
        entityType: activityEntityType,
        entityId: updated.id,
        entityName: updated.title,
      });
    }

    if (
      body.assigneeId !== undefined &&
      updated.assigneeId &&
      updated.assigneeId !== existing.assigneeId
    ) {
      if (updated.assigneeId !== userId) {
        await this.notifyWithFallback({
          workspaceId: workspaceIdForActivity,
          userId: updated.assigneeId,
          originUserId: userId,
          type: "task_assignment",
          targetType: "task",
          targetId: updated.id,
          redirectUrl: this.ticketDetailUrl(workspaceIdForActivity, projectId, updated.id),
          title: `Task assigned: ${ticketKey(membership.project.name, updated.ticketNumber)}`,
          message: `You were assigned "${updated.title}".`,
        });
      }
    }

    if (body.status !== undefined && body.status !== existing.status) {
      const recipients = new Set<string>();
      if (updated.assigneeId) recipients.add(updated.assigneeId);
      if (updated.reporterId) recipients.add(updated.reporterId);
      recipients.delete(userId);

      for (const recipientId of recipients) {
        await this.notifyWithFallback({
          workspaceId: workspaceIdForActivity,
          userId: recipientId,
          originUserId: userId,
          type: "task_status",
          targetType: "task",
          targetId: updated.id,
          redirectUrl: this.ticketDetailUrl(workspaceIdForActivity, projectId, updated.id),
          title: `Status updated: ${ticketKey(membership.project.name, updated.ticketNumber)}`,
          message: `"${updated.title}" moved from ${existing.status} to ${updated.status}.`,
        });
      }
    }

    return this.getTicket(userId, projectId, ticketId, false);
  }

  async getTicketActivity(
    userId: string,
    projectId: string,
    ticketId: string,
    pagination: Parameters<typeof activityService.getEntityActivities>[2]
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const ticket = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    const entityType = ticket.parentTaskId ? "subtask" : "task";
    return activityService.getEntityActivities(entityType, ticketId, pagination);
  }

  async deleteTicket(userId: string, projectId: string, ticketId: string) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can delete tickets");
    }
    const existing = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!existing) {
      throw new Error("Ticket not found");
    }
    await taskRepository.delete(ticketId);
  }
}

export const taskService = new TaskService();
