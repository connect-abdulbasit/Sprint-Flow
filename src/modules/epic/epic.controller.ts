import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { epicService } from "@/modules/epic/epic.service";
import { parsePaginationParams, paginateArray } from "@/lib/pagination";

function epicErrorStatus(message: string) {
  if (
    message.includes("Forbidden") ||
    message.includes("access denied") ||
    message.includes("Project not found")
  )
    return 403;
  if (message.includes("not found")) return 404;
  if (
    message.includes("cannot be empty") ||
    message.includes("must be") ||
    message.includes("Invalid") ||
    message.includes("required")
  ) {
    return 400;
  }
  return 500;
}

export class EpicController {
  async list(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId } = await context.params;
      const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "1";
      const epics = await epicService.listEpics(user.id, projectId, { includeArchived });
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 50,
        maxPageSize: 200,
      });
      return NextResponse.json(paginateArray(epics, pagination));
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list epics";
      console.error("List epics error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
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
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      const epic = await epicService.createEpic(user.id, projectId, {
        name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        ownerId: body.ownerId,
        color: body.color,
        icon: body.icon,
        labels: Array.isArray(body.labels) ? body.labels : undefined,
        startDate: body.startDate,
        dueDate: body.dueDate,
      });
      return NextResponse.json(epic, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to create epic";
      console.error("Create epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async get(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const epic = await epicService.getEpic(user.id, projectId, epicId);
      return NextResponse.json(epic);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to load epic";
      console.error("Get epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async update(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const body = await req.json();
      const epic = await epicService.updateEpic(user.id, projectId, epicId, {
        name: body.name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        ownerId: body.ownerId,
        color: body.color,
        icon: body.icon,
        labels: Array.isArray(body.labels) ? body.labels : undefined,
        startDate: body.startDate,
        dueDate: body.dueDate,
      });
      return NextResponse.json(epic);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update epic";
      console.error("Update epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async delete(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      await epicService.deleteEpic(user.id, projectId, epicId);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to delete epic";
      console.error("Delete epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async archive(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const epic = await epicService.archiveEpic(user.id, projectId, epicId);
      return NextResponse.json(epic);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to archive epic";
      console.error("Archive epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async unarchive(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const epic = await epicService.unarchiveEpic(user.id, projectId, epicId);
      return NextResponse.json(epic);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to unarchive epic";
      console.error("Unarchive epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async duplicate(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const epic = await epicService.duplicateEpic(user.id, projectId, epicId);
      return NextResponse.json(epic, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to duplicate epic";
      console.error("Duplicate epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async move(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const body = await req.json();
      const targetIndex = Number(body.targetIndex);
      if (!Number.isFinite(targetIndex) || targetIndex < 0) {
        return NextResponse.json(
          { error: "targetIndex must be a non-negative number" },
          { status: 400 }
        );
      }
      const epics = await epicService.moveEpic(user.id, projectId, epicId, targetIndex);
      return NextResponse.json(epics);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to move epic";
      console.error("Move epic error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }

  async activity(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, epicId } = await context.params;
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 20,
        maxPageSize: 100,
      });
      const activity = await epicService.getEpicActivity(user.id, projectId, epicId, pagination);
      return NextResponse.json(activity);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to load epic activity";
      console.error("Get epic activity error:", error);
      return NextResponse.json({ error: message }, { status: epicErrorStatus(message) });
    }
  }
}

export const epicController = new EpicController();
