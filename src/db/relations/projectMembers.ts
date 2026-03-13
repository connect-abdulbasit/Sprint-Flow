import { relations } from "drizzle-orm";
import { projectMembersTable } from "../tables/projectMembers";
import { projectsTable } from "../tables/projects";
import { usersTable } from "../tables/users";

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
    project: one(projectsTable, {
        fields: [projectMembersTable.projectId],
        references: [projectsTable.id],
    }),
    user: one(usersTable, {
        fields: [projectMembersTable.userId],
        references: [usersTable.id],
    }),
}));
