import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { taskService } from "@/modules/task/task.service";

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
      return NextResponse.json(tickets);
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
        assigneeId: body.assigneeId,
        reporterId: body.reporterId,
        dueDate: body.dueDate,
        storyPoints: body.storyPoints,
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        dependsOnTaskIds,
      });
      return NextResponse.json(ticket);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to update ticket";
      console.error("Update ticket error:", error);
      return NextResponse.json({ error: message }, { status: ticketErrorStatus(message) });
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

  async getImage(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      const { buffer, mimeType } = await taskService.getTicketImage(user.id, projectId, ticketId);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mimeType,
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
