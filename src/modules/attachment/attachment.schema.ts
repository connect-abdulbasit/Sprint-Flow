import { pgTable, uuid, text, varchar, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tasksTable } from "@/modules/task/task.schema";
import { epicsTable } from "@/modules/epic/epic.schema";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";

export const attachmentsTable = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable — an attachment belongs to exactly one of taskId/epicId (see the
    // attachments_exactly_one_parent check below).
    taskId: uuid("task_id").references(() => tasksTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    epicId: uuid("epic_id").references(() => epicsTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    /** The link URL. Column name kept as `fileUrl` for a low-risk additive schema
     * change (no migrations directory to safely rename through) — it now models
     * a lightweight link attachment (paste URL + label), not an uploaded file. */
    fileUrl: text("file_url").notNull(),
    /** Friendly title for the link, e.g. "Design mockup (Figma)". */
    label: varchar("label", { length: 255 }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    taskIdx: index("attachments_task_idx").on(t.taskId),
    epicIdx: index("attachments_epic_idx").on(t.epicId),
    uploadedByIdx: index("attachments_uploaded_by_idx").on(t.uploadedBy),
    exactlyOneParent: check(
      "attachments_exactly_one_parent",
      sql`(task_id is not null and epic_id is null) or (task_id is null and epic_id is not null)`
    ),
  })
);

export const attachmentsRelations = relations(attachmentsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [attachmentsTable.taskId],
    references: [tasksTable.id],
  }),
  epic: one(epicsTable, {
    fields: [attachmentsTable.epicId],
    references: [epicsTable.id],
  }),
  uploader: one(usersTable, {
    fields: [attachmentsTable.uploadedBy],
    references: [usersTable.id],
  }),
}));
