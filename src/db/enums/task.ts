import { pgEnum } from "drizzle-orm/pg-core";

export const taskTypeEnum = pgEnum("task_type", ["task", "bug", "feature", "improvement"]);
