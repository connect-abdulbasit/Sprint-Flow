"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  fetchProjects,
  createProject as apiCreate,
  updateProject as apiUpdate,
  deleteProject as apiDelete,
  type Project,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from "@/lib/projects-api";

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (_payload: Omit<CreateProjectPayload, "workspaceId">) => Promise<Project>;
  updateProject: (_id: string, _payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (_id: string) => Promise<void>;
  dismissError: () => void;
}

export function useProjects(workspaceId: string): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // AUD-048: mountedRef alone only guards against post-unmount setState, not against
  // out-of-order responses — if workspaceId changes twice in quick succession (fast
  // switching via the org/workspace switcher), a slow response for the *first*
  // workspace could resolve after the second and overwrite state with the wrong
  // workspace's projects. requestIdRef tracks which call is the most recent one, and a
  // response is only applied if it's still current.
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProjects = useCallback(async () => {
    if (!workspaceId) return;
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects(workspaceId);
      if (mountedRef.current && requestIdRef.current === requestId) setProjects(data);
    } catch (err: unknown) {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      }
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(
    async (payload: Omit<CreateProjectPayload, "workspaceId">): Promise<Project> => {
      setError(null);
      const created = await apiCreate({ ...payload, workspaceId });
      setProjects((prev) => [created, ...prev]);
      return created;
    },
    [workspaceId]
  );

  const updateProject = useCallback(
    async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
      setError(null);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
      try {
        const updated = await apiUpdate(id, payload);
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      } catch (err) {
        await loadProjects();
        throw err;
      }
    },
    [loadProjects]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      const snapshot = projects;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      try {
        await apiDelete(id);
      } catch (err) {
        setProjects(snapshot);
        throw err;
      }
    },
    [projects]
  );

  const dismissError = useCallback(() => setError(null), []);

  return { projects, loading, error, createProject, updateProject, deleteProject, dismissError };
}
