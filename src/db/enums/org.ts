import { pgEnum } from "drizzle-orm/pg-core";

export const orgRoleEnum = pgEnum("org_role", ["member", "admin", "owner"]);
