"use client";

import type { ReactNode } from "react";
import type { WorkspaceRole } from "@/lib/auth/rbac";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

type RoleGateProps = {
  workspaceId: string;
  allowedRoles: WorkspaceRole[];
  children: ReactNode;
  fallback?: ReactNode;
};

export default function RoleGate({
  workspaceId,
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { role, isLoading } = useWorkspaceRole(workspaceId);

  if (isLoading) return null;

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
