import { pgTable, uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { usersTable } from "./users";
import { projectRoleEnum } from "../enums/project";

export const projectMembersTable = pgTable(
    "project_members",
    {
        projectId: uuid("project_id")
            .notNull()
            .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        role: projectRoleEnum("role").notNull().default("member"),
        joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        pk: primaryKey({ name: "project_members_pk", columns: [t.projectId, t.userId] }),
        projectIdx: index("project_members_project_idx").on(t.projectId),
        userIdx: index("project_members_user_idx").on(t.userId),
    })
);
