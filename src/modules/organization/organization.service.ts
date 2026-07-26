import { organizationRepository } from "./organization.repository";
import { workspaceRepository } from "@/modules/workspace/workspace.repository";
import { workspaceService } from "@/modules/workspace/workspace.service";
import { removeWorkspaceLogoFile } from "@/lib/workspace-logo-storage";
import { validateNameLength } from "@/lib/validation";

export class OrganizationService {
  async createOrganization(
    userId: string,
    name: string,
    workspace?: { name: string; slug: string; description?: string }
  ) {
    const nameLengthError = validateNameLength(name, "Organization name");
    if (nameLengthError) {
      throw new Error(nameLengthError);
    }
    if (workspace?.name) {
      const workspaceNameError = validateNameLength(workspace.name, "Workspace name");
      if (workspaceNameError) {
        throw new Error(workspaceNameError);
      }
    }

    const organization = await organizationRepository.createOrganization({ name, ownerId: userId });
    await organizationRepository.addMember({
      organizationId: organization.id,
      userId,
      role: "owner",
    });

    const ws = await workspaceService.createWorkspace(userId, {
      name: workspace?.name || "General",
      organizationId: organization.id,
      slug: workspace?.slug || "general",
      description: workspace?.description || "Default workspace for collaboration",
    });

    return { organization, workspace: ws };
  }

  async getUserOrganizations(userId: string) {
    return organizationRepository.getUserOrganizations(userId);
  }

  async getOrganizationById(userId: string, orgId: string) {
    const org = await organizationRepository.getOrganization(userId, orgId);
    if (!org) {
      throw new Error("Organization not found or you don't have access");
    }
    return org;
  }

  async getOrganizationDashboard(userId: string, orgId: string) {
    const [org, orgMembership] = await Promise.all([
      organizationRepository.getOrganization(userId, orgId),
      organizationRepository.getMember(userId, orgId),
    ]);

    if (!org || !orgMembership) {
      throw new Error("Organization not found or you don't have access");
    }

    const canViewAllWorkspaces = orgMembership.role === "owner" || orgMembership.role === "admin";

    const [members, workspaces] = await Promise.all([
      organizationRepository.getOrganizationMembers(orgId),
      canViewAllWorkspaces
        ? organizationRepository.getOrganizationWorkspaces(orgId)
        : organizationRepository.getUserOrganizationWorkspaces(userId, orgId),
    ]);

    const activeTasksCount = canViewAllWorkspaces
      ? await organizationRepository.getOrganizationActiveTasksCount(orgId)
      : await organizationRepository.getActiveTasksCountForWorkspaceIds(
          workspaces.map((ws) => ws.id)
        );

    return {
      organization: org,
      workspaces,
      members: members.map((m) => ({
        ...m,
        name: m.name ?? m.email ?? "Unknown User",
      })),
      stats: {
        workspaceCount: workspaces.length,
        memberCount: members.length,
        activeTasksCount,
      },
    };
  }

  async updateOrganization(
    userId: string,
    orgId: string,
    data: { name?: string; description?: string }
  ) {
    const member = await organizationRepository.getMember(userId, orgId);
    if (!member || !["owner", "admin"].includes(member.role)) {
      throw new Error("Forbidden: Not authorized to update organization");
    }

    const updateData: Partial<{ name: string; description: string }> = {};
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      const nameLengthError = validateNameLength(trimmedName, "Organization name");
      if (nameLengthError) {
        throw new Error(nameLengthError);
      }
      updateData.name = trimmedName;
    }
    if (data.description !== undefined) updateData.description = data.description.trim();

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    return organizationRepository.updateOrganization(orgId, updateData);
  }

  async deleteOrganization(userId: string, orgId: string) {
    const member = await organizationRepository.getMember(userId, orgId);
    if (!member || member.role !== "owner") {
      throw new Error("Forbidden: Only the owner can delete the organization");
    }

    // AUD-043: this bypassed workspaceService.deleteWorkspace entirely — going straight
    // to the repository skipped its logo-file cleanup, so any uploaded workspace logo
    // was orphaned on disk forever whenever the parent organization was deleted. The
    // per-workspace admin-membership check inside that service method is intentionally
    // NOT reused here: the org owner deleting the whole organization is already the
    // relevant authorization, and they may not personally be an admin of every
    // workspace inside it.
    const workspaces = await workspaceRepository.getWorkspacesByOrganizationId(orgId);
    for (const ws of workspaces) {
      if (ws.logoUrl?.startsWith("/uploads/workspaces/")) {
        await removeWorkspaceLogoFile(ws.logoUrl);
      }
      await workspaceRepository.deleteWorkspace(ws.id);
    }

    await organizationRepository.deleteOrganization(orgId);

    return { success: true };
  }
}

export const organizationService = new OrganizationService();
