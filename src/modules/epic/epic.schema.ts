import { pgTable, uuid, varchar, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projectsTable } from "@/modules/project/project.schema";
import { usersTable } from "@/modules/user/user.schema";
import { tasksTable } from "@/modules/task/task.schema";
import { commentsTable } from "@/modules/comment/comment.schema";
import { attachmentsTable } from "@/modules/attachment/attachment.schema";

/** Workflow state, app-validated (see EPIC_STATUSES in epic.service.ts) — same
 * varchar+app-validation convention as `tasksTable.status`/`sprintsTable.status`. */
export const epicsTable = pgTable(
  "epics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 32 }).notNull().default("backlog"),
    priority: varchar("priority", { length: 32 }).notNull().default("medium"),
    ownerId: uuid("owner_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Denormalized owner display name, same convention as tasksTable.assigneeName. */
    ownerName: varchar("owner_name", { length: 255 }),
    /** Key into a fixed swatch allowlist (see EPIC_COLORS), not a raw hex/token value. */
    color: varchar("color", { length: 32 }),
    /** Key into a fixed lucide-icon allowlist (see EPIC_ICONS). */
    icon: varchar("icon", { length: 32 }),
    labels: text("labels").array(),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    /** Manual position for list/backlog/board-swimlane ordering. */
    orderIndex: integer("order_index").notNull().default(0),
    /** Archiving is orthogonal to workflow status, so it's a separate nullable
     * timestamp rather than a status value — reversible, and keeps `status`
     * meaningful for reporting even while archived. */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectIdx: index("epics_project_idx").on(t.projectId),
    ownerIdx: index("epics_owner_idx").on(t.ownerId),
    statusIdx: index("epics_project_status_idx").on(t.projectId, t.status),
  })
);

export const epicsRelations = relations(epicsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [epicsTable.projectId],
    references: [projectsTable.id],
  }),
  owner: one(usersTable, {
    fields: [epicsTable.ownerId],
    references: [usersTable.id],
  }),
  tasks: many(tasksTable),
  comments: many(commentsTable),
  attachments: many(attachmentsTable),
}));
