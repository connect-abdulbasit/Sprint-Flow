import {
  pgEnum,
  pgTable,
  uuid,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "@/modules/organization/organization.schema";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";
import { projectsTable } from "@/modules/project/project.schema";

export const workspaceRoleEnum = pgEnum("workspace_role", ["admin", "project_manager", "member"]);

export const workspacesTable = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("workspaces_org_idx").on(t.organizationId),
    // AUD-044: this was a plain index despite the name implying uniqueness —
    // getWorkspaceById(idOrSlug) resolves by slug and takes results[0], so two
    // workspaces sharing a slug would silently resolve to whichever one happened to
    // sort first, the moment any slug-based lookup path is used.
    slugUq: uniqueIndex("workspaces_slug_idx").on(t.slug),
  })
);

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ name: "workspace_members_pk", columns: [t.workspaceId, t.userId] }),
    workspaceIdx: index("workspace_members_ws_idx").on(t.workspaceId),
    userIdx: index("workspace_members_user_idx").on(t.userId),
  })
);

export const workspaceInvitesTable = pgTable(
  "workspace_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: workspaceRoleEnum("role").notNull().default("member"),
    token: varchar("token", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("workspace_invites_ws_idx").on(t.workspaceId),
    tokenIdx: index("workspace_invites_token_idx").on(t.token),
    emailIdx: index("workspace_invites_email_idx").on(t.email),
  })
);

export const workspaceRelations = relations(workspacesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [workspacesTable.organizationId],
    references: [organizationsTable.id],
  }),
  members: many(workspaceMembersTable),
  projects: many(projectsTable),
  invites: many(workspaceInvitesTable),
}));

export const workspaceMembersRelations = relations(workspaceMembersTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspaceMembersTable.workspaceId],
    references: [workspacesTable.id],
  }),
  user: one(usersTable, {
    fields: [workspaceMembersTable.userId],
    references: [usersTable.id],
  }),
}));

export const workspaceInvitesRelations = relations(workspaceInvitesTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspaceInvitesTable.workspaceId],
    references: [workspacesTable.id],
  }),
  inviter: one(usersTable, {
    fields: [workspaceInvitesTable.invitedBy],
    references: [usersTable.id],
  }),
}));
