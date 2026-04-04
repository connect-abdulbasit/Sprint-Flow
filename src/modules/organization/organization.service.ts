import { organizationRepository } from "./organization.repository";
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
}

export const organizationService = new OrganizationService();
