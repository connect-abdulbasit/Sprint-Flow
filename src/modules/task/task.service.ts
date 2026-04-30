import { authRepository } from "@/modules/auth/auth.repository";
import { projectRepository } from "@/modules/project/project.repository";
import { sprintRepository } from "@/modules/sprint/sprint.repository";
import { taskRepository, type TaskInsert, type TaskRow } from "@/modules/task/task.repository";
import { activityService } from "@/modules/activity/activity.service";
import { ticketKey } from "@/lib/ticket-key";

export function parseImagePayload(imageBase64: unknown, imageMimeType: unknown) {
  if (imageBase64 === null) {
    return { image: null as Buffer | null, imageMimeType: null as string | null };
  }
  const raw = String(imageBase64).trim();
  if (!raw) {
    return { image: null as Buffer | null, imageMimeType: null as string | null };
  }
  let b64 = raw;
  let mime = typeof imageMimeType === "string" ? imageMimeType.trim() : "";
  const dataUrl = /^data:([^;]+);base64,([\s\S]+)$/.exec(raw);
  if (dataUrl) {
    mime = mime || dataUrl[1];
    b64 = dataUrl[2];
  }
  if (!mime) {
    throw new Error("imageMimeType is required when imageBase64 is provided");
  }
  const buf = Buffer.from(b64, "base64");
  if (!buf.length) {
    throw new Error("imageBase64 is not valid base64");
  }
  return { image: buf, imageMimeType: mime };
}

type TicketFields = {
  id: string;
  projectId: string;
  ticketNumber: number;
  sprintId: string | null;
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

function serializeTicket(
  row: TicketFields & { image?: Buffer | null },
  projectName: string,
  opts?: { includeImageBase64?: boolean }
) {
  const base = {
    id: row.id,
    projectId: row.projectId,
    ticketNumber: row.ticketNumber,
    key: ticketKey(projectName, row.ticketNumber),
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    sprintId: row.sprintId,
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
  if (opts?.includeImageBase64 && row.image && row.imageMimeType) {
    return { ...base, imageMimeType: row.imageMimeType, imageBase64: row.image.toString("base64") };
  }
  return base;
}

export class TaskService {
  async listTickets(userId: string, projectId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const rows = await taskRepository.findByProject(projectId);
    return rows.map((r) => serializeTicket(r, project.name));
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
    return serializeTicket(row, project.name, { includeImageBase64 });
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
      assigneeId?: string | null;
      dueDate?: string | null;
      storyPoints?: number | null;
      imageBase64?: string | null;
      imageMimeType?: string | null;
    }
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const assignee = await this.resolveAssignee(projectId, body.assigneeId ?? null);
    await this.assertSprintAssignable(projectId, body.sprintId ?? null);
    const imageFields =
      body.imageBase64 !== undefined
        ? parseImagePayload(body.imageBase64, body.imageMimeType)
        : { image: null as Buffer | null, imageMimeType: null as string | null };

    const insert: Omit<TaskInsert, "ticketNumber"> = {
      projectId,
      title: body.title.trim(),
      description: body.description ?? null,
      type: body.type ?? "task",
      priority: body.priority ?? "medium",
      status: body.status ?? "todo",
      sprintId: body.sprintId ?? null,
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

    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "created",
      entityType: "task",
      entityId: created.id,
      entityName: created.title,
    });

    return serializeTicket(created, project.name);
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
      assigneeId: string | null;
      reporterId: string;
      dueDate: string | null;
      storyPoints: number | null;
      imageBase64: string | null | undefined;
      imageMimeType: string | null;
    }>
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const existing = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!existing) {
      throw new Error("Ticket not found");
    }

    const patch: Parameters<typeof taskRepository.update>[1] = {};

    if (body.title !== undefined) {
      const t = body.title.trim();
      if (!t) throw new Error("title cannot be empty");
      patch.title = t;
    }
    if (body.description !== undefined) patch.description = body.description;
    if (body.type !== undefined) patch.type = body.type;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.status !== undefined) patch.status = body.status;
    if (body.sprintId !== undefined) {
      await this.assertSprintAssignable(projectId, body.sprintId);
      patch.sprintId = body.sprintId;
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

    if (Object.keys(patch).length === 0) {
      return serializeTicket(existing, project.name);
    }

    const updated = await taskRepository.update(ticketId, patch);
    if (!updated) {
      throw new Error("Ticket not found");
    }

    // Log activity: completed
    if (body.status === "done" && existing.status !== "done") {
      await activityService.logActivity({
        workspaceId: project.workspaceId,
        userId,
        action: "completed",
        entityType: "task",
        entityId: updated.id,
        entityName: updated.title,
      });
    }

    // Log activity: assigned
    if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
      await activityService.logActivity({
        workspaceId: project.workspaceId,
        userId,
        action: "assigned",
        entityType: "task",
        entityId: updated.id,
        entityName: updated.title,
      });
    }

    return serializeTicket(updated, project.name);
  }

  async deleteTicket(userId: string, projectId: string, ticketId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const existing = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!existing) {
      throw new Error("Ticket not found");
    }
    await taskRepository.delete(ticketId);
  }
}

export const taskService = new TaskService();
