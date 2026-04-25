import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {
  organizationsTable,
  organizationMembersTable,
} from "@/modules/organization/organization.schema";
import { relations } from "drizzle-orm";
import { projectsTable } from "@/modules/project/project.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { commentsTable } from "@/modules/comment/comment.schema";
import { attachmentsTable } from "@/modules/attachment/attachment.schema";
import { timeEntriesTable } from "@/modules/time_entry/time_entry.schema";
import { notificationsTable } from "@/modules/notification/notification.schema";
import { activityLogsTable } from "@/modules/activity/activity.schema";
import { workspaceMembersTable } from "@/modules/workspace/workspace.schema";
import { sessionsTable } from "@/modules/auth/auth.schema";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    activeOrganizationId: uuid("active_organization_id").references(
      (): AnyPgColumn => organizationsTable.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUq: uniqueIndex("users_email_uq").on(t.email),
    activeOrgIdx: index("users_active_org_idx").on(t.activeOrganizationId),
  })
);

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  activeOrganization: one(organizationsTable, {
    fields: [usersTable.activeOrganizationId],
    references: [organizationsTable.id],
    relationName: "active_organization",
  }),
  ownedOrganizations: many(organizationsTable, { relationName: "organization_owner" }),
  organizationMemberships: many(organizationMembersTable),
  workspaceMemberships: many(workspaceMembersTable),
  createdProjects: many(projectsTable),
  assignedTasks: many(tasksTable, { relationName: "task_assignee" }),
  reportedTasks: many(tasksTable, { relationName: "task_reporter" }),
  comments: many(commentsTable),
  attachments: many(attachmentsTable),
  timeEntries: many(timeEntriesTable),
  notifications: many(notificationsTable),
  activityLogs: many(activityLogsTable),
  sessions: many(sessionsTable),
}));
