import { workspaceRepository } from "./workspace.repository";
import { db } from "@/lib/db";
import { workspaceMembersTable, workspaceInvitesTable } from "@/db";
import { organizationMembersTable } from "@/modules/organization/organization.schema";
import { activityService } from "@/modules/activity/activity.service";
import { authRepository } from "@/modules/auth/auth.repository";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { hasRole, type WorkspaceRole } from "@/lib/auth/rbac";

export class WorkspaceService {
  async createWorkspace(
    userId: string,
    data: { name: string; organizationId: string; slug: string; description?: string }
  ) {
    const workspace = await workspaceRepository.createWorkspace({
      ...data,
    });

    const privilegedMembers = await workspaceRepository.getPrivilegedOrgMembers(
      data.organizationId
    );
    const adminUserIds = new Set<string>([userId, ...privilegedMembers.map((m) => m.userId)]);

    for (const adminUserId of adminUserIds) {
      await workspaceRepository.addMember({
        workspaceId: workspace.id,
        userId: adminUserId,
        role: "admin",
      });
    }

    return workspace;
  }

  async getUserWorkspaces(userId: string) {
    return workspaceRepository.getUserWorkspaces(userId);
  }

  async getWorkspaceById(userId: string, id: string) {
    const workspace = await workspaceRepository.getWorkspaceById(id);
    if (!workspace) return null;

    const member = await workspaceRepository.getMember(userId, workspace.id);
    if (!member) {
      return null;
    }

    return workspace;
  }

  async updateWorkspace(userId: string, id: string, data: { name?: string; description?: string }) {
    const member = await workspaceRepository.getMember(userId, id);
    if (!member || !hasRole(member.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can update workspace settings");
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
    if (!member || !hasRole(member.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can delete workspaces");
    }

    return workspaceRepository.deleteWorkspace(id);
  }

  async getWorkspaceMembers(userId: string, workspaceId: string) {
    const caller = await workspaceRepository.getMember(userId, workspaceId);
    if (!caller) {
      throw new Error("Forbidden: You are not a member of this workspace.");
    }

    const results = await workspaceRepository.getWorkspaceMembers(workspaceId);
    return results.map((r) => ({
      userId: r.membership.userId,
      role: r.membership.role,
      joinedAt: r.membership.joinedAt.toISOString(),
      name: r.user?.name ?? "Unknown",
      email: r.user?.email ?? "",
      avatarUrl: r.user?.avatarUrl ?? null,
    }));
  }

  async sendInvite(
    userId: string,
    data: { workspaceId: string; email: string; role: WorkspaceRole }
  ) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("A valid email address is required.");
    }

    const workspace = await workspaceRepository.getWorkspaceById(data.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    const sender = await workspaceRepository.getMember(userId, data.workspaceId);
    if (!sender || !hasRole(sender.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: Only admins and project managers can send invites.");
    }

    const existingUser = await workspaceRepository.findUserByEmail(data.email);
    if (existingUser) {
      const existingMember = await workspaceRepository.getMember(existingUser.id, data.workspaceId);
      if (existingMember) {
        throw new Error("This user is already an active member of this workspace.");
      }
    }

    const acceptedInvite = await workspaceRepository.findAcceptedInvite(
      data.workspaceId,
      data.email
    );
    if (acceptedInvite) {
      throw new Error("This email has already accepted an invite to this workspace.");
    }

    if (sender.role === "project_manager" && data.role !== "member") {
      throw new Error("Forbidden: Project managers can only invite members.");
    }

    const pendingInvite = await workspaceRepository.findPendingInvite(data.workspaceId, data.email);
    if (pendingInvite) {
      if (pendingInvite.role !== data.role) {
        const updated = await workspaceRepository.updatePendingInviteRole(
          pendingInvite.id,
          data.role
        );
        return {
          id: updated.id,
          token: updated.token,
          message: "Existing pending invitation updated with the new role.",
          alreadyPending: true,
          roleUpdated: true,
        };
      }
      return {
        id: pendingInvite.id,
        token: pendingInvite.token,
        message: "An invitation is already pending for this email.",
        alreadyPending: true,
        roleUpdated: false,
      };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invite = await workspaceRepository.createInvite({
      workspaceId: data.workspaceId,
      email: data.email,
      role: data.role,
      token,
      status: "pending",
      invitedBy: userId,
      expiresAt,
    });

    return {
      id: invite.id,
      token: invite.token,
      message: "Invitation sent successfully.",
      alreadyPending: false,
      roleUpdated: false,
    };
  }

  async getInviteByToken(token: string) {
    const result = await workspaceRepository.getInviteDetailsByToken(token);
    if (!result || !result.invite) {
      return null;
    }

    const invite = result.invite;
    const workspace = result.workspace;
    const organization = result.organization;
    const inviter = result.inviter;

    if (new Date(invite.expiresAt) < new Date()) {
      return { ...invite, status: "expired" as const, workspace, inviter };
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      workspaceName: workspace?.name ?? "Unknown Workspace",
      workspaceId: workspace?.id ?? "",
      organizationId: workspace?.organizationId ?? "",
      organizationName: organization?.name ?? "Unknown Organization",
      invitedByName: inviter?.name ?? "Unknown",
    };
  }

  async acceptInvite(userId: string, token: string) {
    const inviteRow = await workspaceRepository.findInviteByToken(token);
    if (!inviteRow) {
      throw new Error("Invalid or expired invitation.");
    }

    if (new Date(inviteRow.expiresAt) < new Date()) {
      throw new Error("This invitation has expired.");
    }

    const workspace = await workspaceRepository.getWorkspaceById(inviteRow.workspaceId);
    if (!workspace) {
      throw new Error("The workspace for this invitation no longer exists.");
    }

    const existingWorkspaceMember = await workspaceRepository.getMember(
      userId,
      inviteRow.workspaceId
    );
    if (existingWorkspaceMember) {
      await workspaceRepository.updateInviteStatus(inviteRow.id, "accepted");
      return { success: true, message: "You are already a member of this workspace." };
    }

    await db.transaction(async (tx) => {
      const existingOrgMember = await workspaceRepository.getOrgMember(
        userId,
        workspace.organizationId
      );
      if (!existingOrgMember) {
        await tx
          .insert(organizationMembersTable)
          .values({
            organizationId: workspace.organizationId,
            userId,
            role: "member",
          })
          .execute();
      }

      await tx
        .insert(workspaceMembersTable)
        .values({
          workspaceId: inviteRow.workspaceId,
          userId,
          role: inviteRow.role as WorkspaceRole,
        })
        .execute();

      await tx
        .update(workspaceInvitesTable)
        .set({ status: "accepted" })
        .where(eq(workspaceInvitesTable.id, inviteRow.id))
        .execute();
    });

    const user = await authRepository.findUserById(userId);

    await activityService.logActivity({
      workspaceId: inviteRow.workspaceId,
      userId,
      action: "joined",
      entityType: "member",
      entityId: userId,
      entityName: user?.name ?? "Unknown",
    });

    return {
      success: true,
      message: "Successfully joined workspace.",
      workspaceId: inviteRow.workspaceId,
      organizationId: workspace.organizationId,
    };
  }

  async removeMember(callerUserId: string, workspaceId: string, targetUserId: string) {
    const caller = await workspaceRepository.getMember(callerUserId, workspaceId);
    if (!caller || !hasRole(caller.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: Only workspace admins can remove members.");
    }

    const members = await workspaceRepository.getWorkspaceMembers(workspaceId);
    const admins = members.filter((m) => m.membership.role === "admin");
    if (targetUserId === callerUserId && admins.length <= 1) {
      throw new Error("You cannot remove yourself as the only admin.");
    }

    const targetUser = await authRepository.findUserById(targetUserId);

    await db
      .delete(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, workspaceId),
          eq(workspaceMembersTable.userId, targetUserId)
        )
      )
      .execute();

    await activityService.logActivity({
      workspaceId,
      userId: targetUserId,
      action: "left",
      entityType: "member",
      entityId: targetUserId,
      entityName: targetUser?.name ?? "Unknown",
    });

    return { success: true, message: "Member removed successfully." };
  }

  async rejectInvite(token: string) {
    const inviteRow = await workspaceRepository.findInviteByToken(token);
    if (!inviteRow) {
      throw new Error("Invalid or expired invitation.");
    }

    await workspaceRepository.updateInviteStatus(inviteRow.id, "declined");
    return { success: true, message: "Invitation declined." };
  }

  async getWorkspaceInvites(userId: string, workspaceId: string) {
    const member = await workspaceRepository.getMember(userId, workspaceId);
    if (!member || !hasRole(member.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: Only admins and project managers can view invites.");
    }

    const results = await workspaceRepository.getWorkspaceInvites(workspaceId);
    return results.map((r) => ({
      id: r.invite.id,
      email: r.invite.email,
      role: r.invite.role,
      status: r.invite.status,
      token: r.invite.token,
      expiresAt: r.invite.expiresAt.toISOString(),
      createdAt: r.invite.createdAt.toISOString(),
      invitedByName: r.inviter?.name ?? null,
    }));
  }
}

export const workspaceService = new WorkspaceService();
