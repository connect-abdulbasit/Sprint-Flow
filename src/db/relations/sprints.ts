import { relations } from "drizzle-orm";
import { sprintsTable } from "../tables/sprints";
import { projectsTable } from "../tables/projects";
import { tasksTable } from "../tables/tasks";

export const sprintsRelations = relations(sprintsTable, ({ one, many }) => ({
    project: one(projectsTable, {
        fields: [sprintsTable.projectId],
        references: [projectsTable.id],
    }),
    tasks: many(tasksTable),
}));
