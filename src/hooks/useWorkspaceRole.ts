"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkspaceRole } from "@/lib/auth/rbac";
import { hasRole as checkHasRole, hasPermission as checkHasPermission } from "@/lib/auth/rbac";
import type { Permission } from "@/lib/auth/rbac";
import { dedupeFetch } from "@/lib/dedupe-fetch";

type UseWorkspaceRoleReturn = {
  role: WorkspaceRole | null;
  isLoading: boolean;
  hasRole: (_requiredRole: WorkspaceRole) => boolean;
  hasPermission: (_permission: Permission) => boolean;
  refetch: () => void;
};

export function useWorkspaceRole(workspaceId: string | undefined): UseWorkspaceRoleReturn {
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!workspaceId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await dedupeFetch(`role:${workspaceId}`, async () => {
        const res = await fetch(`/api/workspaces/${workspaceId}/role`);
        if (res.ok) return res.json() as Promise<{ role: WorkspaceRole }>;
        return { role: null as WorkspaceRole | null };
      });
      setRole(data.role);
    } catch {
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const hasRole = useCallback(
    (requiredRole: WorkspaceRole): boolean => {
      if (!role) return false;
      return checkHasRole(role, requiredRole);
    },
    [role]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false;
      return checkHasPermission(role, permission);
    },
    [role]
  );

  return {
    role,
    isLoading,
    hasRole,
    hasPermission,
    refetch: fetchRole,
  };
}
