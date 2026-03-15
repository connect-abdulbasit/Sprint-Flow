import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";
import { usersTable } from "./users";

export const attachmentsTable = pgTable(
    "attachments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        taskId: uuid("task_id")
            .notNull()
            .references(() => tasksTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        fileUrl: text("file_url").notNull(),
        uploadedBy: uuid("uploaded_by")
            .notNull()
            .references(() => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        taskIdx: index("attachments_task_idx").on(t.taskId),
        uploadedByIdx: index("attachments_uploaded_by_idx").on(t.uploadedBy),
    })
);
