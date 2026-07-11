import { pgTable, text, boolean, timestamp, integer, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  facebookId: text("facebook_id").unique(),
  linkedinId: text("linkedin_id").unique(),
  authProvider: text("auth_provider").notNull().default("local"),
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason"),
  isAdmin: boolean("is_admin").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  /** Updated at most once per minute per user while signed in (lightweight presence). */
  lastSeenAt: timestamp("last_seen_at"),
  lastSeenPath: text("last_seen_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("users_created_at_idx").on(table.createdAt),
  index("users_last_seen_at_idx").on(table.lastSeenAt),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export interface UserStats {
  totalChecks: number;
  totalSpent: number;
  checksThisMonth: number;
}
