import { pgTable, uuid, varchar, timestamp, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { usersTable } from "@/src/db/tables/users";

export const organizationsTable = pgTable(
    "organizations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 255 }).notNull(),
        ownerId: uuid("owner_id")
            .notNull()
            .references((): AnyPgColumn => usersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        ownerIdx: index("orgs_owner_idx").on(t.ownerId),
    })
);
