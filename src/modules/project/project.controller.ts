import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { normalizeBoardColumns } from "@/lib/board-columns";
import { projectService } from "./project.service";

function serializeProject(project: {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  status: string;
  boardColumns: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
}) {
  return {
    ...project,
    boardColumns: normalizeBoardColumns(project.boardColumns),
    createdAt:
      typeof project.createdAt === "string" ? project.createdAt : project.createdAt.toISOString(),
    updatedAt:
      typeof project.updatedAt === "string" ? project.updatedAt : project.updatedAt.toISOString(),
  };
}

function projectUpdateErrorStatus(message: string) {
  if (message.includes("access denied") || message.includes("not found")) return 403;
  if (
    message.includes("Board") ||
    message.includes("column") ||
    message.includes("cannot be empty") ||
    message.includes("name cannot")
  ) {
    return 400;
  }
  return 500;
}

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
      return NextResponse.json(
        projects.map((p) => serializeProject(p as Parameters<typeof serializeProject>[0]))
      );
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
      return NextResponse.json(
        serializeProject(project as Parameters<typeof serializeProject>[0]),
        {
          status: 201,
        }
      );
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
      return NextResponse.json(serializeProject(project));
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
        boardColumns: body.boardColumns,
      });
      if (!updated) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json(serializeProject(updated));
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update project";
      console.error("Update project error:", error);
      return NextResponse.json({ error: message }, { status: projectUpdateErrorStatus(message) });
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
