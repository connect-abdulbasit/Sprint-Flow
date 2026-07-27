import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { taskService, ALLOWED_TICKET_IMAGE_MIME_TYPES } from "@/modules/task/task.service";
import { parsePaginationParams, paginateArray } from "@/lib/pagination";

function parseLabels(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  return value.map((x) => String(x).trim()).filter(Boolean);
}

function ticketErrorStatus(message: string) {
  if (
    message.includes("Forbidden") ||
    message.includes("access denied") ||
    message.includes("Project not found")
  )
    return 403;
  if (message.includes("Ticket not found") || message.includes("Ticket image not found"))
    return 404;
  if (
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("member") ||
    message.includes("cannot be empty") ||
    message.includes("must be one of") ||
    message.includes("circular") ||
    message.includes("Linked ticket not found")
  ) {
    return 400;
  }
  return 500;
}

export class TicketController {
  async list(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId } = await context.params;
      const tickets = await taskService.listTickets(user.id, projectId);
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 50,
        maxPageSize: 200,
      });
      return NextResponse.json(paginateArray(tickets, pagination));
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list tickets";
      console.error("List tickets error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
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
      const title = String(body.title ?? "").trim();
      if (!title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }
      let dependsOnTaskIds: string[] | undefined;
      if (body.dependsOnTaskIds !== undefined) {
        if (!Array.isArray(body.dependsOnTaskIds)) {
          return NextResponse.json(
            { error: "dependsOnTaskIds must be an array of ticket ids" },
            { status: 400 }
          );
        }
        dependsOnTaskIds = body.dependsOnTaskIds
          .map((x: unknown) => String(x).trim())
          .filter(Boolean);
      }
      const ticket = await taskService.createTicket(user.id, projectId, {
        title,
        reporterName: user.name,
        description: body.description,
        type: body.type,
        priority: body.priority,
        status: body.status,
        sprintId: body.sprintId,
        epicId: body.epicId,
        parentTaskId: body.parentTaskId,
        labels: parseLabels(body.labels),
        assigneeId: body.assigneeId,
        dueDate: body.dueDate,
        storyPoints: body.storyPoints,
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        dependsOnTaskIds,
      });
      return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to create ticket";
      console.error("Create ticket error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
    }
  }

  async get(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      const url = new URL(req.url);
      const includeImage = url.searchParams.get("includeImage") === "1";
      const ticket = await taskService.getTicket(user.id, projectId, ticketId, includeImage);
      return NextResponse.json(ticket);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to load ticket";
      console.error("Get ticket error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
    }
  }

  async update(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      const body = await req.json();
      let dependsOnTaskIds: string[] | undefined;
      if (body.dependsOnTaskIds !== undefined) {
        if (!Array.isArray(body.dependsOnTaskIds)) {
          return NextResponse.json(
            { error: "dependsOnTaskIds must be an array of ticket ids" },
            { status: 400 }
          );
        }
        dependsOnTaskIds = body.dependsOnTaskIds
          .map((x: unknown) => String(x).trim())
          .filter(Boolean);
      }
      const ticket = await taskService.updateTicket(user.id, projectId, ticketId, {
        title: body.title,
        description: body.description,
        type: body.type,
        priority: body.priority,
        status: body.status,
        sprintId: body.sprintId,
        epicId: body.epicId,
        parentTaskId: body.parentTaskId,
        orderIndex: body.orderIndex,
        labels: parseLabels(body.labels),
        assigneeId: body.assigneeId,
        reporterId: body.reporterId,
        dueDate: body.dueDate,
        storyPoints: body.storyPoints,
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        dependsOnTaskIds,
        expectedUpdatedAt: body.expectedUpdatedAt,
      });
      return NextResponse.json(ticket);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update ticket";
      console.error("Update ticket error:", error);
      const status = message.startsWith("CONFLICT:") ? 409 : ticketErrorStatus(message);
      return NextResponse.json({ error: message.replace("CONFLICT:", "").trim() }, { status });
    }
  }

  async delete(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      await taskService.deleteTicket(user.id, projectId, ticketId);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to delete ticket";
      console.error("Delete ticket error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
    }
  }

  async activity(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 20,
        maxPageSize: 100,
      });
      const activity = await taskService.getTicketActivity(
        user.id,
        projectId,
        ticketId,
        pagination
      );
      return NextResponse.json(activity);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to load ticket activity";
      console.error("Get ticket activity error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
    }
  }

  async getImage(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      const { buffer, mimeType } = await taskService.getTicketImage(user.id, projectId, ticketId);
      // AUD-002: defense in depth for any row written before the upload-time allowlist
      // existed — never trust a stored MIME type enough to let a browser execute it.
      const safeMimeType = (ALLOWED_TICKET_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
        ? mimeType
        : "application/octet-stream";
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": safeMimeType,
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to load image";
      console.error("Get ticket image error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
    }
  }
}

export const ticketController = new TicketController();
