import { useState, useCallback, useEffect } from "react";
import { projectApi, Project, CreateProjectPayload, UpdateProjectPayload } from "../api/projects";

export const useProjects = (workspaceId: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getProjectsByWorkspace(workspaceId);
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Error fetching projects");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (payload: Omit<CreateProjectPayload, "workspaceId">) => {
    try {
      setLoading(true);
      setError(null);
      const newProject = await projectApi.createProject({ ...payload, workspaceId });
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, payload: UpdateProjectPayload) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await projectApi.updateProject(id, payload);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await projectApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
