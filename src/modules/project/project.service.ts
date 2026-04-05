import { projectRepository } from "./project.repository";
import { workspaceService } from "@/modules/workspace/workspace.service";

export const projectService = {
  async getWorkspaceProjects(userId: string, workspaceId: string) {
    // Optionally: verify the user actually belongs to this workspace before returning projects!
    const workspace = await workspaceService.getWorkspaceById(userId, workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found or unauthorized");
    }

    return await projectRepository.findProjectsByWorkspace(workspaceId);
  },

  async createProject(
    userId: string,
    payload: { name: string; description?: string; workspaceId: string }
  ) {
    // Verify workspace access
    const workspace = await workspaceService.getWorkspaceById(userId, payload.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found or unauthorized");
    }

    return await projectRepository.createProject({
      ...payload,
      createdBy: userId,
    });
  },

  async updateProject(
    userId: string,
    projectId: string,
    payload: { name?: string; description?: string }
  ) {
    // NOTE: Ideally verify here that userId is an admin/owner inside `projectMembersTable`
    return await projectRepository.updateProject(projectId, payload);
  },

  async deleteProject(userId: string, projectId: string) {
    // NOTE: Ideally verify here that userId is an admin/owner inside `projectMembersTable`
    await projectRepository.deleteProject(projectId);
  },
};
