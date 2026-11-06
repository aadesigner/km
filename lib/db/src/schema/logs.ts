import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const systemLogsTable = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull().default("info"), // error | warn | info
  message: text("message").notNull(),
  context: text("context"), // JSON string with extra context
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("system_logs_created_at_idx").on(table.createdAt),
  index("system_logs_level_created_at_idx").on(table.level, table.createdAt),
]);

export type SystemLog = typeof systemLogsTable.$inferSelect;
