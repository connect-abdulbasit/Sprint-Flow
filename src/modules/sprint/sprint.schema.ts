import { pgTable, uuid, varchar, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { projectsTable } from "@/modules/project/project.schema";
import { relations } from "drizzle-orm";
import { tasksTable } from "@/modules/task/task.schema";

export const sprintsTable = pgTable(
  "sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    goal: text("goal"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: varchar("status", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectIdx: index("sprints_project_idx").on(t.projectId),
  })
);

export const sprintsRelations = relations(sprintsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [sprintsTable.projectId],
    references: [projectsTable.id],
  }),
  tasks: many(tasksTable),
}));
