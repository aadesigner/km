import { db, accessBlocksTable, loginAttemptsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { resolveRequestCountryCode } from "./geoCountry.js";
import { clientIpKey } from "./trustedClient.js";
import { normalizeBlockedCountry, normalizeBlockedIp } from "./accessBlockNormalize.js";

export type AccessBlockType = "ip" | "country";

export { normalizeBlockedCountry, normalizeBlockedIp } from "./accessBlockNormalize.js";

export type AccessBlockRow = {
  id: number;
  blockType: AccessBlockType;
  blockValue: string;
  reason: string | null;
  source: string;
  userId: string | null;
  createdBy: string | null;
  createdAt: Date;
  expiresAt: Date | null;
};

type BlockCache = {
  ips: Set<string>;
  countries: Set<string>;
  loadedAt: number;
};

const CACHE_TTL_MS = 15_000;
let cache: BlockCache | null = null;

function isActive(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

async function loadCache(): Promise<BlockCache> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache;

  const rows = await db
    .select({
      blockType: accessBlocksTable.blockType,
      blockValue: accessBlocksTable.blockValue,
      expiresAt: accessBlocksTable.expiresAt,
    })
    .from(accessBlocksTable);

  const ips = new Set<string>();
  const countries = new Set<string>();
  for (const row of rows) {
    if (!isActive(row.expiresAt)) continue;
    if (row.blockType === "ip") ips.add(row.blockValue);
    if (row.blockType === "country") countries.add(row.blockValue);
  }

  cache = { ips, countries, loadedAt: now };
  return cache;
}

export function invalidateAccessBlockCache(): void {
  cache = null;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const normalized = normalizeBlockedIp(ip);
  if (!normalized) return false;
  const { ips } = await loadCache();
  return ips.has(normalized);
}

export async function isCountryBlocked(countryCode: string | null): Promise<boolean> {
  if (!countryCode) return false;
  const { countries } = await loadCache();
  return countries.has(countryCode);
}

export type AccessBlockCheck = {
  blocked: boolean;
  reason?: "ip" | "country";
};

export async function checkAccessBlock(
  ip: string,
  countryCode: string | null,
): Promise<AccessBlockCheck> {
  if (await isIpBlocked(ip)) return { blocked: true, reason: "ip" };
  if (await isCountryBlocked(countryCode)) return { blocked: true, reason: "country" };
  return { blocked: false };
}

export async function listAccessBlocks(): Promise<AccessBlockRow[]> {
  const rows = await db
    .select()
    .from(accessBlocksTable)
    .orderBy(desc(accessBlocksTable.createdAt));

  return rows
    .filter((r) => isActive(r.expiresAt))
    .map((r) => ({
      id: r.id,
      blockType: r.blockType as AccessBlockType,
      blockValue: r.blockValue,
      reason: r.reason,
      source: r.source,
      userId: r.userId,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
    }));
}

export async function addIpBlock(opts: {
  ip: string;
  reason?: string | null;
  source?: string;
  userId?: string | null;
  createdBy?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeBlockedIp(opts.ip);
  if (!normalized) return { ok: false, error: "Invalid IP address" };

  await db
    .insert(accessBlocksTable)
    .values({
      blockType: "ip",
      blockValue: normalized,
      reason: opts.reason ?? null,
      source: opts.source ?? "manual",
      userId: opts.userId ?? null,
      createdBy: opts.createdBy ?? null,
    })
    .onConflictDoUpdate({
      target: [accessBlocksTable.blockType, accessBlocksTable.blockValue],
      set: {
        reason: opts.reason ?? null,
        source: opts.source ?? "manual",
        userId: opts.userId ?? null,
        createdBy: opts.createdBy ?? null,
        createdAt: new Date(),
        expiresAt: null,
      },
    });

  invalidateAccessBlockCache();
  return { ok: true };
}

export async function addCountryBlock(opts: {
  countryCode: string;
  reason?: string | null;
  createdBy?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeBlockedCountry(opts.countryCode);
  if (!code) return { ok: false, error: "Invalid country code (use ISO 3166-1 alpha-2, e.g. RU)" };

  await db
    .insert(accessBlocksTable)
    .values({
      blockType: "country",
      blockValue: code,
      reason: opts.reason ?? null,
      source: "manual",
      createdBy: opts.createdBy ?? null,
    })
    .onConflictDoUpdate({
      target: [accessBlocksTable.blockType, accessBlocksTable.blockValue],
      set: {
        reason: opts.reason ?? null,
        createdBy: opts.createdBy ?? null,
        createdAt: new Date(),
        expiresAt: null,
      },
    });

  invalidateAccessBlockCache();
  return { ok: true };
}

export async function removeAccessBlock(
  blockType: AccessBlockType,
  blockValue: string,
): Promise<boolean> {
  const value = blockType === "ip"
    ? normalizeBlockedIp(blockValue)
    : normalizeBlockedCountry(blockValue);
  if (!value) return false;

  const result = await db
    .delete(accessBlocksTable)
    .where(and(eq(accessBlocksTable.blockType, blockType), eq(accessBlocksTable.blockValue, value)));

  invalidateAccessBlockCache();
  return (result.rowCount ?? 0) > 0;
}

export async function removeUserBanIpBlocks(userId: string): Promise<number> {
  const result = await db
    .delete(accessBlocksTable)
    .where(and(eq(accessBlocksTable.source, "user_ban"), eq(accessBlocksTable.userId, userId)));

  invalidateAccessBlockCache();
  return result.rowCount ?? 0;
}

export async function getRecentIpsForEmail(email: string, max = 3): Promise<string[]> {
  const normalized = email.trim().toLowerCase();
  const rows = await db
    .select({ ip: loginAttemptsTable.ip })
    .from(loginAttemptsTable)
    .where(eq(loginAttemptsTable.email, normalized))
    .orderBy(desc(loginAttemptsTable.attemptedAt))
    .limit(25);

  const seen = new Set<string>();
  const ips: string[] = [];
  for (const row of rows) {
    const ip = normalizeBlockedIp(row.ip);
    if (!ip || seen.has(ip)) continue;
    seen.add(ip);
    ips.push(ip);
    if (ips.length >= max) break;
  }
  return ips;
}

export async function blockIpsForBannedUser(
  userId: string,
  email: string,
  adminId: string,
  reason?: string | null,
  lastLoginIp?: string | null,
): Promise<string[]> {
  const ipSet = new Set<string>();
  const fromLast = lastLoginIp ? normalizeBlockedIp(lastLoginIp) : null;
  if (fromLast) ipSet.add(fromLast);
  for (const ip of await getRecentIpsForEmail(email)) ipSet.add(ip);

  const blocked: string[] = [];
  for (const ip of ipSet) {
    const result = await addIpBlock({
      ip,
      reason: reason ?? "Auto-blocked when user account was banned",
      source: "user_ban",
      userId,
      createdBy: adminId,
    });
    if (result.ok) blocked.push(ip);
  }
  return blocked;
}

export function resolveBlockCountryFromRequest(req: import("express").Request): string | null {
  return resolveRequestCountryCode(req);
}

export function resolveBlockIpFromRequest(req: import("express").Request): string {
  return clientIpKey(req);
}
