"use client";

import type { ReactNode } from "react";
import type { WorkspaceRole } from "@/lib/auth/rbac";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

type RoleGateProps = {
  /** The workspace to check the role against */
  workspaceId: string;
  /** Roles that are allowed to see the children */
  allowedRoles: WorkspaceRole[];
  /** Content to render if the user has one of the allowed roles */
  children: ReactNode;
  /** Optional fallback to render when the user is NOT authorized (default: nothing) */
  fallback?: ReactNode;
};

/**
 * A reusable component that conditionally renders children based on the
 * current user's workspace role.
 *
 * @example
 * <RoleGate workspaceId={wsId} allowedRoles={["admin", "project_manager"]}>
 *   <button>Invite People</button>
 * </RoleGate>
 */
export default function RoleGate({
  workspaceId,
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { role, isLoading } = useWorkspaceRole(workspaceId);

  // While loading, render nothing to avoid flicker
  if (isLoading) return null;

  // If the user's role is in the allowed list, render children
  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Otherwise render the fallback (or nothing)
  return <>{fallback}</>;
}
