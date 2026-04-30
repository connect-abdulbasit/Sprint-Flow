import { workspaceRepository } from "./workspace.repository";
import { db } from "@/lib/db";
import { workspaceMembersTable, workspaceInvitesTable } from "@/db";
import { organizationMembersTable } from "@/modules/organization/organization.schema";
import { activityService } from "@/modules/activity/activity.service";
import { authRepository } from "@/modules/auth/auth.repository";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

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
    const member = await workspaceRepository.getMember(userId, workspace.id);
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

  // ── Members ────────────────────────────────────────────────

  async getWorkspaceMembers(userId: string, workspaceId: string) {
    // Verify caller is a member
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

  // ── Invite: Send ───────────────────────────────────────────

  async sendInvite(
    userId: string,
    data: { workspaceId: string; email: string; role: "member" | "admin" }
  ) {
    // 1. Email-only validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("A valid email address is required.");
    }

    // 2. Verify workspace exists
    const workspace = await workspaceRepository.getWorkspaceById(data.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    // 3. Verify sender is admin/member of workspace
    const sender = await workspaceRepository.getMember(userId, data.workspaceId);
    if (!sender || sender.role !== "admin") {
      throw new Error("Forbidden: Only workspace admins can send invites.");
    }

    // 4. Check if user is already a workspace member (by email)
    const existingUser = await workspaceRepository.findUserByEmail(data.email);
    if (existingUser) {
      const existingMember = await workspaceRepository.getMember(existingUser.id, data.workspaceId);
      if (existingMember) {
        throw new Error("This user is already an active member of this workspace.");
      }
    }

    // 5. Check for already accepted invite
    const acceptedInvite = await workspaceRepository.findAcceptedInvite(
      data.workspaceId,
      data.email
    );
    if (acceptedInvite) {
      throw new Error("This email has already accepted an invite to this workspace.");
    }

    // 6. Prevent duplicate pending invites (anti-spam) — return existing silently
    const pendingInvite = await workspaceRepository.findPendingInvite(data.workspaceId, data.email);
    if (pendingInvite) {
      return {
        id: pendingInvite.id,
        token: pendingInvite.token,
        message: "An invitation is already pending for this email.",
        alreadyPending: true,
      };
    }

    // 7. Create the invite
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
    };
  }

  // ── Invite: Get details by token ──────────────────────────

  async getInviteByToken(token: string) {
    const result = await workspaceRepository.getInviteDetailsByToken(token);
    if (!result || !result.invite) {
      return null;
    }

    const invite = result.invite;
    const workspace = result.workspace;
    const inviter = result.inviter;

    // Check if expired
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
      invitedByName: inviter?.name ?? "Unknown",
    };
  }

  // ── Invite: Accept ────────────────────────────────────────

  async acceptInvite(userId: string, token: string) {
    const inviteRow = await workspaceRepository.findInviteByToken(token);
    if (!inviteRow) {
      throw new Error("Invalid or expired invitation.");
    }

    if (new Date(inviteRow.expiresAt) < new Date()) {
      throw new Error("This invitation has expired.");
    }

    // Get workspace to find the parent org
    const workspace = await workspaceRepository.getWorkspaceById(inviteRow.workspaceId);
    if (!workspace) {
      throw new Error("The workspace for this invitation no longer exists.");
    }

    // Check if already a workspace member
    const existingWorkspaceMember = await workspaceRepository.getMember(
      userId,
      inviteRow.workspaceId
    );
    if (existingWorkspaceMember) {
      // Mark as accepted anyway
      await workspaceRepository.updateInviteStatus(inviteRow.id, "accepted");
      return { success: true, message: "You are already a member of this workspace." };
    }

    // Transactional: add org member + workspace member + update invite status
    await db.transaction(async (tx) => {
      // 1. Grant org access if not already a member
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

      // 2. Grant workspace access
      await tx
        .insert(workspaceMembersTable)
        .values({
          workspaceId: inviteRow.workspaceId,
          userId,
          role: inviteRow.role as "admin" | "member",
        })
        .execute();

      // 3. Update invite status
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
    // Verify caller is admin
    const caller = await workspaceRepository.getMember(callerUserId, workspaceId);
    if (!caller || caller.role !== "admin") {
      throw new Error("Forbidden: Only workspace admins can remove members.");
    }

    // Prevent self-removal if you're the only admin
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

  // ── Invite: Reject ────────────────────────────────────────

  async rejectInvite(token: string) {
    const inviteRow = await workspaceRepository.findInviteByToken(token);
    if (!inviteRow) {
      throw new Error("Invalid or expired invitation.");
    }

    await workspaceRepository.updateInviteStatus(inviteRow.id, "declined");
    return { success: true, message: "Invitation declined." };
  }

  // ── Invite: list pending for a workspace ──────────────────

  async getWorkspaceInvites(userId: string, workspaceId: string) {
    // Verify user is admin
    const member = await workspaceRepository.getMember(userId, workspaceId);
    if (!member || member.role !== "admin") {
      throw new Error("Forbidden: Only workspace admins can view invites.");
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
