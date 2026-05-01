import { projectRepository } from "@/modules/project/project.repository";
import { taskRepository } from "@/modules/task/task.repository";
import { timeEntryRepository } from "@/modules/time_entry/time_entry.repository";
import type { SerializedTimeEntry } from "@/modules/time_entry/time_entry.types";

const MIN_HOURS = 0.01; // ~36 seconds; smallest sensible increment in UI
const MAX_HOURS = 999;

function parseHours(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(n)) throw new Error("hours must be a valid number");
  if (n < MIN_HOURS) throw new Error(`hours must be at least ${MIN_HOURS}`);
  if (n > MAX_HOURS) throw new Error(`hours cannot exceed ${MAX_HOURS} per entry`);
  return Math.round(n * 100) / 100;
}

function serializeRows(
  rows: Awaited<ReturnType<typeof timeEntryRepository.findByTaskWithUsers>>,
  viewerUserId: string
): SerializedTimeEntry[] {
  return rows.map((r) => ({
    id: r.id,
    hours: Number(r.hours),
    description: r.description,
    userId: r.userId,
    userName: r.userName,
    createdAt: r.createdAt.toISOString(),
    canDelete: r.userId === viewerUserId,
  }));
}

export class TimeEntryService {
  async listForTicket(
    userId: string,
    projectId: string,
    ticketId: string
  ): Promise<SerializedTimeEntry[]> {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) throw new Error("Project not found or access denied");
    const task = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!task) throw new Error("Ticket not found");
    const rows = await timeEntryRepository.findByTaskWithUsers(ticketId);
    return serializeRows(rows, userId);
  }

  async createEntry(
    userId: string,
    projectId: string,
    ticketId: string,
    body: { hours: unknown; description?: unknown }
  ): Promise<{ entry: SerializedTimeEntry; totalLoggedHours: number }> {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) throw new Error("Project not found or access denied");
    const task = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!task) throw new Error("Ticket not found");

    const hours = parseHours(body.hours);
    const description =
      body.description === undefined || body.description === null
        ? null
        : String(body.description).trim() || null;

    const created = await timeEntryRepository.create({
      taskId: ticketId,
      userId,
      hours: String(hours),
      description,
    });
    if (!created) throw new Error("Failed to log time");

    const rows = await timeEntryRepository.findByTaskWithUsers(ticketId);
    const serialized = serializeRows(rows, userId);
    const entry = serialized.find((e) => e.id === created.id);
    if (!entry) throw new Error("Failed to load time entry");
    const totalLoggedHours = serialized.reduce((s, e) => s + e.hours, 0);
    return { entry, totalLoggedHours };
  }

  async deleteEntry(userId: string, projectId: string, ticketId: string, entryId: string) {
    const project = await projectRepository.getProjectIfMember(userId, projectId);
    if (!project) throw new Error("Project not found or access denied");
    const task = await taskRepository.findByIdAndProject(ticketId, projectId);
    if (!task) throw new Error("Ticket not found");

    const existing = await timeEntryRepository.findByIdAndTask(entryId, ticketId);
    if (!existing) throw new Error("Time entry not found");
    if (existing.userId !== userId) {
      throw new Error("You can only delete your own time entries");
    }

    await timeEntryRepository.delete(entryId);
    const rows = await timeEntryRepository.findByTaskWithUsers(ticketId);
    const serialized = serializeRows(rows, userId);
    const totalLoggedHours = serialized.reduce((s, e) => s + e.hours, 0);
    return { totalLoggedHours };
  }
}

export const timeEntryService = new TimeEntryService();
