import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tasksTable } from "@/modules/task/task.schema";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";

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

export const attachmentsRelations = relations(attachmentsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [attachmentsTable.taskId],
    references: [tasksTable.id],
  }),
  uploader: one(usersTable, {
    fields: [attachmentsTable.uploadedBy],
    references: [usersTable.id],
  }),
}));
