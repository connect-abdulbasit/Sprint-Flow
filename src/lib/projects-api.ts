/**
 * projects-api.ts — Typed API client for the /api/projects endpoints.
 * All network logic lives here so components stay clean.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BoardColumnConfig {
  id: string;
  title: string;
  dotColor?: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: string;
  createdBy: string;
  /** Kanban columns; present on single-project GET (defaults applied server-side). */
  boardColumns?: BoardColumnConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  workspaceId: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  boardColumns?: BoardColumnConfig[];
}

// ─── Error helper ────────────────────────────────────────────────────────────

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? "Something went wrong", res.status);
  }
  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── API functions ───────────────────────────────────────────────────────────

export async function fetchProjects(workspaceId: string): Promise<Project[]> {
  const res = await fetch(`/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`);
  return handleResponse<Project[]>(res);
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Project>(res);
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Project>(res);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await handleResponse<void>(res);
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
  return handleResponse<Project>(res);
}

export type TicketType = "task" | "bug" | "feature" | "improvement";

/** Linked ticket shown on detail (blocked-by / blocks). */
export interface TicketDependencyLink {
  id: string;
  key: string;
  title: string;
  status: string;
}

export interface ProjectTicket {
  id: string;
  projectId: string;
  ticketNumber: number;
  key: string;
  title: string;
  description: string | null;
  type: TicketType;
  priority: string;
  status: string;
  sprintId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  reporterId: string;
  reporterName: string;
  dueDate: string | null;
  storyPoints: number | null;
  hasImage: boolean;
  /** True when this ticket lists prerequisites that are not yet marked done (may still proceed in the UI). */
  blockedByOpenDependencies?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SprintLifecycleStatus = "planning" | "active" | "completed";

export interface ProjectSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintLifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

/** UI grouping for backlog / sprint sections. */
export interface SprintGroup {
  id: string;
  name: string;
  goal?: string | null;
  status: SprintLifecycleStatus;
  startDate?: string;
  endDate?: string;
  tickets: ProjectTicket[];
}

export interface CreateSprintPayload {
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string | null;
  startDate?: string;
  endDate?: string;
}

export interface CreateTicketPayload {
  title: string;
  description?: string | null;
  type?: TicketType;
  priority?: string;
  status?: string;
  sprintId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  storyPoints?: number | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  /** Prerequisites in this project; those tickets should be finished before this one. */
  dependsOnTaskIds?: string[];
}

export async function fetchTickets(projectId: string): Promise<ProjectTicket[]> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tickets`);
  return handleResponse<ProjectTicket[]>(res);
}

/** Logged work on a ticket (see time entries API). */
export interface TicketTimeEntry {
  id: string;
  hours: number;
  description: string | null;
  userId: string;
  userName: string;
  createdAt: string;
  canDelete: boolean;
}

/** Single ticket; `includeImage` adds `imageBase64` for clients that need it (optional). */
export type ProjectTicketDetail = ProjectTicket & {
  imageBase64?: string;
  dependsOn?: TicketDependencyLink[];
  blocks?: TicketDependencyLink[];
  timeEntries?: TicketTimeEntry[];
  totalLoggedHours?: number;
};

export async function fetchTicket(
  projectId: string,
  ticketId: string,
  includeImage = false
): Promise<ProjectTicketDetail> {
  const q = includeImage ? "?includeImage=1" : "";
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}${q}`
  );
  return handleResponse<ProjectTicketDetail>(res);
}

export function ticketImageUrl(projectId: string, ticketId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/image`;
}

export async function createTimeEntry(
  projectId: string,
  ticketId: string,
  payload: { hours: number; description?: string | null }
): Promise<{ entry: TicketTimeEntry; totalLoggedHours: number }> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/time-entries`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    }
  );
  return handleResponse<{ entry: TicketTimeEntry; totalLoggedHours: number }>(res);
}

export async function deleteTimeEntry(
  projectId: string,
  ticketId: string,
  entryId: string
): Promise<{ totalLoggedHours: number }> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/time-entries/${encodeURIComponent(entryId)}`,
    { method: "DELETE", credentials: "include" }
  );
  return handleResponse<{ totalLoggedHours: number }>(res);
}

export async function createTicket(
  projectId: string,
  payload: CreateTicketPayload
): Promise<ProjectTicketDetail> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectTicket>(res);
}

export async function updateTicket(
  projectId: string,
  ticketId: string,
  payload: Partial<CreateTicketPayload>
): Promise<ProjectTicketDetail> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<ProjectTicket>(res);
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<ProjectMember[]> {
  const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`);
  return handleResponse<ProjectMember[]>(res);
}

export async function deleteTicket(projectId: string, ticketId: string): Promise<void> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    { method: "DELETE" }
  );
  await handleResponse<void>(res);
}

export async function fetchSprints(projectId: string): Promise<ProjectSprint[]> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/sprints`);
  return handleResponse<ProjectSprint[]>(res);
}

export async function createSprint(
  projectId: string,
  payload: CreateSprintPayload
): Promise<ProjectSprint> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/sprints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectSprint>(res);
}

export async function updateSprint(
  projectId: string,
  sprintId: string,
  payload: UpdateSprintPayload
): Promise<ProjectSprint> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<ProjectSprint>(res);
}

export async function deleteSprint(projectId: string, sprintId: string): Promise<void> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
    { method: "DELETE" }
  );
  await handleResponse<void>(res);
}

export async function startSprint(projectId: string, sprintId: string): Promise<ProjectSprint> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/start`,
    { method: "POST" }
  );
  return handleResponse<ProjectSprint>(res);
}

export async function completeSprint(projectId: string, sprintId: string): Promise<ProjectSprint> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/complete`,
    { method: "POST" }
  );
  return handleResponse<ProjectSprint>(res);
}
