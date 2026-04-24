import { pgTable, uuid, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspace.schema";
import { relations } from "drizzle-orm";

export const workspaceNotificationSettingsTable = pgTable("workspace_notification_settings", {
    workspaceId: uuid("workspace_id").primaryKey().references(() => workspacesTable.id, { onDelete: "cascade" }),
    taskAssigned: boolean("task_assigned").default(true),
    taskCompleted: boolean("task_completed").default(true),
    memberJoined: boolean("member_joined").default(true),
    comments: boolean("comments").default(true),
    dueDateReminders: boolean("due_date_reminders").default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    workspaceIdx: index("ws_notif_settings_ws_idx").on(t.workspaceId),
}));

export const workspaceNotificationSettingsRelations = relations(workspaceNotificationSettingsTable, ({ one }) => ({
    workspace: one(workspacesTable, {
        fields: [workspaceNotificationSettingsTable.workspaceId],
        references: [workspacesTable.id],
    }),
}));

