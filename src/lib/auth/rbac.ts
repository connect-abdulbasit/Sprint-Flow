/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines a strict three-tier hierarchy for workspace members:
 *   ADMIN > PROJECT_MANAGER > MEMBER
 *
 * Each role inherits the permissions of the roles below it.
 */

// ── Role type (matches the Drizzle pgEnum values) ──────────────
export const WORKSPACE_ROLES = ["admin", "project_manager", "member"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

// ── Permission definitions ─────────────────────────────────────
export const PERMISSIONS = [
  // Workspace-level
  "workspace:manage",
  "workspace:delete",
  "workspace:billing",

  // Member management
  "members:invite",
  "members:remove",
  "members:manage_roles",

  // Project management
  "projects:create",
  "projects:edit",
  "projects:delete",
  "projects:view",

  // Task management
  "tasks:create",
  "tasks:assign",
  "tasks:edit",
  "tasks:update_status",
  "tasks:view",

  // Sprint management
  "sprints:create",
  "sprints:edit",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ── Role → Permission map ──────────────────────────────────────
const ROLE_PERMISSIONS: Record<WorkspaceRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    // Full access
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
    // Can manage projects & tasks, invite basic members
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

  member: new Set<Permission>([
    // Read-only + update task statuses
    "projects:view",
    "tasks:update_status",
    "tasks:view",
  ]),
};

// ── Role hierarchy (lower index = higher rank) ─────────────────
const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  admin: 0,
  project_manager: 1,
  member: 2,
};

// ── Helper functions ───────────────────────────────────────────

/**
 * Check if `userRole` has a specific permission.
 */
export function hasPermission(userRole: WorkspaceRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[userRole];
  return perms ? perms.has(permission) : false;
}

/**
 * Check if `userRole` is at least as privileged as `requiredRole`.
 * E.g. `hasRole("admin", "project_manager")` → true
 */
export function hasRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  const userRank = ROLE_HIERARCHY[userRole];
  const requiredRank = ROLE_HIERARCHY[requiredRole];
  if (userRank === undefined || requiredRank === undefined) return false;
  return userRank <= requiredRank;
}

/**
 * Validate that a string is a valid WorkspaceRole.
 */
export function isValidRole(role: unknown): role is WorkspaceRole {
  return typeof role === "string" && WORKSPACE_ROLES.includes(role as WorkspaceRole);
}

/**
 * Get the display label for a role.
 */
export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    admin: "Admin",
    project_manager: "Project Manager",
    member: "Member",
  };
  return labels[role] ?? "Member";
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: WorkspaceRole): readonly Permission[] {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? Array.from(perms) : [];
}
