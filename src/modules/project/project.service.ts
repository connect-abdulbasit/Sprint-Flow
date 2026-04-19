import { projectRepository } from "./project.repository";
import { workspaceService } from "@/modules/workspace/workspace.service";

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
    return projectRepository.create({
      ...payload,
      workspaceId: workspace.id,
      createdBy: userId,
    });
  }

  async updateProject(
    userId: string,
    projectId: string,
    payload: { name?: string; description?: string }
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return projectRepository.update(projectId, payload);
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    await projectRepository.delete(projectId);
  }
}

export const projectService = new ProjectService();
