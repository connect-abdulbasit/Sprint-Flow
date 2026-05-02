import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "./workspace.service";
import { getCurrentUser, getCurrentUserWithRole } from "@/lib/auth";
import { hasRole, isValidRole, type WorkspaceRole } from "@/lib/auth/rbac";

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
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to create workspace" },
        { status: 500 }
      );
    }
  }

  async list(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const workspaces = await workspaceService.getUserWorkspaces(user.id);
      return NextResponse.json(workspaces);
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
      const body = await req.json();
      const updated = await workspaceService.updateWorkspace(user.id, id, {
        name: body.name,
        description: body.description,
      });
      return NextResponse.json(updated);
    } catch (error) {
      console.error("Update workspace error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to update workspace" },
        { status: 500 }
      );
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
      console.error("Delete workspace error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to delete workspace" },
        { status: 500 }
      );
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
      return NextResponse.json(members);
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
      const workspace = await workspaceService.getWorkspaceById(user.id, id);
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      return NextResponse.json({
        workspaceId: id,
        defaultView: "board" as const,
        statuses: ["To Do", "In Progress", "Done"],
        labels: [] as string[],
        tags: [] as string[],
      });
    } catch (error) {
      console.error("Get preferences error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to get preferences" },
        { status: 500 }
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
      const workspace = await workspaceService.getWorkspaceById(user.id, id);
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      return NextResponse.json({
        workspaceId: id,
        defaultView: (body.defaultView as string) ?? "board",
        statuses: (body.statuses as string[]) ?? ["To Do", "In Progress", "Done"],
        labels: (body.labels as string[]) ?? [],
        tags: (body.tags as string[]) ?? [],
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to update preferences" },
        { status: 500 }
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
      const workspace = await workspaceService.getWorkspaceById(user.id, id);
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      return NextResponse.json({
        workspaceId: id,
        taskAssigned: true,
        taskCompleted: true,
        memberJoined: true,
        comments: true,
        dueDateReminders: true,
      });
    } catch (error) {
      console.error("Get notification settings error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to get notification settings" },
        { status: 500 }
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
      const workspace = await workspaceService.getWorkspaceById(user.id, id);
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      const body = (await req.json().catch(() => ({}))) as Record<string, boolean | undefined>;
      return NextResponse.json({
        workspaceId: id,
        taskAssigned: body.taskAssigned ?? true,
        taskCompleted: body.taskCompleted ?? true,
        memberJoined: body.memberJoined ?? true,
        comments: body.comments ?? true,
        dueDateReminders: body.dueDateReminders ?? true,
      });
    } catch (error) {
      console.error("Update notification settings error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to update notification settings" },
        { status: 500 }
      );
    }
  }

  async sendInvite(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: workspaceId } = await params;

    // RBAC: Resolve user + workspace role in one shot
    const userWithRole = await getCurrentUserWithRole(req, workspaceId);
    if (!userWithRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce: only admin and project_manager can send invites
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
      return NextResponse.json(invites);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list invites";
      const status = message.includes("Forbidden") ? 403 : 400;
      console.error("List invites error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async getInviteByToken(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
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
      const message = (error as Error)?.message ?? "Failed to accept invite";
      const status = message.includes("expired") || message.includes("Invalid") ? 400 : 500;
      console.error("Accept invite error:", error);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async rejectInvite(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
      const { token } = await params;
      const result = await workspaceService.rejectInvite(token);
      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to reject invite";
      console.error("Reject invite error:", error);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}

export const workspaceController = new WorkspaceController();
