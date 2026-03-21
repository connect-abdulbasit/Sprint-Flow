import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "@/modules/user/user.schema";
import { relations } from "drizzle-orm";

// --- TABLE: notifications ---
export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  })
);

// --- RELATIONS: notifications ---
export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
}));
