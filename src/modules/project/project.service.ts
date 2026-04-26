import { projectRepository } from "./project.repository";
import { workspaceService } from "@/modules/workspace/workspace.service";
import { activityService } from "@/modules/activity/activity.service";
import { parseBoardColumnsPayload } from "@/lib/board-columns";

export class ProjectService {
  async getWorkspaceProjects(userId: string, workspaceId: string) {
    // Verify workspace access
    const workspace = await workspaceService.getWorkspaceById(userId, workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found or access denied");
    }
    return projectRepository.findByWorkspace(workspace.id);
  }

  async createProject(
    userId: string,
    payload: { name: string; description?: string; workspaceId: string }
  ) {
    // Verify workspace access
    const workspace = await workspaceService.getWorkspaceById(userId, payload.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found or access denied");
    }
    const project = await projectRepository.create({
      ...payload,
      workspaceId: workspace.id,
      createdBy: userId,
    });

    await activityService.logActivity({
      workspaceId: payload.workspaceId,
      userId,
      action: "created",
      entityType: "project",
      entityId: project.id,
      entityName: project.name,
    });

    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    payload: {
      name?: string;
      description?: string | null;
      boardColumns?: unknown;
    }
  ) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const patch: Parameters<typeof projectRepository.update>[1] = {};
    if (payload.name !== undefined) {
      const n = String(payload.name).trim();
      if (!n) throw new Error("name cannot be empty");
      patch.name = n;
    }
    if (payload.description !== undefined) {
      patch.description = payload.description === null ? null : String(payload.description);
    }
    if (payload.boardColumns !== undefined) {
      patch.boardColumns = parseBoardColumnsPayload(payload.boardColumns);
    }
    if (Object.keys(patch).length === 0) {
      return project;
    }
    const updated = await projectRepository.update(projectId, patch);
    return updated ?? project;
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await activityService.logActivity({
      workspaceId: project.workspaceId,
      userId,
      action: "deleted",
      entityType: "project",
      entityId: project.id,
      entityName: project.name,
    });

    await projectRepository.delete(projectId);
  }

  async getProjectForMember(userId: string, projectId: string) {
    return projectRepository.getProjectIfMember(userId, projectId);
  }
}

export const projectService = new ProjectService();
