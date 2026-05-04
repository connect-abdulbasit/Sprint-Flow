import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { workspaceService } from "@/modules/workspace/workspace.service";
import { dashboardRepository } from "@/modules/workspace/dashboard.repository";
import { ticketKey } from "@/lib/ticket-key";

export const runtime = "nodejs";

function daysLeft(endDate: string): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type SprintTask = {
  id: string;
  sprintId: string | null;
  status: string;
  storyPoints: number | null;
  assigneeId: string | null;
  assigneeName: string | null;
  updatedAt: Date;
};

function computeBurndown(
  tasks: SprintTask[],
  startDate: string,
  endDate: string
): { actual: number[]; ideal: number[]; totalDays: number; currentDay: number } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();

  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const elapsedMs = Math.min(now.getTime() - start.getTime(), totalMs);
  const currentDay = Math.max(0, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done");

  // Ideal burndown: straight line from totalTasks to 0 over totalDays
  const ideal = Array.from({ length: totalDays }, (_, i) =>
    Math.round(totalTasks - (totalTasks / Math.max(totalDays - 1, 1)) * i)
  );

  // Actual burndown: for each elapsed day, count tasks remaining (not yet done at end of that day)
  const actual: number[] = [];
  for (let day = 0; day <= currentDay; day++) {
    const dayEnd = new Date(start);
    dayEnd.setDate(dayEnd.getDate() + day);
    dayEnd.setHours(23, 59, 59, 999);

    const completedByDay = doneTasks.filter(
      (t) => new Date(t.updatedAt).getTime() <= dayEnd.getTime()
    ).length;

    actual.push(totalTasks - completedByDay);
  }

  return { actual, ideal, totalDays, currentDay };
}

function computeStats(tasks: SprintTask[]) {
  let completed = 0;
  let inProgress = 0;
  let todo = 0;
  let blocked = 0;
  let storyPointsCompleted = 0;

  for (const task of tasks) {
    const s = task.status.toLowerCase();
    if (s === "done") {
      completed++;
      storyPointsCompleted += task.storyPoints ?? 0;
    } else if (s === "in_progress" || s === "in-progress" || s === "review") {
      inProgress++;
    } else if (s === "blocked") {
      blocked++;
    } else {
      todo++;
    }
  }

  return { completed, inProgress, todo, blocked, storyPointsCompleted, totalTasks: tasks.length };
}

function computeTeamWorkload(tasks: SprintTask[]) {
  const map = new Map<string, { name: string; total: number; completed: number }>();

  for (const task of tasks) {
    if (!task.assigneeId || !task.assigneeName) continue;
    const entry = map.get(task.assigneeId) ?? { name: task.assigneeName, total: 0, completed: 0 };
    entry.total++;
    if (task.status === "done") entry.completed++;
    map.set(task.assigneeId, entry);
  }

  return Array.from(map.entries()).map(([id, v]) => ({
    assigneeId: id,
    assigneeName: v.name,
    totalTasks: v.total,
    completedTasks: v.completed,
  }));
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: workspaceId } = await context.params;

    const workspace = await workspaceService.getWorkspaceById(user.id, workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const projects = await dashboardRepository.getWorkspaceProjects(workspaceId);
    const projectIds = projects.map((p) => p.id);
    const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

    const activeSprints = projectIds.length
      ? await dashboardRepository.getActiveSprintsForProjects(projectIds)
      : [];
    const primarySprint = activeSprints[0] ?? null;

    let sprintTasks: SprintTask[] = [];
    let sprintInfo = null;
    let sprintInfos: Array<{
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      daysLeft: number;
      projectName: string;
    }> = [];

    if (activeSprints.length > 0) {
      sprintTasks = await dashboardRepository.getSprintTasksForSprints(
        activeSprints.map((s) => s.id)
      );
      sprintInfos = activeSprints.map((s) => ({
        id: s.id,
        name: s.name,
        startDate: formatDate(s.startDate),
        endDate: formatDate(s.endDate),
        daysLeft: daysLeft(s.endDate),
        projectName: s.projectName,
      }));
      sprintInfo = sprintInfos[0] ?? null;
    }

    const rawRecent = await dashboardRepository.getRecentWorkspaceTasks(projectIds, 5);
    const recentTasks = rawRecent.map((t) => ({
      id: t.id,
      key: ticketKey(projectNameById.get(t.projectId) ?? "TKT", t.ticketNumber),
      title: t.title,
      status: t.status,
      priority: t.priority,
      assigneeName: t.assigneeName ?? null,
      updatedAt: t.updatedAt.toISOString(),
    }));

    const stats = computeStats(sprintTasks);
    const teamWorkload = computeTeamWorkload(sprintTasks);
    const burndown = primarySprint
      ? computeBurndown(
          sprintTasks.filter((task) => task.sprintId === primarySprint.id),
          primarySprint.startDate,
          primarySprint.endDate
        )
      : { actual: [], ideal: [], totalDays: 0, currentDay: 0 };

    const memberCount = await dashboardRepository.getWorkspaceMemberCount(workspaceId);

    return NextResponse.json({
      activeSprint: sprintInfo,
      activeSprints: sprintInfos,
      stats,
      recentTasks,
      teamWorkload,
      burndown,
      memberCount: memberCount.length,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
