import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const activityLogsTable = pgTable(
    "activity_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        action: varchar("action", { length: 255 }).notNull(),
        entityType: varchar("entity_type", { length: 64 }).notNull(),
        entityId: uuid("entity_id").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        userIdx: index("activity_logs_user_idx").on(t.userId),
        projectIdx: index("activity_logs_project_idx").on(t.projectId),
        entityIdx: index("activity_logs_entity_idx").on(t.entityType, t.entityId),
    })
);
