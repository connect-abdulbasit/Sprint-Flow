import { relations } from "drizzle-orm";
import { tasksTable } from "../tables/tasks";
import { projectsTable } from "../tables/projects";
import { sprintsTable } from "../tables/sprints";
import { usersTable } from "../tables/users";
import { commentsTable } from "../tables/comments";
import { attachmentsTable } from "../tables/attachments";
import { timeEntriesTable } from "../tables/timeEntries";
import { taskDependenciesTable } from "../tables/taskDependencies";

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
    project: one(projectsTable, {
        fields: [tasksTable.projectId],
        references: [projectsTable.id],
    }),
    sprint: one(sprintsTable, {
        fields: [tasksTable.sprintId],
        references: [sprintsTable.id],
    }),
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
