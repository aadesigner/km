import { db, usersTable } from "@workspace/db";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

const THROTTLE_MS = 60_000;
const MAX_PATH_LEN = 180;
const MAX_THROTTLE_MAP = 5_000;

/** In-process throttle — one DB write per user per minute max (single Railway instance). */
const lastTouchAt = new Map<string, number>();

export function sanitizePresencePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let path = raw.trim();
  if (!path) return null;
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.split("?")[0]?.split("#")[0] ?? path;
  if (path.length > MAX_PATH_LEN) path = path.slice(0, MAX_PATH_LEN);
  return path;
}

function pruneThrottleMap(now: number): void {
  if (lastTouchAt.size <= MAX_THROTTLE_MAP) return;
  const cutoff = now - THROTTLE_MS * 2;
  for (const [id, touched] of lastTouchAt) {
    if (touched < cutoff) lastTouchAt.delete(id);
  }
}

/** Record signed-in user activity. No-op when throttled unless `force`. */
export async function touchUserPresence(
  userId: string,
  path?: string | null,
  opts?: { force?: boolean },
): Promise<void> {
  const now = Date.now();
  if (!opts?.force) {
    const prev = lastTouchAt.get(userId) ?? 0;
    if (now - prev < THROTTLE_MS) return;
  }
  lastTouchAt.set(userId, now);
  pruneThrottleMap(now);

  const cleanPath = sanitizePresencePath(path);
  await db
    .update(usersTable)
    .set({
      lastSeenAt: new Date(),
      ...(cleanPath !== null ? { lastSeenPath: cleanPath } : {}),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId));
}

export type OnlinePresenceUser = {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string;
  lastSeenPath: string | null;
};

export type OnlinePresenceStats = {
  onlineNow: number;
  activeToday: number;
  activeYesterday: number;
  activeThisMonth: number;
  usersOnlineNow: OnlinePresenceUser[];
};

/** Admin dashboard — counts non-admin, non-banned users by last_seen_at (UTC). */
export async function fetchOnlinePresenceStats(): Promise<OnlinePresenceStats> {
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

  const usersRows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      lastSeenAt: usersTable.lastSeenAt,
      lastSeenPath: usersTable.lastSeenPath,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.isBanned, false),
        eq(usersTable.isAdmin, false),
        isNotNull(usersTable.lastSeenAt),
        gte(usersTable.lastSeenAt, sql`NOW() - INTERVAL '5 minutes'`),
      ),
    )
    .orderBy(desc(usersTable.lastSeenAt))
    .limit(40);

  return {
    onlineNow: Number(countsRow.online_now ?? 0),
    activeToday: Number(countsRow.active_today ?? 0),
    activeYesterday: Number(countsRow.active_yesterday ?? 0),
    activeThisMonth: Number(countsRow.active_this_month ?? 0),
    usersOnlineNow: usersRows
      .filter((r) => r.lastSeenAt)
      .map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        lastSeenAt: r.lastSeenAt!.toISOString(),
        lastSeenPath: r.lastSeenPath,
      })),
  };
}
