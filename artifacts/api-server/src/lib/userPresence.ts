import { db, usersTable } from "@workspace/db";
import { and, desc, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { logger } from "./logger.js";

const THROTTLE_MS = 60_000;
const MAX_THROTTLE_MAP = 2_000;
const STATS_CACHE_MS = 45_000;

export const PRESENCE_PAGE_SIZE = 10;

export type PresencePeriod = "now" | "today" | "yesterday";

/** In-process throttle — one DB write per user per ~60s (single Railway instance). */
const lastTouchAt = new Map<string, number>();

let countsCache: { at: number; data: OnlinePresenceCounts } | null = null;

function pruneThrottleMap(now: number): void {
  if (lastTouchAt.size <= MAX_THROTTLE_MAP) return;
  const cutoff = now - THROTTLE_MS * 2;
  for (const [id, touched] of lastTouchAt) {
    if (touched < cutoff) lastTouchAt.delete(id);
  }
}

/** Record signed-in customer activity. No-op when throttled. Never throws. */
export async function touchUserPresence(
  userId: string,
  opts?: { force?: boolean },
): Promise<void> {
  try {
    const now = Date.now();
    if (!opts?.force) {
      const prev = lastTouchAt.get(userId) ?? 0;
      if (now - prev < THROTTLE_MS) return;
    }
    lastTouchAt.set(userId, now);
    pruneThrottleMap(now);

    await db
      .update(usersTable)
      .set({ lastSeenAt: new Date() })
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

export type OnlinePresenceCounts = {
  onlineNow: number;
  activeToday: number;
  activeYesterday: number;
};

export const EMPTY_ONLINE_PRESENCE_COUNTS: OnlinePresenceCounts = {
  onlineNow: 0,
  activeToday: 0,
  activeYesterday: 0,
};

export type OnlinePresenceUsersPage = {
  users: OnlinePresenceUser[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

function periodWhere(period: PresencePeriod): SQL {
  if (period === "today") {
    return sql`(${usersTable.lastSeenAt} AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date`;
  }
  if (period === "yesterday") {
    return sql`(${usersTable.lastSeenAt} AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'`;
  }
  return sql`${usersTable.lastSeenAt} >= NOW() - INTERVAL '5 minutes'`;
}

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

async function countPresenceUsers(whereExtra: SQL): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.isBanned, false),
        eq(usersTable.isAdmin, false),
        isNotNull(usersTable.lastSeenAt),
        whereExtra,
      ),
    );
  return Number(row?.count ?? 0);
}

async function fetchPresenceUserList(
  whereExtra: SQL,
  page: number,
  pageSize: number,
): Promise<OnlinePresenceUser[]> {
  const offset = (Math.max(1, page) - 1) * pageSize;
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
    .limit(pageSize)
    .offset(offset);

  return mapPresenceUsers(rows);
}

/** Paginated user list — 10 per page, fetched on demand from admin UI. */
export async function fetchPresenceUsersPage(
  period: PresencePeriod,
  page: number,
): Promise<OnlinePresenceUsersPage> {
  const where = periodWhere(period);
  const total = await countPresenceUsers(where);
  const pageCount = Math.max(1, Math.ceil(total / PRESENCE_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const users = total > 0
    ? await fetchPresenceUserList(where, safePage, PRESENCE_PAGE_SIZE)
    : [];

  return {
    users,
    page: safePage,
    pageSize: PRESENCE_PAGE_SIZE,
    total,
    pageCount,
  };
}

/** Admin dashboard counts only (UTC). Cached ~45s — no user lists. */
export async function fetchOnlinePresenceStats(): Promise<OnlinePresenceCounts> {
  const now = Date.now();
  if (countsCache && now - countsCache.at < STATS_CACHE_MS) {
    return countsCache.data;
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
            AND (u.last_seen_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day') AS active_yesterday
    `);

    const countsRow = (countsResult.rows[0] ?? {}) as Record<string, unknown>;

    const result: OnlinePresenceCounts = {
      onlineNow: Number(countsRow.online_now ?? 0),
      activeToday: Number(countsRow.active_today ?? 0),
      activeYesterday: Number(countsRow.active_yesterday ?? 0),
    };

    countsCache = { at: now, data: result };
    return result;
  } catch (err) {
    logger.warn({ err }, "online presence stats failed");
    return EMPTY_ONLINE_PRESENCE_COUNTS;
  }
}
