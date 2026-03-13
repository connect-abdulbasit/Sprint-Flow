
import { pgTable, uuid, varchar, text, timestamp, index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { organizationsTable } from "@/src/db/tables/organizations";

export const usersTable = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 255 }).notNull(),
        email: varchar("email", { length: 255 }).notNull(),
        passwordHash: varchar("password_hash", { length: 255 }).notNull(),
        avatarUrl: text("avatar_url"),
        lastLogin: timestamp("last_login", { withTimezone: true }),
        activeOrganizationId: uuid("active_organization_id").references((): AnyPgColumn => organizationsTable.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        emailUq: uniqueIndex("users_email_uq").on(t.email),
        activeOrgIdx: index("users_active_org_idx").on(t.activeOrganizationId),
    })
);
