import {
  pgEnum,
  pgTable,
  uuid,
  timestamp,
  primaryKey,
  index,
  varchar,
  text,
  date,
  integer,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core/columns/custom";
import { projectsTable } from "@/modules/project/project.schema";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";
import { commentsTable } from "@/modules/comment/comment.schema";
import { attachmentsTable } from "@/modules/attachment/attachment.schema";
import { timeEntriesTable } from "@/modules/time_entry/time_entry.schema";
import { epicsTable } from "@/modules/epic/epic.schema";

// "story" added alongside the original 4 values for the Epic/Issue hierarchy —
// additive-only enum change, no existing rows/values are touched.
export const taskTypeEnum = pgEnum("task_type", ["task", "bug", "feature", "improvement", "story"]);

/** Binary ticket image stored in Postgres `bytea` (node-pg returns `Buffer`). */
export const pgBytea = customType<{ data: Buffer | null; driverData: Buffer | null }>({
  dataType() {
    return "bytea";
  },
  fromDriver(value) {
    if (value === null || value === undefined) return null;
    return Buffer.isBuffer(value) ? value : Buffer.from(value as Uint8Array);
  },
  toDriver(value) {
    return value;
  },
});

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

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    /** Monotonic per project; used with project prefix for human-readable keys (e.g. SF-12). */
    ticketNumber: integer("ticket_number").notNull(),
    sprintId: uuid("sprint_id").references(() => sprintsTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Nullable — a task with no epic is a top-level backlog item. */
    epicId: uuid("epic_id").references(() => epicsTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Self-referential; non-null marks this row as a subtask of another task.
     * Depth is capped at 1 level in TaskService, not the DB — a subtask may
     * never itself have a non-null parentTaskId. */
    parentTaskId: uuid("parent_task_id").references((): AnyPgColumn => tasksTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    /** Manual position for backlog/board ordering. */
    orderIndex: integer("order_index").notNull().default(0),
    labels: text("labels").array(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: taskTypeEnum("type").notNull(),
    priority: varchar("priority", { length: 32 }).notNull(),
    status: varchar("status", { length: 64 }).notNull(),
    assigneeId: uuid("assignee_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Denormalized assignee display name; kept in sync when assignee changes. */
    assigneeName: varchar("assignee_name", { length: 255 }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
    /** Denormalized reporter display name (stable label even if profile changes). */
    reporterName: varchar("reporter_name", { length: 255 }).notNull(),
    dueDate: date("due_date"),
    storyPoints: integer("story_points"),
    /** Cover / inline image for the ticket body. */
    image: pgBytea("image"),
    imageMimeType: varchar("image_mime_type", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectIdx: index("tasks_project_idx").on(t.projectId),
    sprintIdx: index("tasks_sprint_idx").on(t.sprintId),
    assigneeIdx: index("tasks_assignee_idx").on(t.assigneeId),
    reporterIdx: index("tasks_reporter_idx").on(t.reporterId),
    epicIdx: index("tasks_epic_idx").on(t.epicId),
    parentTaskIdx: index("tasks_parent_task_idx").on(t.parentTaskId),
    projectTicketNumUq: uniqueIndex("tasks_project_ticket_number_uq").on(
      t.projectId,
      t.ticketNumber
    ),
  })
);

export const taskDependenciesRelations = relations(taskDependenciesTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskDependenciesTable.taskId],
    references: [tasksTable.id],
    relationName: "task_dependencies",
  }),
  dependsOn: one(tasksTable, {
    fields: [taskDependenciesTable.dependsOnTaskId],
    references: [tasksTable.id],
    relationName: "task_dependents",
  }),
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id],
  }),
  sprint: one(sprintsTable, {
    fields: [tasksTable.sprintId],
    references: [sprintsTable.id],
  }),
  epic: one(epicsTable, {
    fields: [tasksTable.epicId],
    references: [epicsTable.id],
  }),
  parentTask: one(tasksTable, {
    fields: [tasksTable.parentTaskId],
    references: [tasksTable.id],
    relationName: "task_subtasks",
  }),
  subtasks: many(tasksTable, { relationName: "task_subtasks" }),
  assignee: one(usersTable, {
    fields: [tasksTable.assigneeId],
    references: [usersTable.id],
    relationName: "task_assignee",
  }),
  reporter: one(usersTable, {
    fields: [tasksTable.reporterId],
    references: [usersTable.id],
    relationName: "task_reporter",
  }),
  comments: many(commentsTable),
  attachments: many(attachmentsTable),
  timeEntries: many(timeEntriesTable),
  dependencies: many(taskDependenciesTable, { relationName: "task_dependencies" }),
  dependents: many(taskDependenciesTable, { relationName: "task_dependents" }),
}));
