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
  /** ISO 3166-1 alpha-2 profile country (informational). XK stored as AL (Albania / Kosovo). */
  countryCode: text("country_code"),
  /** UTC calendar day (YYYY-MM-DD) for country change rate limit. */
  countryChangeDay: text("country_change_day"),
  /** Country profile changes already used on countryChangeDay (max 2/day). */
  countryChangeCount: integer("country_change_count").notNull().default(0),
  /** International dialing prefix including +, e.g. +355. Independent of countryCode. */
  phonePrefix: text("phone_prefix"),
  /** National phone digits only (no spaces or symbols). */
  phoneNational: text("phone_national"),
  phoneChangeDay: text("phone_change_day"),
  phoneChangeCount: integer("phone_change_count").notNull().default(0),
  /** Updated at most once per minute per user while signed in (lightweight presence). */
  lastSeenAt: timestamp("last_seen_at"),
  lastSeenPath: text("last_seen_path"),
  /** Prepaid report credits (1 credit = 1 VIN report unlock). Never expires. */
  creditBalance: integer("credit_balance").notNull().default(0),
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
