/**
 * projects-api.ts — Typed API client for the /api/projects endpoints.
 * All network logic lives here so components stay clean.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: string;
  createdBy: string;
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
