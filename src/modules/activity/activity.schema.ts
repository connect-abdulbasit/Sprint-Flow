import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "@/modules/user/user.schema";
import { projectsTable } from "@/modules/project/project.schema";
import { relations } from "drizzle-orm";

export const activityLogsTable = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("activity_logs_user_idx").on(t.userId),
    projectIdx: index("activity_logs_project_idx").on(t.projectId),
    entityIdx: index("activity_logs_entity_idx").on(t.entityType, t.entityId),
  })
);

export const activityLogsRelations = relations(activityLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [activityLogsTable.userId],
    references: [usersTable.id],
  }),
  project: one(projectsTable, {
    fields: [activityLogsTable.projectId],
    references: [projectsTable.id],
  }),
}));

export const activitiesTable = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }).notNull(),
    entityName: varchar("entity_name", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("activities_workspace_idx").on(t.workspaceId),
    userIdx: index("activities_user_idx").on(t.userId),
    entityIdx: index("activities_entity_idx").on(t.entityType, t.entityId),
  })
);

export const activitiesRelations = relations(activitiesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [activitiesTable.userId],
    references: [usersTable.id],
  }),
}));
