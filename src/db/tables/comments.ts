import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";
import { usersTable } from "./users";

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
