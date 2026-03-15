import { relations } from "drizzle-orm";
import { timeEntriesTable } from "../tables/timeEntries";
import { tasksTable } from "../tables/tasks";
import { usersTable } from "../tables/users";

export const timeEntriesRelations = relations(timeEntriesTable, ({ one }) => ({
    task: one(tasksTable, {
        fields: [timeEntriesTable.taskId],
        references: [tasksTable.id],
    }),
    user: one(usersTable, {
        fields: [timeEntriesTable.userId],
        references: [usersTable.id],
    }),
}));
