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
import { workspacesTable } from "@/modules/workspace/workspace.schema";
import { relations } from "drizzle-orm";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { activityLogsTable } from "@/modules/activity/activity.schema";

export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
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
    workspaceIdx: index("projects_workspace_idx").on(t.workspaceId),
    createdByIdx: index("projects_created_by_idx").on(t.createdBy),
  })
);

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [projectsTable.workspaceId],
    references: [workspacesTable.id],
  }),
  creator: one(usersTable, {
    fields: [projectsTable.createdBy],
    references: [usersTable.id],
  }),
  sprints: many(sprintsTable),
  tasks: many(tasksTable),
  activityLogs: many(activityLogsTable),
}));
