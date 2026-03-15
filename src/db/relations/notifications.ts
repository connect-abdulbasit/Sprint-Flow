import { relations } from "drizzle-orm";
import { notificationsTable } from "../tables/notifications";
import { usersTable } from "../tables/users";

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [notificationsTable.userId],
        references: [usersTable.id],
    }),
}));
