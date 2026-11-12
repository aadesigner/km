import { db, systemSettingsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { logger } from "./logger.js";

/**
 * Admin toggle for normal Carstat local listings (local-exists / local-report).
 * Default true — existing installs keep current cascade until an admin turns it off.
 */
let enabledCache = true;
let lastFetch = 0;
const TTL_MS = 15_000;
let fetchPromise: Promise<void> | null = null;

async function refresh(): Promise<void> {
  try {
    const [row] = await db
      .select({ carstatLocalApiEnabled: systemSettingsTable.carstatLocalApiEnabled })
      .from(systemSettingsTable)
      .orderBy(desc(systemSettingsTable.id))
      .limit(1);
    if (row && typeof row.carstatLocalApiEnabled === "boolean") {
      enabledCache = row.carstatLocalApiEnabled;
    }
    lastFetch = Date.now();
  } catch (err) {
    logger.warn({ err }, "carstatLocalApiSettingsCache: failed to refresh");
  } finally {
    fetchPromise = null;
  }
}

export async function ensureCarstatLocalApiEnabledLoaded(): Promise<boolean> {
  if (Date.now() - lastFetch > TTL_MS) {
    if (!fetchPromise) fetchPromise = refresh();
    await fetchPromise;
  }
  return enabledCache;
}

export function isCarstatLocalApiEnabledCached(): boolean {
  return enabledCache;
}

export function invalidateCarstatLocalApiSettingsCache(): void {
  lastFetch = 0;
}

export function setCarstatLocalApiEnabledCache(enabled: boolean): void {
  enabledCache = enabled;
  lastFetch = Date.now();
}

/** True when admin toggle allows local-exists / local-report. */
export async function resolveCarstatLocalApiEnabled(): Promise<boolean> {
  await ensureCarstatLocalApiEnabledLoaded();
  return isCarstatLocalApiEnabledCached();
}
