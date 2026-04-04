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
import { usersTable } from "@/modules/user/user.schema";
import { organizationsTable } from "@/modules/organization/organization.schema";
import { relations } from "drizzle-orm";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { activityLogsTable } from "@/modules/activity/activity.schema";

export const projectRoleEnum = pgEnum("project_role", ["member", "admin", "owner"]);

export const projectMembersTable = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: projectRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ name: "project_members_pk", columns: [t.projectId, t.userId] }),
    projectIdx: index("project_members_project_idx").on(t.projectId),
    userIdx: index("project_members_user_idx").on(t.userId),
  })
);

export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
    status: varchar("status", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("projects_org_idx").on(t.organizationId),
    createdByIdx: index("projects_created_by_idx").on(t.createdBy),
  })
);

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectMembersTable.projectId],
    references: [projectsTable.id],
  }),
  user: one(usersTable, {
    fields: [projectMembersTable.userId],
    references: [usersTable.id],
  }),
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [projectsTable.organizationId],
    references: [organizationsTable.id],
  }),
  creator: one(usersTable, {
    fields: [projectsTable.createdBy],
    references: [usersTable.id],
  }),
  members: many(projectMembersTable),
  sprints: many(sprintsTable),
  tasks: many(tasksTable),
  activityLogs: many(activityLogsTable),
}));
