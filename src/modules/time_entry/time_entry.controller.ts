import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { timeEntryService } from "@/modules/time_entry/time_entry.service";

function errorStatus(message: string) {
  if (message.includes("access denied") || message.includes("Project not found")) return 403;
  if (message.includes("Ticket not found") || message.includes("Time entry not found")) return 404;
  if (message.includes("only delete")) return 403;
  if (
    message.includes("hours") ||
    message.includes("must be") ||
    message.includes("cannot exceed")
  ) {
    return 400;
  }
  return 500;
}

export class TimeEntryController {
  async create(req: NextRequest, context: { params: Promise<{ id: string; ticketId: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId } = await context.params;
      const body = await req.json();
      const result = await timeEntryService.createEntry(user.id, projectId, ticketId, {
        hours: body.hours,
        description: body.description,
      });
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to log time";
      console.error("Create time entry error:", error);
      return NextResponse.json({ error: message }, { status: errorStatus(message) });
    }
  }

  async delete(
    req: NextRequest,
    context: { params: Promise<{ id: string; ticketId: string; entryId: string }> }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id: projectId, ticketId, entryId } = await context.params;
      const result = await timeEntryService.deleteEntry(user.id, projectId, ticketId, entryId);
      return NextResponse.json(result);
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to delete time entry";
      console.error("Delete time entry error:", error);
      return NextResponse.json({ error: message }, { status: errorStatus(message) });
    }
  }
}

export const timeEntryController = new TimeEntryController();
