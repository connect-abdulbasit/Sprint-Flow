import { relations } from "drizzle-orm";
import { usersTable } from "../tables/users";
import { organizationsTable } from "../tables/organizations";
import { organizationMembersTable } from "../tables/organizationMembers";
import { projectMembersTable } from "../tables/projectMembers";
import { projectsTable } from "../tables/projects";
import { tasksTable } from "../tables/tasks";
import { commentsTable } from "../tables/comments";
import { attachmentsTable } from "../tables/attachments";
import { timeEntriesTable } from "../tables/timeEntries";
import { notificationsTable } from "../tables/notifications";
import { activityLogsTable } from "../tables/activityLogs";
import { sessionsTable } from "../tables/sessions";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
    activeOrganization: one(organizationsTable, {
        fields: [usersTable.activeOrganizationId],
        references: [organizationsTable.id],
        relationName: "active_organization",
    }),
    ownedOrganizations: many(organizationsTable, { relationName: "organization_owner" }),
    organizationMemberships: many(organizationMembersTable),
    projectMemberships: many(projectMembersTable),
    createdProjects: many(projectsTable),
    assignedTasks: many(tasksTable, { relationName: "task_assignee" }),
    reportedTasks: many(tasksTable, { relationName: "task_reporter" }),
    comments: many(commentsTable),
    attachments: many(attachmentsTable),
    timeEntries: many(timeEntriesTable),
    notifications: many(notificationsTable),
    activityLogs: many(activityLogsTable),
    sessions: many(sessionsTable),
}));
