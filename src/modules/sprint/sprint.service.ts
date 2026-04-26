import { db } from "@/lib/db";
import { projectRepository } from "@/modules/project/project.repository";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { sprintRepository } from "@/modules/sprint/sprint.repository";
import { tasksTable } from "@/modules/task/task.schema";
import { activityService } from "@/modules/activity/activity.service";
import { and, eq, ne } from "drizzle-orm";

export type SprintStatus = "planning" | "active" | "completed";

function serializeSprint(row: typeof sprintsTable.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    goal: row.goal,
    startDate: typeof row.startDate === "string" ? row.startDate : String(row.startDate),
    endDate: typeof row.endDate === "string" ? row.endDate : String(row.endDate),
    status: row.status as SprintStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseYmd(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
  return dt;
}

export class SprintService {
  async listSprints(userId: string, projectId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const rows = await sprintRepository.findByProject(projectId);
    const statusOrder = (s: string) => (s === "active" ? 0 : s === "planning" ? 1 : 2);
    const sorted = [...rows].sort((a, b) => {
      const so = statusOrder(a.status) - statusOrder(b.status);
      if (so !== 0) return so;
      if (a.status === "completed" && b.status === "completed") {
        return String(b.endDate).localeCompare(String(a.endDate));
      }
      return String(a.startDate).localeCompare(String(b.startDate));
    });
    return sorted.map(serializeSprint);
  }

  async createSprint(
    userId: string,
    projectId: string,
    body: { name: string; goal: string | null; startDate: string; endDate: string }
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const start = parseYmd(body.startDate);
    const end = parseYmd(body.endDate);
    if (!start || !end) {
      throw new Error("Invalid startDate or endDate (use YYYY-MM-DD)");
    }
    if (end.getTime() < start.getTime()) {
      throw new Error("endDate must be on or after startDate");
    }
    const row = await sprintRepository.insert({
      projectId,
      name: body.name,
      goal: body.goal,
      startDate: body.startDate,
      endDate: body.endDate,
      status: "planning",
    });
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "created",
      entityType: "sprint",
      entityId: row.id,
      entityName: row.name,
    });
    return serializeSprint(row);
  }

  async updateSprint(
    userId: string,
    projectId: string,
    sprintId: string,
    body: {
      name?: string;
      goal?: string | null;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    if (sprint.status === "completed") {
      throw new Error("Cannot edit a completed sprint");
    }
    const patch: Parameters<typeof sprintRepository.update>[1] = {};
    if (body.name !== undefined) {
      if (!body.name) throw new Error("name cannot be empty");
      patch.name = body.name;
    }
    if (body.goal !== undefined) patch.goal = body.goal;
    if (body.startDate !== undefined || body.endDate !== undefined) {
      if (sprint.status === "active") {
        throw new Error("Cannot change sprint dates while the sprint is active");
      }
      const nextStart =
        body.startDate ??
        (typeof sprint.startDate === "string" ? sprint.startDate : String(sprint.startDate));
      const nextEnd =
        body.endDate ??
        (typeof sprint.endDate === "string" ? sprint.endDate : String(sprint.endDate));
      const start = parseYmd(nextStart);
      const end = parseYmd(nextEnd);
      if (!start || !end) throw new Error("Invalid startDate or endDate (use YYYY-MM-DD)");
      if (end.getTime() < start.getTime()) {
        throw new Error("endDate must be on or after startDate");
      }
      if (body.startDate !== undefined) patch.startDate = nextStart;
      if (body.endDate !== undefined) patch.endDate = nextEnd;
    }
    if (Object.keys(patch).length === 0) {
      return serializeSprint(sprint);
    }
    const updated = await sprintRepository.update(sprintId, patch);
    if (!updated) throw new Error("Sprint not found");
    return serializeSprint(updated);
  }

  async deleteSprint(userId: string, projectId: string, sprintId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    if (sprint.status !== "planning") {
      throw new Error("Only planned sprints can be deleted");
    }
    await db.transaction(async (tx) => {
      await tx
        .update(tasksTable)
        .set({ sprintId: null, updatedAt: new Date() })
        .where(eq(tasksTable.sprintId, sprintId))
        .execute();
      await tx.delete(sprintsTable).where(eq(sprintsTable.id, sprintId)).execute();
    });
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "deleted",
      entityType: "sprint",
      entityId: sprintId,
      entityName: sprint.name,
    });
  }

  async startSprint(userId: string, projectId: string, sprintId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    if (sprint.status !== "planning") {
      throw new Error("Sprint must be in planning state to start");
    }
    const active = await sprintRepository.findActiveForProject(projectId);
    if (active && active.id !== sprintId) {
      throw new Error("Another sprint is already active. Complete it before starting a new one.");
    }
    const updated = await sprintRepository.update(sprintId, { status: "active" });
    if (!updated) throw new Error("Sprint not found");
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "started",
      entityType: "sprint",
      entityId: updated.id,
      entityName: updated.name,
    });
    return serializeSprint(updated);
  }

  async completeSprint(userId: string, projectId: string, sprintId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    if (sprint.status !== "active") {
      throw new Error("Only an active sprint can be completed");
    }
    const [updated] = await db.transaction(async (tx) => {
      await tx
        .update(tasksTable)
        .set({ sprintId: null, updatedAt: new Date() })
        .where(and(eq(tasksTable.sprintId, sprintId), ne(tasksTable.status, "done")))
        .execute();
      return tx
        .update(sprintsTable)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(sprintsTable.id, sprintId))
        .returning()
        .execute();
    });
    if (!updated) throw new Error("Sprint not found");
    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "completed",
      entityType: "sprint",
      entityId: updated.id,
      entityName: updated.name,
    });
    return serializeSprint(updated);
  }
}

export const sprintService = new SprintService();
