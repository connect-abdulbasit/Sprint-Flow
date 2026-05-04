export const WORKSPACE_ROLES = ["admin", "project_manager", "member"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const PERMISSIONS = [
  "workspace:manage",
  "workspace:delete",
  "workspace:billing",
  "members:invite",
  "members:remove",
  "members:manage_roles",
  "projects:create",
  "projects:edit",
  "projects:delete",
  "projects:view",
  "tasks:create",
  "tasks:assign",
  "tasks:edit",
  "tasks:update_status",
  "tasks:view",
  "sprints:create",
  "sprints:edit",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<WorkspaceRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    "workspace:manage",
    "workspace:delete",
    "workspace:billing",
    "members:invite",
    "members:remove",
    "members:manage_roles",
    "projects:create",
    "projects:edit",
    "projects:delete",
    "projects:view",
    "tasks:create",
    "tasks:assign",
    "tasks:edit",
    "tasks:update_status",
    "tasks:view",
    "sprints:create",
    "sprints:edit",
  ]),

  project_manager: new Set<Permission>([
    "members:invite",
    "projects:create",
    "projects:edit",
    "projects:view",
    "tasks:create",
    "tasks:assign",
    "tasks:edit",
    "tasks:update_status",
    "tasks:view",
    "sprints:create",
    "sprints:edit",
  ]),

  member: new Set<Permission>(["projects:view", "tasks:update_status", "tasks:view"]),
};

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  admin: 0,
  project_manager: 1,
  member: 2,
};

export function hasPermission(userRole: WorkspaceRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[userRole];
  return perms ? perms.has(permission) : false;
}

export function hasRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  const userRank = ROLE_HIERARCHY[userRole];
  const requiredRank = ROLE_HIERARCHY[requiredRole];
  if (userRank === undefined || requiredRank === undefined) return false;
  return userRank <= requiredRank;
}

export function isValidRole(role: unknown): role is WorkspaceRole {
  return typeof role === "string" && WORKSPACE_ROLES.includes(role as WorkspaceRole);
}

export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    admin: "Admin",
    project_manager: "Project Manager",
    member: "Member",
  };
  return labels[role] ?? "Member";
}

export function getPermissionsForRole(role: WorkspaceRole): readonly Permission[] {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? Array.from(perms) : [];
}
