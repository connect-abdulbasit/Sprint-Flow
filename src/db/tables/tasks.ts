import { pgTable, uuid, varchar, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { sprintsTable } from "./sprints";
import { usersTable } from "./users";
import { taskTypeEnum } from "../enums/task";

export const tasksTable = pgTable(
    "tasks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        sprintId: uuid("sprint_id").references(() => sprintsTable.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        title: varchar("title", { length: 500 }).notNull(),
        description: text("description"),
        type: taskTypeEnum("type").notNull(),
        priority: varchar("priority", { length: 32 }).notNull(),
        status: varchar("status", { length: 64 }).notNull(),
        assigneeId: uuid("assignee_id").references(() => usersTable.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        reporterId: uuid("reporter_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
        dueDate: date("due_date"),
        storyPoints: integer("story_points"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        projectIdx: index("tasks_project_idx").on(t.projectId),
        sprintIdx: index("tasks_sprint_idx").on(t.sprintId),
        assigneeIdx: index("tasks_assignee_idx").on(t.assigneeId),
        reporterIdx: index("tasks_reporter_idx").on(t.reporterId),
    })
);
