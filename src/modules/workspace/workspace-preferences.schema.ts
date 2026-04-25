import { pgTable, uuid, jsonb, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspace.schema";
import { relations } from "drizzle-orm";

export const defaultViewEnum = pgEnum("default_view", ["board", "list", "timeline"]);

export const workspacePreferencesTable = pgTable(
  "workspace_preferences",
  {
    workspaceId: uuid("workspace_id")
      .primaryKey()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    defaultView: defaultViewEnum("default_view").default("board"),
    statuses: jsonb("statuses").default('["To Do", "In Progress", "Done"]'),
    labels: jsonb("labels").default("[]"),
    tags: jsonb("tags").default("[]"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("workspace_prefs_ws_idx").on(t.workspaceId),
  })
);

export const workspacePreferencesRelations = relations(workspacePreferencesTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspacePreferencesTable.workspaceId],
    references: [workspacesTable.id],
  }),
}));
