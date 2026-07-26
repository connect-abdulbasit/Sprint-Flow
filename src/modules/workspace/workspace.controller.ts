import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "./workspace.service";
import { getCurrentUser, getCurrentUserWithRole } from "@/lib/auth";
import { hasRole, isValidRole, type WorkspaceRole } from "@/lib/auth/rbac";
import { parsePaginationParams, paginateArray } from "@/lib/pagination";

export class WorkspaceController {
  async create(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const name = String(body.name ?? "").trim();
      const organizationId = String(body.organizationId ?? "").trim();
      const slug = String(body.slug ?? name.toLowerCase().replace(/\s+/g, "-")).trim();

      if (!name || !organizationId) {
        return NextResponse.json(
          { error: "Name and organizationId are required" },
          { status: 400 }
        );
      }

      const workspace = await workspaceService.createWorkspace(user.id, {
        name,
        organizationId,
        slug,
        description: body.description,
      });

      return NextResponse.json(workspace);
    } catch (error) {
      console.error("Create workspace error:", error);
      const message = (error as Error)?.message ?? "Failed to create workspace";
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("already taken") || message.includes("must be at most")
          ? 400
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async list(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const workspaces = await workspaceService.getUserWorkspaces(user.id);
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 20,
        maxPageSize: 100,
      });
      return NextResponse.json(paginateArray(workspaces, pagination));
    } catch (error) {
      console.error("Fetch workspaces error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to fetch workspaces" },
        { status: 500 }
      );
    }
  }

  async getById(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const workspace = await workspaceService.getWorkspaceById(user.id, id);

      if (!workspace) {
        return NextResponse.json(
          { error: "Workspace not found or access denied" },
          { status: 404 }
        );
      }

      return NextResponse.json(workspace);
    } catch (error) {
      console.error("Get workspace error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to get workspace" },
        { status: 500 }
      );
    }
  }

  async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const body = (await req.json()) as {
        name?: string;
        description?: string;
        logoUrl?: string | null;
      };
      const updated = await workspaceService.updateWorkspace(user.id, id, {
        name: body.name,
        description: body.description,
        logoUrl: body.logoUrl,
      });
      return NextResponse.json(updated);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update workspace";
      console.error("Update workspace error:", error);
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("not found") || message.includes("must be at most")
          ? 400
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async uploadLogo(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Missing image file" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "application/octet-stream";
      const updated = await workspaceService.uploadWorkspaceLogo(user.id, id, buffer, mimeType);
      return NextResponse.json(updated);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to upload logo";
      console.error("Upload workspace logo error:", error);
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async deleteLogo(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const updated = await workspaceService.clearWorkspaceLogo(user.id, id);
      return NextResponse.json(updated);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to remove logo";
      console.error("Delete workspace logo error:", error);
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("not found")
          ? 404
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      await workspaceService.deleteWorkspace(user.id, id);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to delete workspace";
      console.error("Delete workspace error:", error);
      const status = message.includes("Forbidden") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async listMembers(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id: workspaceId } = await params;
      const members = await workspaceService.getWorkspaceMembers(user.id, workspaceId);
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 50,
        maxPageSize: 200,
      });
      return NextResponse.json(paginateArray(members, pagination));
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list members";
      console.error("List members error:", error);
      const status = message.includes("Forbidden") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async getPreferences(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const preferences = await workspaceService.getWorkspacePreferences(user.id, id);
      return NextResponse.json(preferences);
    } catch (error) {
      console.error("Get preferences error:", error);
      const message = (error as Error)?.message ?? "Failed to get preferences";
      return NextResponse.json(
        { error: message },
        { status: message.includes("Forbidden") ? 403 : 500 }
      );
    }
  }

  async updatePreferences(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const preferences = await workspaceService.updateWorkspacePreferences(user.id, id, {
        defaultView: body.defaultView as "board" | "list" | "timeline" | undefined,
        statuses: body.statuses as string[] | undefined,
        tags: body.tags as string[] | undefined,
      });
      return NextResponse.json(preferences);
    } catch (error) {
      console.error("Update preferences error:", error);
      const message = (error as Error)?.message ?? "Failed to update preferences";
      return NextResponse.json(
        { error: message },
        { status: message.includes("Forbidden") ? 403 : 500 }
      );
    }
  }

  async getNotificationSettings(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const settings = await workspaceService.getWorkspaceNotificationSettings(user.id, id);
      return NextResponse.json(settings);
    } catch (error) {
      console.error("Get notification settings error:", error);
      const message = (error as Error)?.message ?? "Failed to get notification settings";
      return NextResponse.json(
        { error: message },
        { status: message.includes("Forbidden") ? 403 : 500 }
      );
    }
  }

  async updateNotificationSettings(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const body = (await req.json().catch(() => ({}))) as Record<string, boolean | undefined>;
      const settings = await workspaceService.updateWorkspaceNotificationSettings(user.id, id, {
        taskAssigned: body.taskAssigned,
        taskCompleted: body.taskCompleted,
        memberJoined: body.memberJoined,
        comments: body.comments,
        dueDateReminders: body.dueDateReminders,
      });
      return NextResponse.json(settings);
    } catch (error) {
      console.error("Update notification settings error:", error);
      const message = (error as Error)?.message ?? "Failed to update notification settings";
      return NextResponse.json(
        { error: message },
        { status: message.includes("Forbidden") ? 403 : 500 }
      );
    }
  }

  async removeMember(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id: workspaceId, userId: targetUserId } = await params;
      const result = await workspaceService.removeMember(user.id, workspaceId, targetUserId);
      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to remove member";
      const status = message.includes("Forbidden") ? 403 : 400;
      console.error("Remove member error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async updateMemberRole(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id: workspaceId, userId: targetUserId } = await params;
      const body = await req.json();
      const rawRole = String(body.role ?? "")
        .trim()
        .toLowerCase();
      if (!isValidRole(rawRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      const result = await workspaceService.updateMemberRole(
        user.id,
        workspaceId,
        targetUserId,
        rawRole
      );
      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update member role";
      const status = message.includes("Forbidden") ? 403 : 400;
      console.error("Update member role error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async sendInvite(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: workspaceId } = await params;

    const userWithRole = await getCurrentUserWithRole(req, workspaceId);
    if (!userWithRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRole(userWithRole.workspaceRole, "project_manager")) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to invite users." },
        { status: 403 }
      );
    }

    try {
      const body = await req.json();
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      const rawRole = String(body.role ?? "member")
        .trim()
        .toLowerCase();
      const role: WorkspaceRole = isValidRole(rawRole) ? rawRole : "member";

      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const result = await workspaceService.sendInvite(userWithRole.id, {
        workspaceId,
        email,
        role,
      });

      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to send invite";
      const status = message.includes("Forbidden") ? 403 : 400;
      console.error("Send invite error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async listInvites(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id: workspaceId } = await params;
      const invites = await workspaceService.getWorkspaceInvites(user.id, workspaceId);
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 20,
        maxPageSize: 100,
      });
      return NextResponse.json(paginateArray(invites, pagination));
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list invites";
      const status = message.includes("Forbidden") ? 403 : 400;
      console.error("List invites error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async revokeInvite(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; inviteId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id: workspaceId, inviteId } = await params;
      const result = await workspaceService.revokeInvite(user.id, workspaceId, inviteId);
      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to revoke invite";
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;
      console.error("Revoke invite error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async getInviteByToken(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { token } = await params;
      const invite = await workspaceService.getInviteByToken(token);

      if (!invite) {
        return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
      }

      return NextResponse.json(invite);
    } catch (error) {
      console.error("Get invite error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to get invite" },
        { status: 500 }
      );
    }
  }

  async acceptInvite(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { token } = await params;
      const result = await workspaceService.acceptInvite(user.id, token);
      return NextResponse.json(result);
    } catch (error) {
      const rawMessage = (error as Error)?.message ?? "Failed to accept invite";
      console.error("Accept invite error:", error);

      // AUD-003: surface a distinct errorType the frontend uses to show a targeted message
      // rather than a generic failure, without leaking whether an account with that email
      // exists (handled entirely server-side above).
      if (rawMessage.startsWith("EMAIL_MISMATCH:")) {
        return NextResponse.json(
          { error: rawMessage.replace("EMAIL_MISMATCH:", "").trim(), errorType: "email_mismatch" },
          { status: 403 }
        );
      }
      if (rawMessage.includes("already been used")) {
        return NextResponse.json({ error: rawMessage, errorType: "already_used" }, { status: 409 });
      }
      const status = rawMessage.includes("expired") || rawMessage.includes("Invalid") ? 400 : 500;
      return NextResponse.json({ error: rawMessage }, { status });
    }
  }

  async rejectInvite(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    // AUD-041: this previously had no authentication check at all, so anyone who had (or
    // guessed) a valid token could decline an invitation on someone else's behalf.
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { token } = await params;
      const result = await workspaceService.rejectInvite(user.id, token);
      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to reject invite";
      console.error("Reject invite error:", error);
      const status = message.startsWith("EMAIL_MISMATCH:") ? 403 : 400;
      return NextResponse.json(
        { error: message.replace("EMAIL_MISMATCH:", "").trim() },
        { status }
      );
    }
  }
}

export const workspaceController = new WorkspaceController();
