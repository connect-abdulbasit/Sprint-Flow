import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { taskRepository } from "@/modules/task/task.repository";
import { ticketKey } from "@/lib/ticket-key";

export const runtime = "nodejs";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: workspaceId } = await context.params;

    const rows = await taskRepository.findByAssigneeInWorkspace(user.id, workspaceId);

    const tasks = rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      ticketNumber: row.ticketNumber,
      key: ticketKey(row.projectName, row.ticketNumber),
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      status: row.status,
      sprintId: row.sprintId,
      assigneeId: row.assigneeId,
      assigneeName: row.assigneeName,
      reporterId: row.reporterId,
      reporterName: row.reporterName,
      dueDate: row.dueDate,
      storyPoints: row.storyPoints,
      hasImage: Boolean(row.imageMimeType),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("My tasks fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
