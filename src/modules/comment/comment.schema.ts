import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tasksTable } from "@/modules/task/task.schema";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";

/** Threaded discussion on a task (ticket); `task_id` is the ticket row in `tasks`. */
export const commentsTable = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    taskIdx: index("comments_task_idx").on(t.taskId),
    userIdx: index("comments_user_idx").on(t.userId),
  })
);

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [commentsTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
}));
