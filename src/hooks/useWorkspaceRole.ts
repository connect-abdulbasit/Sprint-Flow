"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkspaceRole } from "@/lib/auth/rbac";
import { hasRole as checkHasRole, hasPermission as checkHasPermission } from "@/lib/auth/rbac";
import type { Permission } from "@/lib/auth/rbac";

type UseWorkspaceRoleReturn = {
  /** The user's role in the current workspace, or null if still loading / not a member */
  role: WorkspaceRole | null;
  /** Whether the role has finished loading */
  isLoading: boolean;
  /** Whether the user's role is at least `requiredRole` in hierarchy */
  hasRole: (_requiredRole: WorkspaceRole) => boolean;
  /** Whether the user's role grants a specific permission */
  hasPermission: (_permission: Permission) => boolean;
  /** Refetch the role (e.g. after workspace switch) */
  refetch: () => void;
};

/**
 * Custom hook to fetch and cache the current user's workspace role.
 *
 * @example
 * const { role, hasRole, hasPermission, isLoading } = useWorkspaceRole(workspaceId);
 * if (hasRole("project_manager")) { ... }
 * if (hasPermission("members:invite")) { ... }
 */
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
      const res = await fetch(`/api/workspaces/${workspaceId}/role`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role as WorkspaceRole);
      } else {
        setRole(null);
      }
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
