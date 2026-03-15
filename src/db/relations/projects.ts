import { relations } from "drizzle-orm";
import { projectsTable } from "../tables/projects";
import { organizationsTable } from "../tables/organizations";
import { usersTable } from "../tables/users";
import { projectMembersTable } from "../tables/projectMembers";
import { sprintsTable } from "../tables/sprints";
import { tasksTable } from "../tables/tasks";
import { activityLogsTable } from "../tables/activityLogs";

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
    organization: one(organizationsTable, {
        fields: [projectsTable.organizationId],
        references: [organizationsTable.id],
    }),
    creator: one(usersTable, {
        fields: [projectsTable.createdBy],
        references: [usersTable.id],
    }),
    members: many(projectMembersTable),
    sprints: many(sprintsTable),
    tasks: many(tasksTable),
    activityLogs: many(activityLogsTable),
}));
