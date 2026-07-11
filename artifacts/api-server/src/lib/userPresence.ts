import { db, usersTable } from "@workspace/db";
import { and, desc, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { logger } from "./logger.js";

const THROTTLE_MS = 20_000;
const MAX_PATH_LEN = 180;
const MAX_THROTTLE_MAP = 2_000;
const STATS_CACHE_MS = 45_000;
const ADMIN_PRESENCE_PREFIX = "/adminx";

/** In-process throttle — one DB write per user per ~20s on the same path; path changes write immediately. */
const lastTouchAt = new Map<string, number>();
const lastTouchPath = new Map<string, string>();

let statsCache: { at: number; data: OnlinePresenceStats } | null = null;

export function isAdminPresencePath(path: string): boolean {
  return path === ADMIN_PRESENCE_PREFIX || path.startsWith(`${ADMIN_PRESENCE_PREFIX}/`);
}

/** Only public site pages count — admin area and blank paths are ignored. */
export function isTrackablePresencePath(path: string | null | undefined): boolean {
  if (!path) return false;
  return !isAdminPresencePath(path);
}

/** Allow only safe public app path characters — blocks XSS/control junk in stored paths. */
const SAFE_PRESENCE_PATH_RE = /^\/[A-Za-z0-9/_\-.%~+]*$/;

export function sanitizePresencePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let path = raw.trim();
  if (!path || path.length > MAX_PATH_LEN * 2) return null;
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.split("?")[0]?.split("#")[0] ?? path;
  if (path.length > MAX_PATH_LEN) path = path.slice(0, MAX_PATH_LEN);
  // Reject traversal, protocol tricks, and non-path payloads.
  if (
    path.includes("..")
    || path.includes("//")
    || path.includes("\\")
    || /[\u0000-\u001F\u007F<>"'`]/.test(path)
    || !SAFE_PRESENCE_PATH_RE.test(path)
  ) {
    return null;
  }
  if (!isTrackablePresencePath(path)) return null;
  return path;
}

function pruneThrottleMap(now: number): void {
  if (lastTouchAt.size <= MAX_THROTTLE_MAP) return;
  const cutoff = now - THROTTLE_MS * 2;
  for (const [id, touched] of lastTouchAt) {
    if (touched < cutoff) {
      lastTouchAt.delete(id);
      lastTouchPath.delete(id);
    }
  }
}

/** Record signed-in user activity on public pages only. No-op when throttled. Never throws. */
export async function touchUserPresence(
  userId: string,
  path?: string | null,
  opts?: { force?: boolean },
): Promise<void> {
  try {
    const cleanPath = sanitizePresencePath(path);
    if (!cleanPath) return;

    const now = Date.now();
    if (!opts?.force) {
      const prev = lastTouchAt.get(userId) ?? 0;
      const prevPath = lastTouchPath.get(userId);
      const samePath = prevPath === cleanPath;
      if (samePath && now - prev < THROTTLE_MS) return;
    }
    lastTouchAt.set(userId, now);
    lastTouchPath.set(userId, cleanPath);
    pruneThrottleMap(now);

    // Only the caller's own non-admin, non-banned row can be updated.
    await db
      .update(usersTable)
      .set({
        lastSeenAt: new Date(),
        lastSeenPath: cleanPath,
      })
      .where(
        and(
          eq(usersTable.id, userId),
          eq(usersTable.isAdmin, false),
          eq(usersTable.isBanned, false),
        ),
      );
  } catch (err) {
    logger.warn({ err, userId }, "presence touch failed");
  }
}

export type OnlinePresenceUser = {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string;
};

export type OnlinePresenceStats = {
  onlineNow: number;
  activeToday: number;
  activeYesterday: number;
  activeThisMonth: number;
  usersOnlineNow: OnlinePresenceUser[];
  usersActiveToday: OnlinePresenceUser[];
  usersActiveYesterday: OnlinePresenceUser[];
};

export const EMPTY_ONLINE_PRESENCE_STATS: OnlinePresenceStats = {
  onlineNow: 0,
  activeToday: 0,
  activeYesterday: 0,
  activeThisMonth: 0,
  usersOnlineNow: [],
  usersActiveToday: [],
  usersActiveYesterday: [],
};

const PRESENCE_LIST_LIMIT = 100;

function mapPresenceUsers(
  rows: Array<{
    id: string;
    email: string;
    name: string | null;
    lastSeenAt: Date | null;
  }>,
): OnlinePresenceUser[] {
  return rows
    .filter((r) => r.lastSeenAt)
    .map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      lastSeenAt: r.lastSeenAt!.toISOString(),
    }));
}

async function fetchPresenceUserList(whereExtra: SQL): Promise<OnlinePresenceUser[]> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      lastSeenAt: usersTable.lastSeenAt,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.isBanned, false),
        eq(usersTable.isAdmin, false),
        isNotNull(usersTable.lastSeenAt),
        whereExtra,
      ),
    )
    .orderBy(desc(usersTable.lastSeenAt))
    .limit(PRESENCE_LIST_LIMIT);

  return mapPresenceUsers(rows);
}

/** Admin dashboard — counts non-admin, non-banned users on public pages (UTC). Cached ~45s. */
export async function fetchOnlinePresenceStats(): Promise<OnlinePresenceStats> {
  const now = Date.now();
  if (statsCache && now - statsCache.at < STATS_CACHE_MS) {
    return statsCache.data;
  }

  try {
    const countsResult = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM users u
          WHERE u.is_banned = false AND u.is_admin = false
            AND u.last_seen_at >= NOW() - INTERVAL '5 minutes') AS online_now,
        (SELECT COUNT(*)::int FROM users u
          WHERE u.is_banned = false AND u.is_admin = false
            AND u.last_seen_at IS NOT NULL
            AND (u.last_seen_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date) AS active_today,
        (SELECT COUNT(*)::int FROM users u
          WHERE u.is_banned = false AND u.is_admin = false
            AND u.last_seen_at IS NOT NULL
            AND (u.last_seen_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day') AS active_yesterday,
        (SELECT COUNT(*)::int FROM users u
          WHERE u.is_banned = false AND u.is_admin = false
            AND u.last_seen_at IS NOT NULL
            AND (u.last_seen_at AT TIME ZONE 'UTC')::date >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')::date) AS active_this_month
    `);

    const countsRow = (countsResult.rows[0] ?? {}) as Record<string, unknown>;

    const [usersOnlineNow, usersActiveToday, usersActiveYesterday] = await Promise.all([
      fetchPresenceUserList(sql`${usersTable.lastSeenAt} >= NOW() - INTERVAL '5 minutes'`),
      fetchPresenceUserList(
        sql`(${usersTable.lastSeenAt} AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date`,
      ),
      fetchPresenceUserList(
        sql`(${usersTable.lastSeenAt} AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'`,
      ),
    ]);

    const result: OnlinePresenceStats = {
      onlineNow: Number(countsRow.online_now ?? 0),
      activeToday: Number(countsRow.active_today ?? 0),
      activeYesterday: Number(countsRow.active_yesterday ?? 0),
      activeThisMonth: Number(countsRow.active_this_month ?? 0),
      usersOnlineNow,
      usersActiveToday,
      usersActiveYesterday,
    };

    statsCache = { at: now, data: result };
    return result;
  } catch (err) {
    logger.warn({ err }, "online presence stats failed");
    return EMPTY_ONLINE_PRESENCE_STATS;
  }
}
