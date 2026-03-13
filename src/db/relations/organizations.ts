import { relations } from "drizzle-orm";
import { organizationsTable } from "../tables/organizations";
import { usersTable } from "../tables/users";
import { organizationMembersTable } from "../tables/organizationMembers";
import { projectsTable } from "../tables/projects";

export const organizationsRelations = relations(organizationsTable, ({ one, many }) => ({
    owner: one(usersTable, {
        fields: [organizationsTable.ownerId],
        references: [usersTable.id],
        relationName: "organization_owner",
    }),
    members: many(organizationMembersTable),
    projects: many(projectsTable),
    activeUsers: many(usersTable, { relationName: "active_organization" }),
}));
