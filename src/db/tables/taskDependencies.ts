import { pgTable, uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";

export const taskDependenciesTable = pgTable(
    "task_dependencies",
    {
        taskId: uuid("task_id")
            .notNull()
            .references(() => tasksTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        dependsOnTaskId: uuid("depends_on_task_id")
            .notNull()
            .references(() => tasksTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        pk: primaryKey({ name: "task_deps_pk", columns: [t.taskId, t.dependsOnTaskId] }),
        taskIdx: index("task_deps_task_idx").on(t.taskId),
        dependsIdx: index("task_deps_depends_idx").on(t.dependsOnTaskId),
    })
);
