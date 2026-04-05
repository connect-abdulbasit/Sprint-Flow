import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { projectService } from "./project.service";

export class ProjectController {
  async list(req: NextRequest) {
    try {
      const user = await getCurrentUser(req);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const url = new URL(req.url);
      const workspaceId = url.searchParams.get("workspaceId");

      if (!workspaceId) {
        return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
      }

      const projects = await projectService.getWorkspaceProjects(user.id, workspaceId);
      return NextResponse.json(projects);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to list projects" },
        { status: 500 }
      );
    }
  }

  async create(req: NextRequest) {
    try {
      const user = await getCurrentUser(req);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      if (!body.name || !body.workspaceId) {
        return NextResponse.json({ error: "name and workspaceId are required" }, { status: 400 });
      }

      const newProject = await projectService.createProject(user.id, {
        name: body.name,
        description: body.description,
        workspaceId: body.workspaceId,
      });

      return NextResponse.json(newProject, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to create project" },
        { status: 500 }
      );
    }
  }

  async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await getCurrentUser(req);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await params;
      const body = await req.json();

      const updatedProject = await projectService.updateProject(user.id, id, body);
      return NextResponse.json(updatedProject);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to update project" },
        { status: 500 }
      );
    }
  }

  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await getCurrentUser(req);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await params;
      await projectService.deleteProject(user.id, id);

      return new NextResponse(null, { status: 204 });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to delete project" },
        { status: 500 }
      );
    }
  }
}

export const projectController = new ProjectController();
