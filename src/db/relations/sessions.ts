import { relations } from "drizzle-orm";
import { sessionsTable } from "../tables/sessions";
import { usersTable } from "../tables/users";

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [sessionsTable.userId],
        references: [usersTable.id],
    }),
}));
