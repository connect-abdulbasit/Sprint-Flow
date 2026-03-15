import { relations } from "drizzle-orm";
import { commentsTable } from "../tables/comments";
import { tasksTable } from "../tables/tasks";
import { usersTable } from "../tables/users";

export const commentsRelations = relations(commentsTable, ({ one }) => ({
    task: one(tasksTable, {
        fields: [commentsTable.taskId],
        references: [tasksTable.id],
    }),
    user: one(usersTable, {
        fields: [commentsTable.userId],
        references: [usersTable.id],
    }),
}));
