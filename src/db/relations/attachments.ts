import { relations } from "drizzle-orm";
import { attachmentsTable } from "../tables/attachments";
import { tasksTable } from "../tables/tasks";
import { usersTable } from "../tables/users";

export const attachmentsRelations = relations(attachmentsTable, ({ one }) => ({
    task: one(tasksTable, {
        fields: [attachmentsTable.taskId],
        references: [tasksTable.id],
    }),
    uploader: one(usersTable, {
        fields: [attachmentsTable.uploadedBy],
        references: [usersTable.id],
    }),
}));
