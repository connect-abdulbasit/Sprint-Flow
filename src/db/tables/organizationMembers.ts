import { pgTable, uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { orgRoleEnum } from "../enums/org";

export const organizationMembersTable = pgTable(
    "organization_members",
    {
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizationsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        role: orgRoleEnum("role").notNull().default("member"),
        joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        pk: primaryKey({ name: "org_members_pk", columns: [t.organizationId, t.userId] }),
        orgIdx: index("org_members_org_idx").on(t.organizationId),
        userIdx: index("org_members_user_idx").on(t.userId),
    })
);
