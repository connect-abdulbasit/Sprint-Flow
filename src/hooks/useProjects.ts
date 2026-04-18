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
  createProject: (payload: Omit<CreateProjectPayload, "workspaceId">) => Promise<Project>;
  updateProject: (id: string, payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  dismissError: () => void;
}

export function useProjects(workspaceId: string): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects(workspaceId);
      if (mountedRef.current) setProjects(data);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const createProject = useCallback(
    async (payload: Omit<CreateProjectPayload, "workspaceId">): Promise<Project> => {
      setError(null);
      const created = await apiCreate({ ...payload, workspaceId });
      setProjects((prev) => [created, ...prev]);
      return created;
    },
    [workspaceId]
  );

  // ── Update ─────────────────────────────────────────────────────────────────
  const updateProject = useCallback(
    async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
      setError(null);
      // Optimistic update
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
      try {
        const updated = await apiUpdate(id, payload);
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      } catch (err) {
        // Rollback on failure — refetch to be safe
        await loadProjects();
        throw err;
      }
    },
    [loadProjects]
  );

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      // Optimistic removal
      const snapshot = projects;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      try {
        await apiDelete(id);
      } catch (err) {
        // Rollback
        setProjects(snapshot);
        throw err;
      }
    },
    [projects]
  );

  const dismissError = useCallback(() => setError(null), []);

  return { projects, loading, error, createProject, updateProject, deleteProject, dismissError };
}
