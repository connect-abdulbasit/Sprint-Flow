import { pgEnum } from "drizzle-orm/pg-core";

export const projectRoleEnum = pgEnum("project_role", ["member", "admin", "owner"]);
