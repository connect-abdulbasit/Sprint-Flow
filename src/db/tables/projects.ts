import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const projectsTable = pgTable(
    "projects",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizationsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
        status: varchar("status", { length: 64 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        orgIdx: index("projects_org_idx").on(t.organizationId),
        createdByIdx: index("projects_created_by_idx").on(t.createdBy),
    })
);
