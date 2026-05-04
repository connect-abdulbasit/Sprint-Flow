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
  if (res.status === 204) return undefined as T;
  return res.json();
}

function extractItems<T>(payload: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export async function fetchProjects(workspaceId: string): Promise<Project[]> {
  const res = await fetch(`/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`);
  const data = await handleResponse<Project[] | PaginatedResponse<Project>>(res);
  return extractItems(data);
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

export interface MyTask {
  id: string;
  projectId: string;
  projectName: string;
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
  createdAt: string;
  updatedAt: string;
}

export async function fetchMyTasks(workspaceId: string): Promise<MyTask[]> {
  const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/my-tasks`);
  const data = await handleResponse<MyTask[] | PaginatedResponse<MyTask>>(res);
  return extractItems(data);
}

export type TicketType = "task" | "bug" | "feature" | "improvement";

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

type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

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
  dependsOnTaskIds?: string[];
}

export async function fetchTickets(projectId: string): Promise<ProjectTicket[]> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tickets`);
  const data = await handleResponse<ProjectTicket[] | PaginatedResponse<ProjectTicket>>(res);
  return extractItems(data);
}

export interface TicketTimeEntry {
  id: string;
  hours: number;
  description: string | null;
  userId: string;
  userName: string;
  createdAt: string;
  canDelete: boolean;
}

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
  const data = await handleResponse<ProjectMember[] | PaginatedResponse<ProjectMember>>(res);
  return extractItems(data);
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
  const data = await handleResponse<ProjectSprint[] | PaginatedResponse<ProjectSprint>>(res);
  return extractItems(data);
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
