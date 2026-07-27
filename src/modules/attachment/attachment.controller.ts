import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { attachmentService } from "@/modules/attachment/attachment.service";

function attachmentErrorStatus(message: string) {
  if (
    message.includes("Forbidden") ||
    message.includes("access denied") ||
    message.includes("Project not found")
  )
    return 403;
  if (message.includes("not found")) return 404;
  if (message.includes("required") || message.includes("must") || message.includes("too long")) {
    return 400;
  }
  return 500;
}

export class AttachmentController {
  async listForTask(
    req: NextRequest,
    context: { params: Promise<{ id: string; ticketId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id: projectId, ticketId } = await context.params;
      const attachments = await attachmentService.listForTask(user.id, projectId, ticketId);
      return NextResponse.json({ items: attachments });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list attachments";
      console.error("List task attachments error:", error);
      return NextResponse.json({ error: message }, { status: attachmentErrorStatus(message) });
    }
  }

  async addForTask(
    req: NextRequest,
    context: { params: Promise<{ id: string; ticketId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id: projectId, ticketId } = await context.params;
      const body = await req.json();
      const attachment = await attachmentService.addForTask(user.id, projectId, ticketId, {
        fileUrl: body.fileUrl,
        label: body.label,
      });
      return NextResponse.json(attachment, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to add attachment";
      console.error("Add task attachment error:", error);
      return NextResponse.json({ error: message }, { status: attachmentErrorStatus(message) });
    }
  }

  async listForEpic(
    req: NextRequest,
    context: { params: Promise<{ id: string; epicId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id: projectId, epicId } = await context.params;
      const attachments = await attachmentService.listForEpic(user.id, projectId, epicId);
      return NextResponse.json({ items: attachments });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to list attachments";
      console.error("List epic attachments error:", error);
      return NextResponse.json({ error: message }, { status: attachmentErrorStatus(message) });
    }
  }

  async addForEpic(req: NextRequest, context: { params: Promise<{ id: string; epicId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id: projectId, epicId } = await context.params;
      const body = await req.json();
      const attachment = await attachmentService.addForEpic(user.id, projectId, epicId, {
        fileUrl: body.fileUrl,
        label: body.label,
      });
      return NextResponse.json(attachment, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to add attachment";
      console.error("Add epic attachment error:", error);
      return NextResponse.json({ error: message }, { status: attachmentErrorStatus(message) });
    }
  }

  async delete(
    req: NextRequest,
    context: { params: Promise<{ id: string; attachmentId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id: projectId, attachmentId } = await context.params;
      await attachmentService.delete(user.id, projectId, attachmentId);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to delete attachment";
      console.error("Delete attachment error:", error);
      return NextResponse.json({ error: message }, { status: attachmentErrorStatus(message) });
    }
  }
}

export const attachmentController = new AttachmentController();
