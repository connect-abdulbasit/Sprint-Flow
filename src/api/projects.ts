export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export type CreateProjectPayload = Pick<Project, "name" | "workspaceId"> & {
  description?: string;
};
export type UpdateProjectPayload = Partial<Pick<Project, "name" | "description">>;

export const projectApi = {
  getProjectsByWorkspace: async (workspaceId: string): Promise<Project[]> => {
    const res = await fetch(`/api/projects?workspaceId=${workspaceId}`);
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },
  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const res = await fetch(`/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
  },
  updateProject: async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update project");
    return res.json();
  },
  deleteProject: async (id: string): Promise<void> => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete project");
  },
};
