import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sprintService } from "@/modules/sprint/sprint.service";

function sprintErrorStatus(message: string) {
  if (
    message.includes("Forbidden") ||
    message.includes("access denied") ||
    message.includes("Project not found")
  )
    return 403;
  if (message.includes("not found")) return 404;
  if (
    message.includes("Cannot") ||
    message.includes("already") ||
    message.includes("must be") ||
    message.includes("required") ||
    message.includes("Invalid") ||
    message.includes("before")
  ) {
    return 400;
  }
  return 500;
}

export class SprintController {
  async list(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId } = await context.params;
      const sprints = await sprintService.listSprints(user.id, projectId);
      return NextResponse.json(sprints);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list sprints";
      console.error("List sprints error:", error);
      return NextResponse.json({ error: message }, { status: sprintErrorStatus(message) });
    }
  }

  async create(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId } = await context.params;
      const body = await req.json();
      const name = String(body.name ?? "").trim();
      const startDate = String(body.startDate ?? "").trim();
      const endDate = String(body.endDate ?? "").trim();
      const goal =
        body.goal !== undefined && body.goal !== null ? String(body.goal).trim() || null : null;
      if (!name || !startDate || !endDate) {
        return NextResponse.json(
          { error: "name, startDate, and endDate are required" },
          { status: 400 }
        );
      }
      const sprint = await sprintService.createSprint(user.id, projectId, {
        name,
        goal,
        startDate,
        endDate,
      });
      return NextResponse.json(sprint, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to create sprint";
      console.error("Create sprint error:", error);
      return NextResponse.json({ error: message }, { status: sprintErrorStatus(message) });
    }
  }

  async update(req: NextRequest, context: { params: Promise<{ id: string; sprintId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, sprintId } = await context.params;
      const body = await req.json();
      const sprint = await sprintService.updateSprint(user.id, projectId, sprintId, {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        goal:
          body.goal !== undefined
            ? body.goal === null
              ? null
              : String(body.goal).trim()
            : undefined,
        startDate: body.startDate !== undefined ? String(body.startDate).trim() : undefined,
        endDate: body.endDate !== undefined ? String(body.endDate).trim() : undefined,
      });
      return NextResponse.json(sprint);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update sprint";
      console.error("Update sprint error:", error);
      return NextResponse.json({ error: message }, { status: sprintErrorStatus(message) });
    }
  }

  async delete(req: NextRequest, context: { params: Promise<{ id: string; sprintId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, sprintId } = await context.params;
      await sprintService.deleteSprint(user.id, projectId, sprintId);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to delete sprint";
      console.error("Delete sprint error:", error);
      return NextResponse.json({ error: message }, { status: sprintErrorStatus(message) });
    }
  }

  async start(req: NextRequest, context: { params: Promise<{ id: string; sprintId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, sprintId } = await context.params;
      const sprint = await sprintService.startSprint(user.id, projectId, sprintId);
      return NextResponse.json(sprint);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to start sprint";
      console.error("Start sprint error:", error);
      return NextResponse.json({ error: message }, { status: sprintErrorStatus(message) });
    }
  }

  async complete(req: NextRequest, context: { params: Promise<{ id: string; sprintId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, sprintId } = await context.params;
      const sprint = await sprintService.completeSprint(user.id, projectId, sprintId);
      return NextResponse.json(sprint);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to complete sprint";
      console.error("Complete sprint error:", error);
      return NextResponse.json({ error: message }, { status: sprintErrorStatus(message) });
    }
  }
}

export const sprintController = new SprintController();
