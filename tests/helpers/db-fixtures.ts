import { db } from "@/lib/db";
import { usersTable } from "@/modules/user/user.schema";
import {
  organizationsTable,
  organizationMembersTable,
} from "@/modules/organization/organization.schema";
import {
  workspacesTable,
  workspaceMembersTable,
  workspaceInvitesTable,
} from "@/modules/workspace/workspace.schema";
import { projectsTable } from "@/modules/project/project.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { eq } from "drizzle-orm";

let counter = 0;
function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestUser(overrides: Partial<typeof usersTable.$inferInsert> = {}) {
  const [user] = await db
    .insert(usersTable)
    .values({
      name: overrides.name ?? "Test User",
      email: overrides.email ?? `${unique("user")}@example.com`,
      passwordHash: overrides.passwordHash ?? "test-hash",
      authProvider: overrides.authProvider ?? "password",
    })
    .returning();
  return user;
}

export async function createTestOrg(ownerId: string, overrides: { name?: string } = {}) {
  const [org] = await db
    .insert(organizationsTable)
    .values({ name: overrides.name ?? unique("Org"), ownerId })
    .returning();
  await db
    .insert(organizationMembersTable)
    .values({ organizationId: org.id, userId: ownerId, role: "owner" })
    .onConflictDoNothing();
  return org;
}

export async function createTestWorkspace(
  organizationId: string,
  adminUserId: string,
  overrides: { name?: string; slug?: string } = {}
) {
  const [workspace] = await db
    .insert(workspacesTable)
    .values({
      organizationId,
      name: overrides.name ?? unique("Workspace"),
      slug: overrides.slug ?? unique("workspace"),
    })
    .returning();
  await db.insert(workspaceMembersTable).values({
    workspaceId: workspace.id,
    userId: adminUserId,
    role: "admin",
  });
  return workspace;
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: "admin" | "project_manager" | "member" = "member"
) {
  await db.insert(workspaceMembersTable).values({ workspaceId, userId, role });
}

export async function createTestInvite(params: {
  workspaceId: string;
  email: string;
  invitedBy: string;
  role?: "admin" | "project_manager" | "member";
  status?: "pending" | "accepted" | "declined" | "revoked";
  expiresAt?: Date;
}) {
  const [invite] = await db
    .insert(workspaceInvitesTable)
    .values({
      workspaceId: params.workspaceId,
      email: params.email,
      invitedBy: params.invitedBy,
      role: params.role ?? "member",
      status: params.status ?? "pending",
      token: unique("token"),
      expiresAt: params.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();
  return invite;
}

export async function createTestProject(
  workspaceId: string,
  createdBy: string,
  overrides: { name?: string } = {}
) {
  const [project] = await db
    .insert(projectsTable)
    .values({
      workspaceId,
      name: overrides.name ?? unique("Project"),
      createdBy,
      status: "active",
    })
    .returning();
  return project;
}

export async function createTestTask(
  projectId: string,
  reporterId: string,
  overrides: Partial<typeof tasksTable.$inferInsert> = {}
) {
  const [task] = await db
    .insert(tasksTable)
    .values({
      projectId,
      ticketNumber: overrides.ticketNumber ?? Math.floor(Math.random() * 1_000_000),
      title: overrides.title ?? unique("Task"),
      type: overrides.type ?? "task",
      priority: overrides.priority ?? "medium",
      status: overrides.status ?? "todo",
      reporterId,
      reporterName: overrides.reporterName ?? "Reporter",
      assigneeId: overrides.assigneeId,
      assigneeName: overrides.assigneeName,
      sprintId: overrides.sprintId,
    })
    .returning();
  return task;
}

export async function createTestSprint(
  projectId: string,
  overrides: Partial<typeof sprintsTable.$inferInsert> = {}
) {
  const today = new Date();
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const [sprint] = await db
    .insert(sprintsTable)
    .values({
      projectId,
      name: overrides.name ?? unique("Sprint"),
      startDate: overrides.startDate ?? today.toISOString().slice(0, 10),
      endDate: overrides.endDate ?? in14Days.toISOString().slice(0, 10),
      status: overrides.status ?? "planning",
    })
    .returning();
  return sprint;
}

/** Deletes a full org tree (invites/members/workspaces/org) plus the given user ids. */
export async function cleanupTestData(params: { organizationIds?: string[]; userIds?: string[] }) {
  for (const orgId of params.organizationIds ?? []) {
    const workspaces = await db
      .select({ id: workspacesTable.id })
      .from(workspacesTable)
      .where(eq(workspacesTable.organizationId, orgId));
    for (const ws of workspaces) {
      await db.delete(workspaceInvitesTable).where(eq(workspaceInvitesTable.workspaceId, ws.id));
      await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.workspaceId, ws.id));
    }
    await db.delete(workspacesTable).where(eq(workspacesTable.organizationId, orgId));
    await db
      .delete(organizationMembersTable)
      .where(eq(organizationMembersTable.organizationId, orgId));
    await db.delete(organizationsTable).where(eq(organizationsTable.id, orgId));
  }
  for (const userId of params.userIds ?? []) {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
  }
}
