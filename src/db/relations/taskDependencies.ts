import { relations } from "drizzle-orm";
import { taskDependenciesTable } from "../tables/taskDependencies";
import { tasksTable } from "../tables/tasks";

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
