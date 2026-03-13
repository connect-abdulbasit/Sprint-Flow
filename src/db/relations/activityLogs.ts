import { relations } from "drizzle-orm";
import { activityLogsTable } from "../tables/activityLogs";
import { usersTable } from "../tables/users";
import { projectsTable } from "../tables/projects";

export const activityLogsRelations = relations(activityLogsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [activityLogsTable.userId],
        references: [usersTable.id],
    }),
    project: one(projectsTable, {
        fields: [activityLogsTable.projectId],
        references: [projectsTable.id],
    }),
}));
