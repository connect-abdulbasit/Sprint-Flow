import { relations } from "drizzle-orm";
import { organizationMembersTable } from "../tables/organizationMembers";
import { organizationsTable } from "../tables/organizations";
import { usersTable } from "../tables/users";

export const organizationMembersRelations = relations(
    organizationMembersTable,
    ({ one }) => ({
        organization: one(organizationsTable, {
            fields: [organizationMembersTable.organizationId],
            references: [organizationsTable.id],
        }),
        user: one(usersTable, {
            fields: [organizationMembersTable.userId],
            references: [usersTable.id],
        }),
    })
);
