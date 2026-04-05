import {
  pgEnum,
  pgTable,
  uuid,
  timestamp,
  primaryKey,
  index,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "@/modules/organization/organization.schema";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";
import { projectsTable } from "@/modules/project/project.schema";

export const workspaceRoleEnum = pgEnum("workspace_role", ["admin", "member"]);

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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("workspaces_org_idx").on(t.organizationId),
    slugUq: index("workspaces_slug_idx").on(t.slug),
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

export const workspaceRelations = relations(workspacesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [workspacesTable.organizationId],
    references: [organizationsTable.id],
  }),
  members: many(workspaceMembersTable),
  projects: many(projectsTable),
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
