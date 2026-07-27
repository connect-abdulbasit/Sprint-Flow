import { pgTable, text, uuid, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tasksTable } from "@/modules/task/task.schema";
import { epicsTable } from "@/modules/epic/epic.schema";
import { usersTable } from "@/modules/user/user.schema";
import { workspacesTable } from "@/modules/workspace/workspace.schema";
import { relations } from "drizzle-orm";

export const commentsTable = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // AUD-019: these previously had no `.references()` at all — deleting a ticket left
    // its comments permanently orphaned in the table (no cascade, no cleanup path).
    // Nullable because a comment now belongs to exactly one of taskId/epicId (see
    // the comments_exactly_one_parent check below).
    taskId: uuid("task_id").references(() => tasksTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    epicId: uuid("epic_id").references(() => epicsTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    content: text("content").notNull(),
    parentId: uuid("parent_id"),
    mentionedUserIds: uuid("mentioned_user_ids").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    taskIdx: index("comments_task_idx").on(t.taskId),
    epicIdx: index("comments_epic_idx").on(t.epicId),
    userIdx: index("comments_user_idx").on(t.userId),
    workspaceIdx: index("comments_workspace_idx").on(t.workspaceId),
    parentIdx: index("comments_parent_idx").on(t.parentId),
    exactlyOneParent: check(
      "comments_exactly_one_parent",
      sql`(task_id is not null and epic_id is null) or (task_id is null and epic_id is not null)`
    ),
  })
);

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
  task: one(tasksTable, {
    fields: [commentsTable.taskId],
    references: [tasksTable.id],
  }),
  epic: one(epicsTable, {
    fields: [commentsTable.epicId],
    references: [epicsTable.id],
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
