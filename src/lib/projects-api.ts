import { dedupeFetch } from "@/lib/dedupe-fetch";

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

export class ApiError extends Error {
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

export function fetchProject(id: string): Promise<Project> {
  return dedupeFetch(`project:${id}`, async () => {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
    return handleResponse<Project>(res);
  });
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
  epicId: string | null;
  parentTaskId: string | null;
  orderIndex: number;
  labels: string[];
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

export type TicketType = "task" | "bug" | "feature" | "improvement" | "story";

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
  epicId: string | null;
  parentTaskId: string | null;
  orderIndex: number;
  labels: string[];
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
  epicId?: string | null;
  parentTaskId?: string | null;
  orderIndex?: number;
  labels?: string[] | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  storyPoints?: number | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  dependsOnTaskIds?: string[];
}

/** Thin wrapper over createTicket for the "Create Subtask" flow — a subtask is
 * just a ticket with parentTaskId set; the server denormalizes epicId/sprintId
 * from the parent regardless of what's passed here. */
export async function createSubtask(
  projectId: string,
  parentTaskId: string,
  payload: Pick<CreateTicketPayload, "title" | "description" | "assigneeId" | "priority" | "status">
): Promise<ProjectTicketDetail> {
  return createTicket(projectId, { ...payload, parentTaskId, type: "task" });
}

export function fetchTickets(projectId: string): Promise<ProjectTicket[]> {
  return dedupeFetch(`tickets:${projectId}`, async () => {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tickets`);
    const data = await handleResponse<ProjectTicket[] | PaginatedResponse<ProjectTicket>>(res);
    return extractItems(data);
  });
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
  payload: Partial<CreateTicketPayload> & {
    /** Optimistic-concurrency token; see AUD-036. */
    expectedUpdatedAt?: string;
  }
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
  avatarUrl?: string | null;
}

export function fetchWorkspaceMembers(workspaceId: string): Promise<ProjectMember[]> {
  return dedupeFetch(`members:${workspaceId}`, async () => {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`);
    const data = await handleResponse<ProjectMember[] | PaginatedResponse<ProjectMember>>(res);
    return extractItems(data);
  });
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

// ---------------------------------------------------------------------------
// Epics
// ---------------------------------------------------------------------------

export type EpicStatus = "backlog" | "in_progress" | "done";

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: EpicStatus;
  priority: string;
  ownerId: string | null;
  ownerName: string | null;
  color: string | null;
  icon: string | null;
  labels: string[];
  startDate: string | null;
  dueDate: string | null;
  orderIndex: number;
  archivedAt: string | null;
  issueCount: number;
  completedIssueCount: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpicPayload {
  name: string;
  description: string;
  status: EpicStatus;
  priority: string;
  ownerId: string;
  color: string;
  icon: string;
  labels: string[];
  startDate: string;
  dueDate: string;
}

export type UpdateEpicPayload = Partial<CreateEpicPayload>;

export function fetchEpics(
  projectId: string,
  opts?: { includeArchived?: boolean; skipProgress?: boolean }
): Promise<Epic[]> {
  const params = new URLSearchParams();
  if (opts?.includeArchived) params.set("includeArchived", "1");
  if (opts?.skipProgress) params.set("skipProgress", "1");
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  return dedupeFetch(`epics:${projectId}:${suffix}`, async () => {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/epics${suffix}`);
    const data = await handleResponse<Epic[] | PaginatedResponse<Epic>>(res);
    return extractItems(data);
  });
}

export async function fetchEpic(projectId: string, epicId: string): Promise<Epic> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}`
  );
  return handleResponse<Epic>(res);
}

export async function createEpic(projectId: string, payload: CreateEpicPayload): Promise<Epic> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/epics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Epic>(res);
}

export async function updateEpic(
  projectId: string,
  epicId: string,
  payload: UpdateEpicPayload
): Promise<Epic> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<Epic>(res);
}

export async function deleteEpic(projectId: string, epicId: string): Promise<void> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}`,
    { method: "DELETE" }
  );
  await handleResponse<void>(res);
}

export async function archiveEpic(projectId: string, epicId: string): Promise<Epic> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/archive`,
    { method: "POST" }
  );
  return handleResponse<Epic>(res);
}

export async function unarchiveEpic(projectId: string, epicId: string): Promise<Epic> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/unarchive`,
    { method: "POST" }
  );
  return handleResponse<Epic>(res);
}

/** Duplicates the epic shell only — does not deep-copy its issues. */
export async function duplicateEpic(projectId: string, epicId: string): Promise<Epic> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/duplicate`,
    { method: "POST" }
  );
  return handleResponse<Epic>(res);
}

export async function moveEpic(
  projectId: string,
  epicId: string,
  targetIndex: number
): Promise<Epic[]> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/move`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetIndex }),
    }
  );
  const data = await handleResponse<Epic[] | PaginatedResponse<Epic>>(res);
  return extractItems(data);
}

// ---------------------------------------------------------------------------
// Activity (per-entity feed, shared by epics/tickets/subtasks)
// ---------------------------------------------------------------------------

export interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  createdAt: string;
}

export async function fetchEpicActivity(
  projectId: string,
  epicId: string
): Promise<ActivityLogEntry[]> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/activity`
  );
  const data = await handleResponse<PaginatedResponse<ActivityLogEntry>>(res);
  return extractItems(data);
}

export async function fetchTicketActivity(
  projectId: string,
  ticketId: string
): Promise<ActivityLogEntry[]> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/activity`
  );
  const data = await handleResponse<PaginatedResponse<ActivityLogEntry>>(res);
  return extractItems(data);
}

// ---------------------------------------------------------------------------
// Attachments (lightweight URL+label links, at the ticket or epic level)
// ---------------------------------------------------------------------------

export interface TicketAttachment {
  id: string;
  taskId: string | null;
  epicId: string | null;
  fileUrl: string;
  label: string | null;
  uploadedBy: string;
  uploaderName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttachmentPayload {
  fileUrl: string;
  label?: string | null;
}

export async function fetchTicketAttachments(
  projectId: string,
  ticketId: string
): Promise<TicketAttachment[]> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/attachments`
  );
  const data = await handleResponse<{ items: TicketAttachment[] }>(res);
  return data.items;
}

export async function createTicketAttachment(
  projectId: string,
  ticketId: string,
  payload: CreateAttachmentPayload
): Promise<TicketAttachment> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/attachments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<TicketAttachment>(res);
}

export async function fetchEpicAttachments(
  projectId: string,
  epicId: string
): Promise<TicketAttachment[]> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/attachments`
  );
  const data = await handleResponse<{ items: TicketAttachment[] }>(res);
  return data.items;
}

export async function createEpicAttachment(
  projectId: string,
  epicId: string,
  payload: CreateAttachmentPayload
): Promise<TicketAttachment> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/attachments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<TicketAttachment>(res);
}

export async function deleteAttachment(projectId: string, attachmentId: string): Promise<void> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" }
  );
  await handleResponse<void>(res);
}
