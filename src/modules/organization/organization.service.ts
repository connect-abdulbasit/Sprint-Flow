import { organizationRepository } from "./organization.repository";
import { workspaceRepository } from "@/modules/workspace/workspace.repository";
import { workspaceService } from "@/modules/workspace/workspace.service";
import crypto from "crypto";

export class OrganizationService {
  async createOrganization(
    userId: string,
    name: string,
    workspace?: { name: string; slug: string; description?: string }
  ) {
    const organization = await organizationRepository.createOrganization({ name, ownerId: userId });
    await organizationRepository.addMember({
      organizationId: organization.id,
      userId,
      role: "owner",
    });

    // Create a workspace for the organization
    // Default to "General" if not provided
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
    const org = await organizationRepository.getOrganization(userId, orgId);
    if (!org) {
      throw new Error("Organization not found or you don't have access");
    }

    const [members, workspaces, activeTasksCount] = await Promise.all([
      organizationRepository.getOrganizationMembers(orgId),
      organizationRepository.getOrganizationWorkspaces(orgId),
      organizationRepository.getOrganizationActiveTasksCount(orgId),
    ]);

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

  async sendInvite(
    userId: string,
    data: { organizationId: string; email: string; role: "member" | "admin" | "owner" }
  ) {
    const sender = await organizationRepository.getMember(userId, data.organizationId);
    if (!sender || !["owner", "admin"].includes(sender.role)) {
      throw new Error("Forbidden: Not authorized to invite");
    }

    const token = crypto.randomUUID();
    return organizationRepository.createInvite({ ...data, token, status: "pending" });
  }

  async acceptInvite(userId: string, token: string) {
    const invite = await organizationRepository.findInviteByToken(token);
    if (!invite) {
      throw new Error("Invalid or expired invite");
    }

    const existingMember = await organizationRepository.getMember(userId, invite.organizationId);
    if (existingMember) {
      throw new Error("Already a member of this organization");
    }

    await organizationRepository.addMember({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    });

    await organizationRepository.updateInviteStatus(invite.id, "accepted");
    return { success: true, message: "Successfully joined organization" };
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
    if (data.name !== undefined) updateData.name = data.name.trim();
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

    // Delete related workspaces first (cascades to workspace_members, prefs, notif_settings)
    const workspaces = await workspaceRepository.getWorkspacesByOrganizationId(orgId);
    for (const ws of workspaces) {
      await workspaceRepository.deleteWorkspace(ws.id);
    }

    // Delete organization (cascades to organization_members, organization_invites)
    await organizationRepository.deleteOrganization(orgId);

    return { success: true };
  }
}

export const organizationService = new OrganizationService();
