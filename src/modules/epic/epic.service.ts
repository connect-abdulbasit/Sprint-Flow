import { projectRepository } from "@/modules/project/project.repository";
import { authRepository } from "@/modules/auth/auth.repository";
import { epicRepository, type EpicRow } from "@/modules/epic/epic.repository";
import { taskRepository } from "@/modules/task/task.repository";
import { activityService } from "@/modules/activity/activity.service";
import { notificationService } from "@/modules/notification/notification.service";
import { hasRole, type WorkspaceRole } from "@/lib/auth/rbac";
import { type EpicStatus } from "@/modules/epic/epic.types";
import { validateEpicCreateInput, validateEpicUpdateInput } from "@/modules/epic/epic.validation";
import type { PaginationInput } from "@/lib/pagination";

type TaskLeaf = { status: string };
type TaskWithSubtasks = { status: string; subtasks: TaskLeaf[] };

/** Flattens each issue to its subtasks (if any) or itself, then computes
 * completion at that leaf level, while reporting issue-level counts separately
 * — an issue only counts as "completed" if it (or all of its subtasks) is done. */
export function computeEpicProgress(issues: TaskWithSubtasks[]) {
  const leaves: TaskLeaf[] = issues.flatMap((issue) =>
    issue.subtasks.length ? issue.subtasks : [issue]
  );
  const doneLeaves = leaves.filter((l) => l.status === "done").length;
  const progressPercent = leaves.length ? Math.round((100 * doneLeaves) / leaves.length) : 0;

  const isIssueDone = (issue: TaskWithSubtasks) =>
    issue.subtasks.length
      ? issue.subtasks.every((s) => s.status === "done")
      : issue.status === "done";
  const completedIssueCount = issues.filter(isIssueDone).length;

  return {
    issueCount: issues.length,
    completedIssueCount,
    progressPercent,
  };
}

function serializeEpic(row: EpicRow, progress: ReturnType<typeof computeEpicProgress>) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    status: row.status as EpicStatus,
    priority: row.priority,
    ownerId: row.ownerId,
    ownerName: row.ownerName,
    color: row.color,
    icon: row.icon,
    labels: row.labels ?? [],
    startDate: row.startDate,
    dueDate: row.dueDate,
    orderIndex: row.orderIndex,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...progress,
  };
}

export class EpicService {
  /** Groups a project's flat task list into issues (top-level) with nested subtasks,
   * keyed by epicId — the single source `computeEpicProgress` needs, and reused by
   * the client for the same grouping (see src/lib/issue-hierarchy.ts). */
  private async loadIssuesByEpic(projectId: string) {
    const tasks = await taskRepository.findProgressInputsByProject(projectId);
    const subtasksByParent = new Map<string, TaskLeaf[]>();
    for (const t of tasks) {
      if (!t.parentTaskId) continue;
      const list = subtasksByParent.get(t.parentTaskId) ?? [];
      list.push({ status: t.status });
      subtasksByParent.set(t.parentTaskId, list);
    }
    const issuesByEpic = new Map<string | null, TaskWithSubtasks[]>();
    for (const t of tasks) {
      if (t.parentTaskId) continue; // only top-level issues are counted directly
      const key = t.epicId ?? null;
      const list = issuesByEpic.get(key) ?? [];
      list.push({ status: t.status, subtasks: subtasksByParent.get(t.id) ?? [] });
      issuesByEpic.set(key, list);
    }
    return issuesByEpic;
  }

  async listEpics(
    userId: string,
    projectId: string,
    opts?: { includeArchived?: boolean; skipProgress?: boolean }
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const rows = await epicRepository.findByProject(projectId, opts);
    if (opts?.skipProgress) {
      const emptyProgress = { issueCount: 0, completedIssueCount: 0, progressPercent: 0 };
      return rows.map((row) => serializeEpic(row, emptyProgress));
    }
    const issuesByEpic = await this.loadIssuesByEpic(projectId);
    return rows.map((row) =>
      serializeEpic(row, computeEpicProgress(issuesByEpic.get(row.id) ?? []))
    );
  }

  async getEpic(userId: string, projectId: string, epicId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const row = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!row) {
      throw new Error("Epic not found");
    }
    const issuesByEpic = await this.loadIssuesByEpic(projectId);
    return serializeEpic(row, computeEpicProgress(issuesByEpic.get(row.id) ?? []));
  }

  private async resolveOwner(projectId: string, ownerId: string | null) {
    if (ownerId === null) {
      return { ownerId: null, ownerName: null as string | null };
    }
    if (!(await projectRepository.isProjectMember(projectId, ownerId))) {
      throw new Error("Owner must be a member of this project");
    }
    const user = await authRepository.findUserById(ownerId);
    if (!user) {
      throw new Error("Owner user not found");
    }
    return { ownerId, ownerName: user.name };
  }

  async createEpic(userId: string, projectId: string, body: Record<string, unknown>) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: only admins and project managers can create epics");
    }
    const { project } = membership;

    const input = validateEpicCreateInput(body);
    const owner = await this.resolveOwner(projectId, input.ownerId);

    const created = await epicRepository.insertWithNextOrderIndex({
      projectId,
      name: input.name,
      description: input.description,
      status: input.status,
      priority: input.priority,
      ownerId: owner.ownerId,
      ownerName: owner.ownerName,
      color: input.color,
      icon: input.icon,
      labels: input.labels,
      startDate: input.startDate,
      dueDate: input.dueDate,
    });

    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "created",
      entityType: "epic",
      entityId: created.id,
      entityName: created.name,
    });

    return serializeEpic(created, computeEpicProgress([]));
  }

  async updateEpic(
    userId: string,
    projectId: string,
    epicId: string,
    body: Partial<Record<string, unknown>>
  ) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: only admins and project managers can edit epics");
    }
    const { project } = membership;
    const existing = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!existing) {
      throw new Error("Epic not found");
    }

    const validated = validateEpicUpdateInput(body);
    const patch: Parameters<typeof epicRepository.update>[1] = {};

    if (validated.name !== undefined) patch.name = validated.name;
    if (validated.description !== undefined) patch.description = validated.description;
    if (validated.status !== undefined) patch.status = validated.status;
    if (validated.priority !== undefined) patch.priority = validated.priority;
    if (validated.color !== undefined) patch.color = validated.color;
    if (validated.icon !== undefined) patch.icon = validated.icon;
    if (validated.labels !== undefined) patch.labels = validated.labels;
    if (validated.startDate !== undefined) patch.startDate = validated.startDate;
    if (validated.dueDate !== undefined) patch.dueDate = validated.dueDate;

    if (validated.startDate !== undefined || validated.dueDate !== undefined) {
      const startDate = validated.startDate ?? existing.startDate;
      const dueDate = validated.dueDate ?? existing.dueDate;
      if (startDate && dueDate && dueDate < startDate) {
        throw new Error("due date cannot be before start date");
      }
    }

    if (validated.ownerId !== undefined) {
      const owner = await this.resolveOwner(projectId, validated.ownerId);
      patch.ownerId = owner.ownerId;
      patch.ownerName = owner.ownerName;
    }

    if (Object.keys(patch).length === 0) {
      const issuesByEpic = await this.loadIssuesByEpic(projectId);
      return serializeEpic(existing, computeEpicProgress(issuesByEpic.get(existing.id) ?? []));
    }

    const updated = await epicRepository.update(epicId, patch);
    if (!updated) throw new Error("Epic not found");

    if (validated.status !== undefined && validated.status !== existing.status) {
      await activityService.logActivity({
        workspaceId: project.workspaceId,
        userId,
        action: "status_changed",
        entityType: "epic",
        entityId: updated.id,
        entityName: updated.name,
      });
    }
    if (validated.priority !== undefined && patch.priority !== existing.priority) {
      await activityService.logActivity({
        workspaceId: project.workspaceId,
        userId,
        action: "priority_changed",
        entityType: "epic",
        entityId: updated.id,
        entityName: updated.name,
      });
    }
    if (validated.ownerId !== undefined && updated.ownerId !== existing.ownerId) {
      await activityService.logActivity({
        workspaceId: project.workspaceId,
        userId,
        action: "assigned",
        entityType: "epic",
        entityId: updated.id,
        entityName: updated.name,
      });
      if (updated.ownerId && updated.ownerId !== userId) {
        try {
          await notificationService.createNotificationWithType({
            workspaceId: project.workspaceId,
            userId: updated.ownerId,
            originUserId: userId,
            type: "task_assignment",
            targetType: "task",
            targetId: updated.id,
            title: `Epic owner assigned: ${updated.name}`,
            message: `You were made owner of the epic "${updated.name}".`,
          });
        } catch (error) {
          console.error("Create epic-owner notification error:", error);
        }
      }
    }
    if (
      (validated.name !== undefined && validated.name !== existing.name) ||
      validated.description !== undefined
    ) {
      await activityService.logActivity({
        workspaceId: project.workspaceId,
        userId,
        action: "edited",
        entityType: "epic",
        entityId: updated.id,
        entityName: updated.name,
      });
    }

    const issuesByEpic = await this.loadIssuesByEpic(projectId);
    return serializeEpic(updated, computeEpicProgress(issuesByEpic.get(updated.id) ?? []));
  }

  async deleteEpic(userId: string, projectId: string, epicId: string) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can delete epics");
    }
    const { project } = membership;
    const existing = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!existing) {
      throw new Error("Epic not found");
    }
    // FK is onDelete: "set null" — issues/subtasks are orphaned, not deleted.
    await epicRepository.delete(epicId);
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "deleted",
      entityType: "epic",
      entityId: epicId,
      entityName: existing.name,
    });
  }

  private async setArchived(userId: string, projectId: string, epicId: string, archived: boolean) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: only admins and project managers can archive epics");
    }
    const { project } = membership;
    const existing = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!existing) {
      throw new Error("Epic not found");
    }
    const updated = await epicRepository.update(epicId, {
      archivedAt: archived ? new Date() : null,
    });
    if (!updated) throw new Error("Epic not found");
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: archived ? "archived" : "unarchived",
      entityType: "epic",
      entityId: updated.id,
      entityName: updated.name,
    });
    const issuesByEpic = await this.loadIssuesByEpic(projectId);
    return serializeEpic(updated, computeEpicProgress(issuesByEpic.get(updated.id) ?? []));
  }

  archiveEpic(userId: string, projectId: string, epicId: string) {
    return this.setArchived(userId, projectId, epicId, true);
  }

  unarchiveEpic(userId: string, projectId: string, epicId: string) {
    return this.setArchived(userId, projectId, epicId, false);
  }

  /** Duplicates the epic shell only (name, description, status reset to backlog,
   * fresh order) — deliberately does NOT deep-copy its issues, to avoid a
   * surprising bulk-ticket creation. Documented in the UI. */
  async duplicateEpic(userId: string, projectId: string, epicId: string) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: only admins and project managers can duplicate epics");
    }
    const { project } = membership;
    const existing = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!existing) {
      throw new Error("Epic not found");
    }
    const created = await epicRepository.insertWithNextOrderIndex({
      projectId,
      name: `${existing.name} (copy)`,
      description: existing.description,
      status: "backlog",
      priority: existing.priority,
      ownerId: existing.ownerId,
      ownerName: existing.ownerName,
      color: existing.color,
      icon: existing.icon,
      labels: existing.labels,
      startDate: existing.startDate,
      dueDate: existing.dueDate,
    });
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "created",
      entityType: "epic",
      entityId: created.id,
      entityName: created.name,
    });
    return serializeEpic(created, computeEpicProgress([]));
  }

  async moveEpic(userId: string, projectId: string, epicId: string, targetIndex: number) {
    const membership = await projectRepository.getProjectIfMemberWithRole(userId, projectId);
    if (!membership) {
      throw new Error("Project not found or access denied");
    }
    if (!hasRole(membership.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: only admins and project managers can reorder epics");
    }
    const existing = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!existing) {
      throw new Error("Epic not found");
    }
    const rows = await epicRepository.findByProject(projectId, { includeArchived: true });
    const orderedIds = rows.map((r) => r.id).filter((id) => id !== epicId);
    const clampedIndex = Math.max(0, Math.min(targetIndex, orderedIds.length));
    orderedIds.splice(clampedIndex, 0, epicId);
    await epicRepository.reindexOrder(projectId, orderedIds);
    return this.listEpics(userId, projectId, { includeArchived: true });
  }

  async getEpicActivity(
    userId: string,
    projectId: string,
    epicId: string,
    pagination: PaginationInput
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const existing = await epicRepository.findByIdAndProject(epicId, projectId);
    if (!existing) {
      throw new Error("Epic not found");
    }
    return activityService.getEntityActivities("epic", epicId, pagination);
  }
}

export const epicService = new EpicService();
