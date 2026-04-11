import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";

export const notificationTypeEnum = pgEnum("notification_type", [
  "mention",
  "task_assignment",
  "task_comment",
  "task_status",
  "sprint_update",
  "project_update",
  "invite",
  "activity",
  "reminder",
  "general",
]);

export const notificationTargetTypeEnum = pgEnum("notification_target_type", [
  "task",
  "comment",
  "sprint",
  "project",
  "workspace",
  "organization",
  "invite",
  "user",
  "activity",
  "none",
]);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    originUserId: uuid("origin_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    type: notificationTypeEnum("type").notNull().default("general"),
    targetType: notificationTargetTypeEnum("target_type").notNull().default("none"),
    targetId: uuid("target_id"),
    redirectUrl: varchar("redirect_url", { length: 512 }),
    payload: text("payload"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
    workspaceIdx: index("notifications_workspace_idx").on(t.workspaceId),
    targetIdx: index("notifications_target_idx").on(t.targetType, t.targetId),
  })
);

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
  originUser: one(usersTable, {
    fields: [notificationsTable.originUserId],
    references: [usersTable.id],
    relationName: "notification_origin_user",
  }),
}));
