import { workspaceRepository } from "./workspace.repository";

export class WorkspaceService {
  async createWorkspace(
    userId: string,
    data: { name: string; organizationId: string; slug: string; description?: string }
  ) {
    const workspace = await workspaceRepository.createWorkspace({
      ...data,
    });

    // Auto-assign the creator as admin
    await workspaceRepository.addMember({
      workspaceId: workspace.id,
      userId,
      role: "admin",
    });

    return workspace;
  }

  async getUserWorkspaces(userId: string) {
    return workspaceRepository.getUserWorkspaces(userId);
  }

  async getWorkspaceById(userId: string, id: string) {
    const workspace = await workspaceRepository.getWorkspaceById(id);
    if (!workspace) return null;

    // Optional: Check if user is a member of the workspace or organization
    const member = await workspaceRepository.getMember(userId, id);
    if (!member) {
      // You might want to allow org admins to see all workspaces in their org
      // For now, strict membership check
      return null;
    }

    return workspace;
  }

  async updateWorkspace(userId: string, id: string, data: { name?: string; description?: string }) {
    const member = await workspaceRepository.getMember(userId, id);
    if (!member) {
      throw new Error("Access denied");
    }

    const updateData: Partial<{ name: string; description: string }> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    return workspaceRepository.updateWorkspace(id, updateData);
  }

  async deleteWorkspace(userId: string, id: string) {
    const member = await workspaceRepository.getMember(userId, id);
    if (!member) {
      throw new Error("Access denied");
    }

    return workspaceRepository.deleteWorkspace(id);
  }
}

export const workspaceService = new WorkspaceService();
