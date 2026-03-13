import { pgTable, uuid, decimal, text, timestamp, index } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";
import { usersTable } from "./users";

export const timeEntriesTable = pgTable(
    "time_entries",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        taskId: uuid("task_id")
            .notNull()
            .references(() => tasksTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        hours: decimal("hours", { precision: 10, scale: 2 }).notNull(),
        description: text("description"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        taskIdx: index("time_entries_task_idx").on(t.taskId),
        userIdx: index("time_entries_user_idx").on(t.userId),
    })
);
