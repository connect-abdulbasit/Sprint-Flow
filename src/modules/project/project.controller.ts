import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { projectService } from "./project.service";

export class ProjectController {
  async list(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const url = new URL(req.url);
      const workspaceId = url.searchParams.get("workspaceId");
      if (!workspaceId) {
        return NextResponse.json({ error: "workspaceId query param is required" }, { status: 400 });
      }

      const projects = await projectService.getWorkspaceProjects(user.id, workspaceId);
      return NextResponse.json(projects);
    } catch (error) {
      console.error("List projects error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to list projects" },
        { status: 500 }
      );
    }
  }

  async create(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const name = String(body.name ?? "").trim();
      const workspaceId = String(body.workspaceId ?? "").trim();

      if (!name || !workspaceId) {
        return NextResponse.json({ error: "name and workspaceId are required" }, { status: 400 });
      }

      const project = await projectService.createProject(user.id, {
        name,
        description: body.description,
        workspaceId,
      });
      return NextResponse.json(project, { status: 201 });
    } catch (error) {
      console.error("Create project error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to create project" },
        { status: 500 }
      );
    }
  }

  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const project = await projectService.getProjectForMember(user.id, id);
      if (!project) {
        return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
      }
      return NextResponse.json(project);
    } catch (error) {
      console.error("Get project error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to load project" },
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

      const updated = await projectService.updateProject(user.id, id, {
        name: body.name,
        description: body.description,
      });
      return NextResponse.json(updated);
    } catch (error) {
      console.error("Update project error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to update project" },
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
      await projectService.deleteProject(user.id, id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error("Delete project error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to delete project" },
        { status: 500 }
      );
    }
  }
}

export const projectController = new ProjectController();
