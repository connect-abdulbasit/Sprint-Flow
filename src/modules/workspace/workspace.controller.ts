import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "./workspace.service";
import { getCurrentUser } from "@/lib/auth";

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
}

export const workspaceController = new WorkspaceController();
