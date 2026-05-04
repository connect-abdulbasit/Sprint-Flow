import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { tasksTable } from "@/modules/task/task.schema";
import { usersTable } from "@/modules/user/user.schema";
import { workspacesTable } from "@/modules/workspace/workspace.schema";
import { relations } from "drizzle-orm";

export const commentsTable = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    userId: uuid("user_id").notNull(),
    content: text("content").notNull(),
    parentId: uuid("parent_id"),
    mentionedUserIds: uuid("mentioned_user_ids").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    taskIdx: index("comments_task_idx").on(t.taskId),
    userIdx: index("comments_user_idx").on(t.userId),
    workspaceIdx: index("comments_workspace_idx").on(t.workspaceId),
    parentIdx: index("comments_parent_idx").on(t.parentId),
  })
);

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
  task: one(tasksTable, {
    fields: [commentsTable.taskId],
    references: [tasksTable.id],
  }),
  workspace: one(workspacesTable, {
    fields: [commentsTable.workspaceId],
    references: [workspacesTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
  parent: one(commentsTable, {
    fields: [commentsTable.parentId],
    references: [commentsTable.id],
    relationName: "commentThread",
  }),
  replies: many(commentsTable, { relationName: "commentThread" }),
}));