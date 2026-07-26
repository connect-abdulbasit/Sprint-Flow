import { workspaceRepository } from "./workspace.repository";
import { removeWorkspaceLogoFile, replaceWorkspaceLogoFile } from "@/lib/workspace-logo-storage";
import { db } from "@/lib/db";
import { workspaceMembersTable, workspaceInvitesTable } from "@/db";
import { organizationMembersTable } from "@/modules/organization/organization.schema";
import { activityService } from "@/modules/activity/activity.service";
import { authRepository } from "@/modules/auth/auth.repository";
import { eq, and, gt, sql } from "drizzle-orm";
import crypto from "crypto";
import { hasRole, type WorkspaceRole } from "@/lib/auth/rbac";
import { validateNameLength } from "@/lib/validation";

export class WorkspaceService {
  async createWorkspace(
    userId: string,
    data: { name: string; organizationId: string; slug: string; description?: string }
  ) {
    // AUD-008: previously anyone authenticated could create a workspace under any
    // organizationId they supplied, becoming its admin — a resource-injection foothold
    // into organizations they were never invited to. Every other write in this module
    // verifies membership first; this one didn't.
    const orgMember = await workspaceRepository.getOrgMember(userId, data.organizationId);
    if (!orgMember) {
      throw new Error("Forbidden: you are not a member of this organization.");
    }

    const nameLengthError = validateNameLength(data.name, "Workspace name");
    if (nameLengthError) {
      throw new Error(nameLengthError);
    }

    // AUD-044: the slug column is now uniquely constrained at the DB level; check
    // first for a clean error message, and still handle the constraint violation below
    // in case of a race between this check and the insert.
    const existingSlug = await workspaceRepository.getWorkspaceById(data.slug);
    if (existingSlug) {
      throw new Error("This workspace URL is already taken. Please choose another.");
    }

    let workspace;
    try {
      workspace = await workspaceRepository.createWorkspace({
        ...data,
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "23505") {
        throw new Error("This workspace URL is already taken. Please choose another.");
      }
      throw error;
    }

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

  async updateWorkspace(
    userId: string,
    id: string,
    data: { name?: string; description?: string; logoUrl?: string | null }
  ) {
    const member = await workspaceRepository.getMember(userId, id);
    if (!member || !hasRole(member.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can update workspace settings");
    }

    const existing = await workspaceRepository.getWorkspaceById(id);
    if (!existing) {
      throw new Error("Workspace not found");
    }

    const updateData: Partial<{ name: string; description: string; logoUrl: string | null }> = {};
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      const nameLengthError = validateNameLength(trimmedName, "Workspace name");
      if (nameLengthError) {
        throw new Error(nameLengthError);
      }
      updateData.name = trimmedName;
    }
    if (data.description !== undefined) updateData.description = data.description.trim();

    if (data.logoUrl !== undefined) {
      const next =
        data.logoUrl === null || data.logoUrl === "" ? null : String(data.logoUrl).trim();
      if (
        existing.logoUrl &&
        existing.logoUrl.startsWith("/uploads/workspaces/") &&
        existing.logoUrl !== next
      ) {
        await removeWorkspaceLogoFile(existing.logoUrl);
      }
      updateData.logoUrl = next;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    return workspaceRepository.updateWorkspace(id, updateData);
  }

  async uploadWorkspaceLogo(userId: string, workspaceId: string, buffer: Buffer, mimeType: string) {
    const member = await workspaceRepository.getMember(userId, workspaceId);
    if (!member || !hasRole(member.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can update the workspace logo");
    }

    const workspace = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const MAX_BYTES = 2 * 1024 * 1024;
    if (buffer.length > MAX_BYTES) {
      throw new Error("Image must be 2MB or smaller");
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(mimeType)) {
      throw new Error("Only JPG, PNG, WebP, or GIF images are allowed");
    }

    const publicPath = await replaceWorkspaceLogoFile(workspaceId, buffer, mimeType);
    return workspaceRepository.updateWorkspace(workspaceId, { logoUrl: publicPath });
  }

  async clearWorkspaceLogo(userId: string, workspaceId: string) {
    const member = await workspaceRepository.getMember(userId, workspaceId);
    if (!member || !hasRole(member.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can update the workspace logo");
    }

    const workspace = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    if (workspace.logoUrl?.startsWith("/uploads/workspaces/")) {
      await removeWorkspaceLogoFile(workspace.logoUrl);
    }

    return workspaceRepository.updateWorkspace(workspaceId, { logoUrl: null });
  }

  async deleteWorkspace(userId: string, id: string) {
    const member = await workspaceRepository.getMember(userId, id);
    if (!member || !hasRole(member.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: only admins can delete workspaces");
    }

    const existing = await workspaceRepository.getWorkspaceById(id);
    if (existing?.logoUrl?.startsWith("/uploads/workspaces/")) {
      await removeWorkspaceLogoFile(existing.logoUrl);
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

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // AUD-042: checking for an existing pending invite and creating a new one were two
    // separate statements with no locking — two concurrent sends to the same
    // (workspace, email) could both pass the "no pending invite" check and create two
    // separate pending rows. An advisory lock scoped to that pair serializes this
    // section so only one invite can ever be pending at a time.
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${data.workspaceId + ":" + data.email.toLowerCase()}))`
      );

      const [pendingInvite] = await tx
        .select()
        .from(workspaceInvitesTable)
        .where(
          and(
            eq(workspaceInvitesTable.workspaceId, data.workspaceId),
            eq(workspaceInvitesTable.email, data.email),
            eq(workspaceInvitesTable.status, "pending"),
            gt(workspaceInvitesTable.expiresAt, new Date())
          )
        )
        .execute();

      if (pendingInvite) {
        if (pendingInvite.role !== data.role) {
          const [updated] = await tx
            .update(workspaceInvitesTable)
            .set({ role: data.role })
            .where(eq(workspaceInvitesTable.id, pendingInvite.id))
            .returning()
            .execute();
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

      const [invite] = await tx
        .insert(workspaceInvitesTable)
        .values({
          workspaceId: data.workspaceId,
          email: data.email,
          role: data.role,
          token,
          status: "pending",
          invitedBy: userId,
          expiresAt,
        })
        .returning()
        .execute();

      return {
        id: invite.id,
        token: invite.token,
        message: "Invitation sent successfully.",
        alreadyPending: false,
        roleUpdated: false,
      };
    });
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
    // Look up by token regardless of status so we can tell the difference between
    // "never existed", "expired", and "already used" — findInviteByToken filters to
    // status='pending' only, which isn't enough information for a good error message.
    const inviteDetails = await workspaceRepository.getInviteDetailsByToken(token);
    const inviteRow = inviteDetails?.invite;
    if (!inviteRow) {
      throw new Error("Invalid or expired invitation.");
    }

    if (new Date(inviteRow.expiresAt) < new Date()) {
      throw new Error("This invitation has expired.");
    }
    if (inviteRow.status === "revoked") {
      throw new Error("This invitation has been revoked.");
    }

    // AUD-003: token possession alone is not proof of identity — only the person the
    // invitation was actually sent to may accept it. Without this check, anyone who
    // obtains the link (forwarded email, shared inbox, browser history, referrer leak)
    // could join at whatever role the invite carries, including admin.
    const acceptingUser = await authRepository.findUserById(userId);
    if (!acceptingUser) {
      throw new Error("Invalid or expired invitation.");
    }
    if (acceptingUser.email.toLowerCase() !== inviteRow.email.toLowerCase()) {
      throw new Error(
        "EMAIL_MISMATCH: This invitation was sent to a different email address. Sign in with that email to accept it."
      );
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
      // Idempotent: re-clicking a link after already joining shouldn't error. Best-effort
      // mark it accepted if it's still pending; ignore if another request already did.
      await workspaceRepository.claimPendingInvite(inviteRow.id);
      return { success: true, message: "You are already a member of this workspace." };
    }

    // AUD-004: claim the invite with a single conditional UPDATE (status='pending' -> 'accepted')
    // inside the same transaction as the membership insert. This closes the race where two
    // concurrent accept requests could both read status='pending' before either commits —
    // only one request can ever win this atomic claim, and a lost race rolls back cleanly.
    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(workspaceInvitesTable)
        .set({ status: "accepted" })
        .where(
          and(
            eq(workspaceInvitesTable.id, inviteRow.id),
            eq(workspaceInvitesTable.status, "pending")
          )
        )
        .returning()
        .execute();

      if (!claimed) {
        throw new Error("This invitation has already been used.");
      }

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
    });

    await activityService.logActivity({
      workspaceId: inviteRow.workspaceId,
      userId,
      action: "joined",
      entityType: "member",
      entityId: userId,
      entityName: acceptingUser.name ?? "Unknown",
    });

    return {
      success: true,
      message: "Successfully joined workspace.",
      workspaceId: inviteRow.workspaceId,
      organizationId: workspace.organizationId,
    };
  }

  /**
   * AUD-012 / AUD-013: this was fully implemented but had no route or UI calling it —
   * there was no way, anywhere in the product, to remove a member or leave a workspace.
   * Also serves self-service "leave workspace" when targetUserId === callerUserId, which
   * only requires being a member (not an admin) of the workspace.
   */
  async removeMember(callerUserId: string, workspaceId: string, targetUserId: string) {
    const caller = await workspaceRepository.getMember(callerUserId, workspaceId);
    if (!caller) {
      throw new Error("Forbidden: you are not a member of this workspace.");
    }

    const isSelfRemoval = targetUserId === callerUserId;
    if (!isSelfRemoval && !hasRole(caller.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: Only workspace admins can remove members.");
    }

    const members = await workspaceRepository.getWorkspaceMembers(workspaceId);
    const admins = members.filter((m) => m.membership.role === "admin");
    if (targetUserId === callerUserId && caller.role === "admin" && admins.length <= 1) {
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

  /** AUD-012: promoting/demoting a member's role, previously not possible anywhere. */
  async updateMemberRole(
    callerUserId: string,
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole
  ) {
    const caller = await workspaceRepository.getMember(callerUserId, workspaceId);
    if (!caller || !hasRole(caller.role as WorkspaceRole, "admin")) {
      throw new Error("Forbidden: Only workspace admins can change member roles.");
    }

    const target = await workspaceRepository.getMember(targetUserId, workspaceId);
    if (!target) {
      throw new Error("Member not found in this workspace.");
    }

    if (target.role === "admin" && newRole !== "admin") {
      const members = await workspaceRepository.getWorkspaceMembers(workspaceId);
      const admins = members.filter((m) => m.membership.role === "admin");
      if (admins.length <= 1) {
        throw new Error("You cannot demote the only remaining admin.");
      }
    }

    const updated = await workspaceRepository.updateMemberRole(workspaceId, targetUserId, newRole);
    if (!updated) {
      throw new Error("Member not found in this workspace.");
    }
    return { success: true, role: updated.role };
  }

  async rejectInvite(userId: string, token: string) {
    const inviteRow = await workspaceRepository.findInviteByToken(token);
    if (!inviteRow) {
      throw new Error("Invalid or expired invitation.");
    }

    // AUD-041: require the caller to be the invited person, same as acceptInvite — token
    // possession alone previously let any authenticated user decline someone else's invite.
    const respondingUser = await authRepository.findUserById(userId);
    if (!respondingUser || respondingUser.email.toLowerCase() !== inviteRow.email.toLowerCase()) {
      throw new Error("EMAIL_MISMATCH: This invitation was sent to a different email address.");
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

  /**
   * AUD-011: the "Revoke" control in the UI previously never called any API — it just
   * removed the row from local state while the token remained `pending` and fully
   * redeemable server-side. This makes revocation real: it permanently transitions the
   * invite to a terminal `revoked` status so the token can never be accepted again.
   */
  async revokeInvite(userId: string, workspaceId: string, inviteId: string) {
    const member = await workspaceRepository.getMember(userId, workspaceId);
    if (!member || !hasRole(member.role as WorkspaceRole, "project_manager")) {
      throw new Error("Forbidden: Only admins and project managers can revoke invites.");
    }

    const invite = await workspaceRepository.findInviteById(inviteId);
    if (!invite || invite.workspaceId !== workspaceId) {
      throw new Error("Invitation not found.");
    }
    if (invite.status !== "pending") {
      throw new Error(`This invitation is already ${invite.status} and cannot be revoked.`);
    }

    const revoked = await workspaceRepository.revokePendingInvite(inviteId);
    if (!revoked) {
      throw new Error("This invitation is no longer pending and cannot be revoked.");
    }

    return { success: true, message: "Invitation revoked." };
  }

  private async assertMember(userId: string, workspaceId: string) {
    const member = await workspaceRepository.getMember(userId, workspaceId);
    if (!member) {
      throw new Error("Forbidden: you are not a member of this workspace.");
    }
  }

  /** AUD-047: reads/writes now actually hit the database instead of echoing a stub. */
  async getWorkspacePreferences(userId: string, workspaceId: string) {
    await this.assertMember(userId, workspaceId);
    const row = await workspaceRepository.getWorkspacePreferences(workspaceId);
    return {
      workspaceId,
      defaultView: row?.defaultView ?? "board",
      statuses: (row?.statuses as string[] | undefined) ?? ["To Do", "In Progress", "Done"],
      tags: (row?.tags as string[] | undefined) ?? [],
    };
  }

  async updateWorkspacePreferences(
    userId: string,
    workspaceId: string,
    data: { defaultView?: "board" | "list" | "timeline"; statuses?: string[]; tags?: string[] }
  ) {
    await this.assertMember(userId, workspaceId);
    const row = await workspaceRepository.upsertWorkspacePreferences(workspaceId, data);
    return {
      workspaceId,
      defaultView: row.defaultView ?? "board",
      statuses: (row.statuses as string[] | undefined) ?? ["To Do", "In Progress", "Done"],
      tags: (row.tags as string[] | undefined) ?? [],
    };
  }

  async getWorkspaceNotificationSettings(userId: string, workspaceId: string) {
    await this.assertMember(userId, workspaceId);
    const row = await workspaceRepository.getWorkspaceNotificationSettings(workspaceId);
    return {
      workspaceId,
      taskAssigned: row?.taskAssigned ?? true,
      taskCompleted: row?.taskCompleted ?? true,
      memberJoined: row?.memberJoined ?? true,
      comments: row?.comments ?? true,
      dueDateReminders: row?.dueDateReminders ?? true,
    };
  }

  async updateWorkspaceNotificationSettings(
    userId: string,
    workspaceId: string,
    data: Partial<{
      taskAssigned: boolean;
      taskCompleted: boolean;
      memberJoined: boolean;
      comments: boolean;
      dueDateReminders: boolean;
    }>
  ) {
    await this.assertMember(userId, workspaceId);
    const row = await workspaceRepository.upsertWorkspaceNotificationSettings(workspaceId, data);
    return {
      workspaceId,
      taskAssigned: row.taskAssigned ?? true,
      taskCompleted: row.taskCompleted ?? true,
      memberJoined: row.memberJoined ?? true,
      comments: row.comments ?? true,
      dueDateReminders: row.dueDateReminders ?? true,
    };
  }
}

export const workspaceService = new WorkspaceService();
