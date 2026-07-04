import { db, vinLookupsTable, vinCatalogTable, paymentsTable, providersTable } from "@workspace/db";
import type { VinCatalog } from "@workspace/db";
import { eq, desc, and, or, ne, inArray } from "drizzle-orm";
import { logger } from "./logger";
import {
  inferAccidentSeverityFromLossAmount,
} from "@workspace/accident-severity";
import {
  applyFrozenKrwPerUsd,
  getCurrentKrwPerUsd,
  readFrozenKrwPerUsd,
} from "./krwRate.js";
import { sanitizeCatalogPayload, catalogHasDeliverableReport } from "./vinCatalogImport.js";
import { mediaVersionFromUpdatedAt, extractVinPhotoUrls, invalidateVinImageCache } from "./vinImageCache.js";
import { removeVinFromSitemaps } from "./sitemapMaintenance.js";
import { assertValidProviderBaseUrl } from "./providerUrl.js";
import { withGlobalVinProviderLock } from "./vinProviderMutex.js";
import {
  providerCalendarLabelToIso,
  repairEncarMisParsedIsoDate,
  sanitizeReportIsoDate,
} from "./encar-date-repair.js";
import {
  accidentDedupeKey,
  dedupeAccidents,
  dedupeAuctionHistory,
  dedupeInsuranceClaims,
  dedupeMileageHistory,
  dedupeOwnerHistory,
  dedupeRegistryHistory,
  ownerHistoryDedupeKey,
  registryHistoryDedupeKey,
} from "./history-dedupe.js";
import { parseKmFromText, resolveLatestOdometerKm } from "@workspace/odometer-resolve";
import {
  normalizeKrwAmountText,
  parseKrwAmountFromText,
  REGISTRY_TYPES_WITHOUT_MILEAGE,
  sanitizeKoreanRepairAmountText,
  sanitizeKoreanRepairKrwAmount,
  isRegistryRepairCostLabel,
  formatKoreanListPriceAmountText,
  resolveRegistryDisplayAmount,
  stripRegistrySubtitleNoise,
  isEncarMileageTypoLine,
  sanitizeRegistryLocation,
} from "@workspace/korean-registry";

export { parseKmFromText, resolveLatestOdometerKm } from "@workspace/odometer-resolve";

export { repairEncarMisParsedIsoDate, sanitizeReportIsoDate } from "./encar-date-repair.js";
export {
  accidentDedupeKey,
  dedupeAccidents,
  dedupeOwnerHistory,
  ownerHistoryDedupeKey,
  registryHistoryDedupeKey as registryEventDedupeKey,
} from "./history-dedupe.js";

export function dedupeRegistryHistoryEvents(
  events: RegistryHistoryEvent[],
): RegistryHistoryEvent[] {
  return dedupeRegistryHistory(events);
}

export interface NormalizedVinData {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  trim?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  bodyType?: string | null;
  color?: string | null;
  country?: string | null;
  odometer?: number | null;
  accidentCount?: number | null;
  ownerCount?: number | null;
  hp?: number | null;
  cylinders?: number | null;
  isSalvage?: boolean | null;
  isStolen?: boolean | null;
  photos?: string[];
  accidents?: Array<{
    date?: string | null;
    severity?: string | null;
    description?: string | null;
    country?: string | null;
    type?: string | null;
    primaryDamage?: string | null;
    secondaryDamage?: string | null;
    airbagDeployed?: boolean | null;
    odometerAtLoss?: number | null;
    lossAmount?: number | null;
  }>;
  /** Korean / regional insurance payout history — not the same as collision accidents. */
  insuranceClaims?: Array<{
    date?: string | null;
    type?: string | null;
    lossAmount?: number | null;
    partCost?: number | null;
    laborCost?: number | null;
    paintingCost?: number | null;
    description?: string | null;
  }>;
    mileageHistory?: Array<{
    date?: string | null;
    odometer?: number | null;
    unit?: string | null;
    source?: "na_auction" | "listing" | null;
    condition?: string | null;
    damage?: string | null;
    primaryDamage?: string | null;
    secondaryDamage?: string | null;
    auctionPrice?: number | null;
    lotStatus?: string | null;
    titleStatus?: string | null;
  }>;
  ownerHistory?: Array<{
    date?: string | null;
    location?: string | null;
    mileage?: number | null;
    auctionPrice?: number | null;
    lotStatus?: string | null;
    condition?: string | null;
  }>;
  marketData?: {
    estimatedValue?: number | null;
    currency?: string | null;
    lastAuctionPrice?: number | null;
    lastAuctionDate?: string | null;
  };
  auctionHistory?: Array<{
    date?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    condition?: string | null;
    damage?: string | null;
    primaryDamage?: string | null;
    secondaryDamage?: string | null;
    titleStatus?: string | null;
    openingBid?: number | null;
    buyNowPrice?: number | null;
    finalPrice?: number | null;
    lotStatus?: string | null;
  }>;
  titleStatus?: string | null;
  /** Korean KOTSA / Encar registry timeline from details.history. */
  registryHistory?: Array<{
    date?: string | null;
    type?: string | null;
    title?: string | null;
    subtitle?: string | null;
    mileage?: number | null;
    amount?: string | null;
    location?: string | null;
    details?: Array<{ label: string; value: string }>;
  }>;
}

export async function getCatalogVin(vin: string): Promise<VinCatalog | null> {
  const rows = await db
    .select()
    .from(vinCatalogTable)
    .where(eq(vinCatalogTable.vin, vin.toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertVinCatalog(
  vin: string,
  providerName: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  const existing = await getCatalogVin(vin);
  const existingRate = readFrozenKrwPerUsd(
    (existing?.data as Record<string, unknown> | null) ?? null,
  );
  const currentRate = await getCurrentKrwPerUsd();
  const cleaned = sanitizeCatalogPayload(data);
  const stamped = applyFrozenKrwPerUsd(cleaned, { existingRate, currentRate });

  await db
    .insert(vinCatalogTable)
    .values({ vin: vin.toUpperCase(), providerName, data: stamped, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: vinCatalogTable.vin,
      set: { data: stamped, providerName, updatedAt: new Date() },
    });
}

/** Prefer the report payload with richer timeline data (registry, claims, mileage). */
export function vinReportDataRichnessScore(data: Record<string, unknown> | null | undefined): number {
  if (!data) return 0;
  let score = 0;
  const registry = data.registryHistory;
  if (Array.isArray(registry)) score += registry.length * 1000;
  const claims = data.insuranceClaims;
  if (Array.isArray(claims)) score += claims.length * 100;
  const mileage = data.mileageHistory;
  if (Array.isArray(mileage)) score += mileage.length * 10;
  const accidents = data.accidents;
  if (Array.isArray(accidents)) score += accidents.length;
  return score;
}

export const MAX_VIN_PHOTOS = 24;

/** Merge unique photo URLs from multiple report payloads (catalog vs lookup). */
export function mergeVinPhotoLists(
  ...sources: Array<unknown[] | null | undefined>
): string[] {
  const sorted = [...sources].sort((a, b) => {
    const al = Array.isArray(a) ? a.length : 0;
    const bl = Array.isArray(b) ? b.length : 0;
    return bl - al;
  });

  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of sorted) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== "string") continue;
      const url = item.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
      if (out.length >= MAX_VIN_PHOTOS) return out;
    }
  }
  return out;
}

function readOdometerScalar(data: Record<string, unknown> | null | undefined): number | null {
  if (!data) return null;
  const raw = data.odometer ?? data.mileage;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeMileageHistoryEntry(entry: unknown): Record<string, unknown> | null {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const e = entry as Record<string, unknown>;
  const raw = e.odometer ?? e.mileage;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return { ...e, odometer: n };
}

function mergeMileageHistoryArrays(...sources: unknown[]): unknown[] {
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const raw of src) {
      const entry = normalizeMileageHistoryEntry(raw);
      if (!entry) continue;
      const key = `${String(entry.date ?? "")}|${entry.odometer}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(entry);
    }
  }
  return merged;
}

function concatUniqueArrays(...sources: unknown[]): unknown[] {
  const merged: unknown[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const item of src) {
      const key = JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

/**
 * Blend catalog + lookup so admin edits on either side always surface on the VIN page.
 */
export function mergeVinReportBodies(
  ...bodies: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> | null {
  const valid = bodies.filter((b): b is Record<string, unknown> => !!b && typeof b === "object");
  if (valid.length === 0) return null;

  let result: Record<string, unknown> = { ...valid[0] };
  for (let i = 1; i < valid.length; i++) {
    result = { ...result, ...valid[i] };
  }

  const lockedBody = [...valid].reverse().find((b) => b.odometerLocked === true);
  const odometers = valid.map(readOdometerScalar);
  const mileageHistory = lockedBody && Array.isArray(lockedBody.mileageHistory)
    ? lockedBody.mileageHistory
    : mergeMileageHistoryArrays(...valid.map((b) => b.mileageHistory));
  const odometer = lockedBody
    ? readOdometerScalar(lockedBody)
    : [...odometers].reverse().find((n) => n != null) ?? null;

  const photos = mergeVinPhotoLists(
    ...valid.map((b) => b.photos as string[] | undefined),
  );

  const frozenRate =
    valid.map((b) => readFrozenKrwPerUsd(b)).find((r) => r != null)
    ?? readFrozenKrwPerUsd(result);

  return {
    ...result,
    ...(odometer != null ? { odometer, mileage: odometer } : {}),
    ...(lockedBody ? { odometerLocked: true } : {}),
    mileageHistory,
    ownerHistory: concatUniqueArrays(...valid.map((b) => b.ownerHistory)),
    accidents: concatUniqueArrays(...valid.map((b) => b.accidents)),
    insuranceClaims: concatUniqueArrays(...valid.map((b) => b.insuranceClaims)),
    registryHistory: concatUniqueArrays(...valid.map((b) => b.registryHistory)),
    auctionHistory: concatUniqueArrays(...valid.map((b) => b.auctionHistory)),
    ...(photos.length > 0 ? { photos } : {}),
    ...(frozenRate != null ? { krwPerUsd: frozenRate } : {}),
  };
}

export function pickRicherVinReportData(
  catalogData: Record<string, unknown> | null | undefined,
  lookupData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!catalogData && !lookupData) return null;
  if (!catalogData) return lookupData!;
  if (!lookupData) return catalogData;
  const catalogScore = vinReportDataRichnessScore(catalogData);
  const lookupScore = vinReportDataRichnessScore(lookupData);
  const picked = lookupScore !== catalogScore
    ? (lookupScore > catalogScore ? lookupData : catalogData)
    : catalogData;

  const mergedPhotos = mergeVinPhotoLists(
    lookupData.photos as string[] | undefined,
    catalogData.photos as string[] | undefined,
  );

  const frozenRate =
    readFrozenKrwPerUsd(picked)
    ?? readFrozenKrwPerUsd(catalogData)
    ?? readFrozenKrwPerUsd(lookupData);

  const result: Record<string, unknown> = {
    ...picked,
    ...(mergedPhotos.length > 0 ? { photos: mergedPhotos } : {}),
    ...(frozenRate != null && readFrozenKrwPerUsd(picked) == null ? { krwPerUsd: frozenRate } : {}),
  };

  return result;
}

/**
 * Pick report body for API serve — merges catalog + lookup so admin mileage
 * edits on either record always appear on the VIN page.
 */
export function pickVinReportDataForServe(
  catalogData: Record<string, unknown> | null | undefined,
  catalogUpdatedAt: Date | null | undefined,
  lookupData: Record<string, unknown> | null | undefined,
  lookupUpdatedAt: Date | null | undefined,
): Record<string, unknown> | null {
  if (!catalogData && !lookupData) return null;
  if (!catalogData) return lookupData!;
  if (!lookupData) return catalogData;

  const catalogMs = catalogUpdatedAt?.getTime() ?? 0;
  const lookupMs = lookupUpdatedAt?.getTime() ?? 0;

  // Newer body overlays older; merge always takes max odometer + union histories.
  if (lookupMs >= catalogMs) {
    return mergeVinReportBodies(catalogData, lookupData);
  }
  return mergeVinReportBodies(lookupData, catalogData);
}

/** Merge catalog with the viewer's lookup — do not blend other users' snapshots. */
export async function enrichVinReportDataForServe(
  vin: string,
  primaryData: Record<string, unknown> | null | undefined,
  opts?: { primaryUpdatedAt?: Date | null },
): Promise<Record<string, unknown> | null> {
  if (!primaryData) return null;

  const normalizedVin = vin.toUpperCase();
  const catalogEntry = await getCatalogVin(normalizedVin);
  const catalogData = (catalogEntry?.data as Record<string, unknown> | null) ?? null;
  const catalogUpdatedAt = catalogEntry?.updatedAt ?? null;
  const primaryUpdatedAt = opts?.primaryUpdatedAt ?? null;

  return pickVinReportDataForServe(
    catalogData,
    catalogUpdatedAt,
    primaryData,
    primaryUpdatedAt,
  ) ?? primaryData;
}

/** Push stamped catalog report data to every lookup row for a VIN (admin save / publish). */
export async function syncStampedCatalogToAllLookups(
  vin: string,
  stamped: Record<string, unknown>,
  updatedAt: Date,
  opts?: { promoteLookupIds?: number[]; promoteAllPendingManual?: boolean },
): Promise<void> {
  const normalizedVin = vin.trim().toUpperCase();
  const currentRate = readFrozenKrwPerUsd(stamped) ?? await getCurrentKrwPerUsd();
  const promoteSet = new Set(opts?.promoteLookupIds ?? []);
  const lookups = await db
    .select()
    .from(vinLookupsTable)
    .where(eq(vinLookupsTable.vin, normalizedVin));

  await Promise.all(lookups.map((lookup) => {
    const lookupData = (lookup.data ?? {}) as Record<string, unknown>;
    const lookupPayload = applyFrozenKrwPerUsd(stamped, {
      existingRate: readFrozenKrwPerUsd(lookupData),
      currentRate,
    });
    const patch: {
      data: Record<string, unknown>;
      updatedAt: Date;
      status?: string;
      providerName?: string;
      fromCache?: boolean;
    } = { data: lookupPayload, updatedAt };
    if (
      promoteSet.has(lookup.id)
      || (opts?.promoteAllPendingManual && lookup.status === "pending_manual")
    ) {
      patch.status = "complete";
      patch.providerName = "admin";
      patch.fromCache = true;
    }
    return db.update(vinLookupsTable).set(patch).where(eq(vinLookupsTable.id, lookup.id));
  }));
}

/** Revoke every client lookup + completed payment for a VIN (catalog removal). */
export async function revokeAllClientAccessForVin(vin: string): Promise<{
  lookupsRevoked: number;
  paymentsRevoked: number;
}> {
  const normalizedVin = vin.trim().toUpperCase();
  const now = new Date();

  const lookupRows = await db
    .update(vinLookupsTable)
    .set({ status: "revoked", data: null, updatedAt: now })
    .where(and(eq(vinLookupsTable.vin, normalizedVin), ne(vinLookupsTable.status, "revoked")))
    .returning({ id: vinLookupsTable.id });

  const paymentRows = await db
    .update(paymentsTable)
    .set({ status: "revoked", updatedAt: now })
    .where(and(eq(paymentsTable.vin, normalizedVin), eq(paymentsTable.status, "completed")))
    .returning({ id: paymentsTable.id });

  return { lookupsRevoked: lookupRows.length, paymentsRevoked: paymentRows.length };
}

/** Batch revoke for many VINs (catalog bulk delete). */
export async function revokeAllClientAccessForVins(vins: string[]): Promise<{
  lookupsRevoked: number;
  paymentsRevoked: number;
}> {
  const normalized = [...new Set(vins.map((v) => v.trim().toUpperCase()).filter(Boolean))];
  if (normalized.length === 0) return { lookupsRevoked: 0, paymentsRevoked: 0 };

  const now = new Date();
  const lookupRows = await db
    .update(vinLookupsTable)
    .set({ status: "revoked", data: null, updatedAt: now })
    .where(and(inArray(vinLookupsTable.vin, normalized), ne(vinLookupsTable.status, "revoked")))
    .returning({ id: vinLookupsTable.id });

  const paymentRows = await db
    .update(paymentsTable)
    .set({ status: "revoked", updatedAt: now })
    .where(and(inArray(paymentsTable.vin, normalized), eq(paymentsTable.status, "completed")))
    .returning({ id: paymentsTable.id });

  return { lookupsRevoked: lookupRows.length, paymentsRevoked: paymentRows.length };
}

/** Full site wipe when a VIN leaves the catalog — revoke clients, drop stored data, sitemap + image cache. */
export async function wipeRemovedCatalogVin(
  vin: string,
  catalogData?: unknown,
): Promise<{
  lookupsRevoked: number;
  paymentsRevoked: number;
  sitemapUpdated: boolean;
}> {
  const normalized = vin.trim().toUpperCase();
  const lookupRows = await db
    .select({ data: vinLookupsTable.data })
    .from(vinLookupsTable)
    .where(eq(vinLookupsTable.vin, normalized));

  const photoUrls = [
    ...extractVinPhotoUrls(catalogData),
    ...lookupRows.flatMap((row) => extractVinPhotoUrls(row.data)),
  ];

  const revoked = await revokeAllClientAccessForVin(normalized);
  await invalidateVinImageCache(photoUrls);
  const sitemapUpdated = removeVinFromSitemaps(normalized);

  return { ...revoked, sitemapUpdated };
}

/** Batch wipe for catalog bulk delete. */
export async function wipeRemovedCatalogVins(
  entries: Array<{ vin: string; data?: unknown }>,
): Promise<{
  lookupsRevoked: number;
  paymentsRevoked: number;
  sitemapsUpdated: number;
}> {
  let lookupsRevoked = 0;
  let paymentsRevoked = 0;
  let sitemapsUpdated = 0;
  for (const entry of entries) {
    const result = await wipeRemovedCatalogVin(entry.vin, entry.data);
    lookupsRevoked += result.lookupsRevoked;
    paymentsRevoked += result.paymentsRevoked;
    if (result.sitemapUpdated) sitemapsUpdated += 1;
  }
  return { lookupsRevoked, paymentsRevoked, sitemapsUpdated };
}

export type VinReportServeBundle = {
  dataSource: Record<string, unknown>;
  providerName: string | null;
  inCatalog: boolean;
  mediaVersion?: number;
};

/** Catalog entry only — public previews and SEO must not leak removed VINs via orphaned lookups. */
export async function vinHasReportData(vin: string): Promise<VinReportServeBundle | null> {
  const normalized = vin.trim().toUpperCase();
  const catalogEntry = await getCatalogVin(normalized);
  const catalogData = (catalogEntry?.data as Record<string, unknown> | null) ?? null;
  if (!catalogData) return null;

  const dataSource = await enrichVinReportDataForServe(normalized, catalogData, {
    primaryUpdatedAt: catalogEntry?.updatedAt,
  });
  if (!dataSource) return null;

  return {
    dataSource,
    providerName: catalogEntry.providerName ?? null,
    inCatalog: true,
    mediaVersion: mediaVersionFromUpdatedAt(catalogEntry.updatedAt),
  };
}

/**
 * Resolve report payload for a viewer — signed-in user's own lookup when catalog
 * preview is missing (admin assign, pending_manual); otherwise catalog preview only.
 */
export async function resolveVinReportForViewer(
  vin: string,
  userId?: string | null,
): Promise<VinReportServeBundle | null> {
  const normalized = vin.trim().toUpperCase();

  if (userId) {
    const [owned] = await db
      .select()
      .from(vinLookupsTable)
      .where(and(
        eq(vinLookupsTable.userId, userId),
        eq(vinLookupsTable.vin, normalized),
        or(
          eq(vinLookupsTable.status, "complete"),
          eq(vinLookupsTable.status, "pending_manual"),
        ),
      ))
      .orderBy(desc(vinLookupsTable.updatedAt), desc(vinLookupsTable.createdAt))
      .limit(1);

    const ownedData = (owned?.data as Record<string, unknown> | null) ?? null;
    if (owned?.data && ownedData) {
      const dataSource = await enrichVinReportDataForServe(normalized, ownedData, {
        primaryUpdatedAt: owned.updatedAt,
      });
      if (dataSource) {
        const catalogEntry = await getCatalogVin(normalized);
        return {
          dataSource,
          providerName: owned.providerName ?? catalogEntry?.providerName ?? null,
          inCatalog: !!catalogEntry?.data,
          mediaVersion: mediaVersionFromUpdatedAt(owned.updatedAt),
        };
      }
    }
  }

  return vinHasReportData(vin);
}

/**
 * Korean Encar reports cached before registry extraction often have insurance/owners
 * but an empty registryHistory — treat as stale so we re-fetch from the provider.
 */
export function isStaleKoreanReport(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;
  const country = String(data.country ?? "").toLowerCase();
  if (country !== "kr") return false;
  const registry = data.registryHistory;
  const registryLen = Array.isArray(registry) ? registry.length : 0;
  const claims = data.insuranceClaims;
  const claimsLen = Array.isArray(claims) ? claims.length : 0;
  const ownerCount = Number(data.ownerCount ?? data.owners ?? 0);

  if (registryLen > 0) {
    const photoLen = Array.isArray(data.photos) ? data.photos.length : 0;
    // Carstat often caches 2 webp previews while the full Encar gallery exists upstream.
    if (photoLen > 0 && photoLen < 8) return true;

    const expectedMin = claimsLen + (ownerCount > 1 ? 2 : 0) + 2;
    if (claimsLen >= 2 && registryLen < Math.min(expectedMin, 10)) return true;
    return false;
  }

  if (claimsLen > 0) return true;
  if (ownerCount > 1) return true;
  const ownerHistory = data.ownerHistory;
  if (Array.isArray(ownerHistory) && ownerHistory.length > 1) return true;
  return false;
}

export async function getCachedVin(vin: string) {
  const results = await db
    .select()
    .from(vinLookupsTable)
    .where(eq(vinLookupsTable.vin, vin.toUpperCase()))
    .orderBy(desc(vinLookupsTable.updatedAt), desc(vinLookupsTable.createdAt))
    .limit(1);
  const row = results[0] ?? null;
  if (!row) return null;

  // Legacy rows may lack data_corrupt — fall back to JSON probe once, then flag in DB.
  const rowRecord = row as typeof row & { dataCorrupt?: boolean | null };
  if (rowRecord.dataCorrupt === true) {
    logger.warn({ vin }, "Cached VIN marked data_corrupt; treating as cache miss");
    return null;
  }

  const serialized = JSON.stringify(row.data);
  if (serialized.includes("[object Object]")) {
    logger.warn({ vin }, "Stale cached VIN result contains [object Object]; marking data_corrupt");
    await db.update(vinLookupsTable)
      .set({ dataCorrupt: true, updatedAt: new Date() })
      .where(eq(vinLookupsTable.id, row.id))
      .catch((err) => logger.warn({ err, vin }, "Failed to mark data_corrupt on vin lookup"));
    return null;
  }

  return row;
}

export type GrantVinReportResult =
  | { status: "created"; lookupId: number; fromCache: boolean; vin: string }
  | { status: "already_exists"; lookupId: number; vin: string };

/** Grant a user a complete VIN report — catalog/cache first, provider fetch only when needed. */
export async function grantVinReportToUser(
  userId: string,
  vin: string,
  options?: { adminId?: string },
): Promise<GrantVinReportResult> {
  const normalizedVin = vin.trim().toUpperCase();
  if (normalizedVin.length !== 17) {
    throw Object.assign(new Error("Valid 17-character VIN is required"), { code: "INVALID_VIN" });
  }

  const [existing] = await db.select({ id: vinLookupsTable.id })
    .from(vinLookupsTable)
    .where(and(
      eq(vinLookupsTable.userId, userId),
      eq(vinLookupsTable.vin, normalizedVin),
      eq(vinLookupsTable.status, "complete"),
    ))
    .limit(1);

  if (existing) {
    return { status: "already_exists", lookupId: existing.id, vin: normalizedVin };
  }

  const catalogEntry = await getCatalogVin(normalizedVin);
  const catalogData = (catalogEntry?.data as Record<string, unknown> | null) ?? null;
  if (catalogEntry && catalogData && !isStaleKoreanReport(catalogData)) {
    const currentRate = await getCurrentKrwPerUsd();
    const stamped = applyFrozenKrwPerUsd(catalogData, {
      existingRate: readFrozenKrwPerUsd(catalogData),
      currentRate,
    });
    const [lookup] = await db.insert(vinLookupsTable).values({
      vin: normalizedVin,
      userId,
      status: "complete",
      data: stamped,
      providerName: catalogEntry.providerName,
      fromCache: true,
      paymentId: null,
    }).returning();
    logger.info({ msg: "admin_grant_vin", source: "catalog", vin: normalizedVin, userId, lookupId: lookup.id });
    return { status: "created", lookupId: lookup.id, fromCache: true, vin: normalizedVin };
  }

  const cached = await getCachedVin(normalizedVin);
  const cachedPayload = (cached?.data as Record<string, unknown> | null) ?? null;
  if (cached?.status === "complete" && cachedPayload && !isStaleKoreanReport(cachedPayload)) {
    const currentRate = await getCurrentKrwPerUsd();
    const stamped = applyFrozenKrwPerUsd(cachedPayload, {
      existingRate: readFrozenKrwPerUsd(cachedPayload),
      currentRate,
    });
    const [lookup] = await db.transaction(async (tx) => {
      await upsertVinCatalog(normalizedVin, cached.providerName, stamped);
      return tx.insert(vinLookupsTable).values({
        vin: normalizedVin,
        userId,
        status: "complete",
        data: stamped,
        providerName: cached.providerName,
        fromCache: true,
        paymentId: null,
      }).returning();
    });
    logger.info({ msg: "admin_grant_vin", source: "lookup_cache", vin: normalizedVin, userId, lookupId: lookup.id });
    return { status: "created", lookupId: lookup.id, fromCache: true, vin: normalizedVin };
  }

  const providers = await db.select().from(providersTable).where(eq(providersTable.isActive, true)).limit(1);
  const provider = providers[0];
  if (!provider?.apiKey?.trim()) {
    throw Object.assign(new Error("No active VIN provider configured"), { code: "NO_PROVIDER" });
  }

  if (options?.adminId) {
    const { consumeAdminProviderAction, adminProviderRateLimitMessage } = await import("./adminProviderRateLimit.js");
    if (!consumeAdminProviderAction(options.adminId)) {
      throw Object.assign(new Error(adminProviderRateLimitMessage()), { code: "PROVIDER_RATE_LIMIT" });
    }
  }

  const data = await fetchFromProvider(normalizedVin, provider.baseUrl, provider.apiKey);
  const currentRate = await getCurrentKrwPerUsd();
  const stamped = applyFrozenKrwPerUsd(data as unknown as Record<string, unknown>, { currentRate });
  const [lookup] = await db.transaction(async (tx) => {
    await upsertVinCatalog(normalizedVin, provider.name, stamped);
    return tx.insert(vinLookupsTable).values({
      vin: normalizedVin,
      userId,
      status: "complete",
      data: stamped,
      providerName: provider.name,
      fromCache: false,
      paymentId: null,
    }).returning();
  });
  logger.info({ msg: "admin_grant_vin", source: "provider", vin: normalizedVin, userId, lookupId: lookup.id });
  return { status: "created", lookupId: lookup.id, fromCache: false, vin: normalizedVin };
}

function providerHeaders(apiKey: string) {
  return { Accept: "application/json", "x-api-key": apiKey };
}

/** Carstat VIN history API lives on carstat.dev (not api.carstat.dev). */
function normalizeProviderBaseUrl(baseUrl: string): string {
  const validated = assertValidProviderBaseUrl(baseUrl);
  return validated.replace(/\/$/, "").replace("://api.carstat.dev", "://carstat.dev");
}

/** Laravel 404 when /api/local-* route is missing on the provider host. */
function isDeprecatedRoute404(status: number, text: string): boolean {
  return status === 404 && /could not be found/i.test(text);
}

function localExistsUrl(base: string, vin: string): string {
  return `${base}/api/local-exists/${encodeURIComponent(vin)}`;
}

function localReportUrl(base: string, vin: string): string {
  return `${base}/api/local-report/${encodeURIComponent(vin)}`;
}

export type LocalExistsResult =
  | { status: "exists" }
  | { status: "not_found" }
  | { status: "no_access"; hint?: string }
  | { status: "unavailable"; reason: string };

function parseProviderReportError(status: number, text: string): LocalExistsResult | null {
  if (status === 403) {
    try {
      const body = JSON.parse(text) as { error?: string; balance?: number };
      if (/balance/i.test(body.error ?? text)) {
        return { status: "unavailable", reason: "Provider account balance is insufficient. Contact support." };
      }
    } catch { /* fall through */ }
    return { status: "unavailable", reason: "Provider access denied — check API key and subscription." };
  }

  if (status === 404) {
    try {
      const body = JSON.parse(text) as { error?: string; hint?: string };
      if (/empty lots/i.test(body.hint ?? "")) {
        return { status: "no_access", hint: body.hint ?? undefined };
      }
      if (body.error === "vin not found") {
        return { status: "not_found" };
      }
    } catch { /* fall through */ }
    return { status: "not_found" };
  }

  return null;
}

/** Post-payment only — fetches the paid report and costs provider tokens. Never call before payment. */
async function checkLocalReportAvailable(
  vin: string,
  base: string,
  apiKey: string,
): Promise<LocalExistsResult> {
  const url = localReportUrl(base, vin);
  const headers = providerHeaders(apiKey);

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    const text = await res.text();

    if (res.ok) {
      logger.info({ msg: "local_report_ok", vin, base });
      return { status: "exists" };
    }

    if (isDeprecatedRoute404(res.status, text)) {
      return {
        status: "unavailable",
        reason: "Provider local-report endpoint is not available. Verify the base URL is https://carstat.dev.",
      };
    }

    const parsed = parseProviderReportError(res.status, text);
    if (parsed) {
      if (parsed.status === "no_access") {
        logger.info({ msg: "local_report_no_lots_for_key", vin, hint: parsed.hint });
      }
      return parsed;
    }

    logger.warn({ msg: "local_report_error", vin, status: res.status, body: text.slice(0, 120) });
    return { status: "unavailable", reason: `Provider report check failed (HTTP ${res.status}).` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ msg: "local_report_fetch_failed", vin, err: msg });
    return { status: "unavailable", reason: "Could not reach the VIN data provider." };
  }
}

/** Admin/diagnostic only — probes local-exists then local-report (costs tokens). Not used at checkout. */
export async function checkVinDeliverable(
  vin: string,
  providerBaseUrl: string,
  apiKey: string,
): Promise<LocalExistsResult> {
  const exists = await checkLocalExists(vin, providerBaseUrl, apiKey);
  if (exists.status !== "exists") return exists;

  const base = normalizeProviderBaseUrl(providerBaseUrl);
  return checkLocalReportAvailable(vin, base, apiKey);
}

function parseLocalExistsBody(body: unknown): boolean | null {
  if (body == null || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const raw = record.exists ?? record.available ?? record.found;
  if (raw === true || raw === 1 || raw === "true" || raw === "1") return true;
  if (raw === false || raw === 0 || raw === "false" || raw === "0") return false;
  return null;
}

/** Strict pre-payment gate — local-exists only, no fail-open. */
export async function checkLocalExists(
  vin: string,
  providerBaseUrl: string,
  apiKey: string,
): Promise<LocalExistsResult> {
  const base = normalizeProviderBaseUrl(providerBaseUrl);
  const url = localExistsUrl(base, vin);
  const headers = providerHeaders(apiKey);

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    const text = await res.text();

    if (res.ok) {
      try {
        const body = JSON.parse(text) as unknown;
        const exists = parseLocalExistsBody(body);
        if (exists === true) {
          logger.info({ msg: "local_exists_ok", vin, base });
          return { status: "exists" };
        }
        if (exists === false) {
          logger.info({ msg: "local_exists_false", vin });
          return { status: "not_found" };
        }
        logger.warn({ msg: "local_exists_unexpected_body", vin, body: text.slice(0, 120) });
        return { status: "unavailable", reason: "Provider returned an unexpected response." };
      } catch {
        logger.warn({ msg: "local_exists_bad_json", vin, status: res.status, body: text.slice(0, 120) });
        return { status: "unavailable", reason: "Provider returned an invalid response." };
      }
    }

    if (isDeprecatedRoute404(res.status, text)) {
      logger.warn({ msg: "local_exists_route_missing", vin, base, hint: "Use https://carstat.dev as provider base URL" });
      return {
        status: "unavailable",
        reason: "Provider local-exists endpoint is not available. Verify the base URL is https://carstat.dev.",
      };
    }

    if (res.status === 404) {
      return { status: "not_found" };
    }

    logger.warn({ msg: "local_exists_error", vin, status: res.status, body: text.slice(0, 120) });
    return {
      status: "unavailable",
      reason: res.status === 403
        ? "Provider access denied — check API key and subscription."
        : `Provider check failed (HTTP ${res.status}).`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ msg: "local_exists_fetch_failed", vin, err: msg });
    return { status: "unavailable", reason: "Could not reach the VIN data provider." };
  }
}

async function fetchLocalReport(
  vin: string,
  base: string,
  apiKey: string,
): Promise<Record<string, unknown>> {
  const url = localReportUrl(base, vin);
  const headers = providerHeaders(apiKey);
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  const text = await res.text();

  if (res.ok) {
    const body = JSON.parse(text) as Record<string, unknown>;
    if (body.error) {
      throw new Error("No vehicle history data found for this VIN in our database.");
    }
    return body;
  }

  if (isDeprecatedRoute404(res.status, text)) {
    throw new Error("Provider local-report endpoint is not available. Verify the base URL is https://carstat.dev.");
  }

  const parsed = parseProviderReportError(res.status, text);
  if (parsed?.status === "no_access") {
    throw new Error("No vehicle history data is available for this VIN with the current provider subscription.");
  }
  if (parsed?.status === "not_found") {
    throw new Error("No vehicle history data found for this VIN in our database.");
  }
  if (parsed?.status === "unavailable") {
    throw new Error(parsed.reason);
  }

  throw new Error(`Provider returned ${res.status}: ${text.slice(0, 200)}`);
}

export async function fetchFromProvider(
  vin: string,
  providerBaseUrl: string,
  apiKey: string,
  opts?: { force?: boolean },
): Promise<NormalizedVinData> {
  const normalized = vin.trim().toUpperCase();
  return withGlobalVinProviderLock(normalized, async () => {
    // `force` (admin "Refresh from provider") always calls the provider and bypasses
    // the catalog cache, so a partial/stale catalog row can be fully repaired.
    if (!opts?.force) {
      const catalogEntry = await getCatalogVin(normalized);
      const catalogData = (catalogEntry?.data as Record<string, unknown> | null) ?? null;
      if (catalogEntry && catalogData && catalogHasDeliverableReport(catalogData) && !isStaleKoreanReport(catalogData)) {
        return normalizeCarstatResponse(catalogData);
      }
    }

    const base = normalizeProviderBaseUrl(providerBaseUrl);

    try {
      const body = await fetchLocalReport(normalized, base, apiKey);
      return normalizeCarstatResponse(body);
    } catch (err) {
      logger.error({ err, vin: normalized, providerBaseUrl }, "Error fetching from provider");
      throw err;
    }
  });
}

export type VinPayableResult =
  | { ok: true; mode: "standard" | "manual_pending" }
  | { ok: false; code: "ALREADY_UNLOCKED"; lookupId?: number | null }
  | { ok: false; code: "VIN_NO_DATA" }
  | { ok: false; code: "VIN_CHECK_UNAVAILABLE"; reason: string };

/** Server-side gate before creating a payment — local-exists only (free). Report fetch is post-payment. */
export async function ensureVinPayableForPayment(userId: string, vin: string): Promise<VinPayableResult> {
  const normalizedVin = vin.toUpperCase();

  const [[completedLookup], [pendingLookup], [completedPmt]] = await Promise.all([
    db.select({ id: vinLookupsTable.id })
      .from(vinLookupsTable)
      .where(and(
        eq(vinLookupsTable.userId, userId),
        eq(vinLookupsTable.vin, normalizedVin),
        eq(vinLookupsTable.status, "complete"),
      ))
      .orderBy(desc(vinLookupsTable.id))
      .limit(1),
    db.select({ id: vinLookupsTable.id })
      .from(vinLookupsTable)
      .where(and(
        eq(vinLookupsTable.userId, userId),
        eq(vinLookupsTable.vin, normalizedVin),
        eq(vinLookupsTable.status, "pending_manual"),
      ))
      .orderBy(desc(vinLookupsTable.id))
      .limit(1),
    db.select({ id: paymentsTable.id })
      .from(paymentsTable)
      .where(and(
        eq(paymentsTable.userId, userId),
        eq(paymentsTable.vin, normalizedVin),
        eq(paymentsTable.status, "completed"),
      ))
      .limit(1),
  ]);

  if (completedLookup || pendingLookup || completedPmt) {
    return { ok: false, code: "ALREADY_UNLOCKED", lookupId: completedLookup?.id ?? pendingLookup?.id ?? null };
  }

  const catalogEntry = await getCatalogVin(normalizedVin);
  if (catalogEntry?.data && catalogHasDeliverableReport(catalogEntry.data)) {
    return { ok: true, mode: "standard" };
  }

  const [provider] = await db.select().from(providersTable)
    .where(and(eq(providersTable.isActive, true)))
    .orderBy(providersTable.id)
    .limit(1);
  if (!provider?.apiKey?.trim()) {
    return { ok: false, code: "VIN_CHECK_UNAVAILABLE", reason: "No active VIN provider configured." };
  }

  const exists = await checkLocalExists(normalizedVin, provider.baseUrl, provider.apiKey);
  if (exists.status === "exists") return { ok: true, mode: "standard" };

  const { isVinEligibleForManualPending } = await import("./pendingVinService.js");
  if (exists.status === "not_found" && await isVinEligibleForManualPending(normalizedVin)) {
    return { ok: true, mode: "manual_pending" };
  }

  if (exists.status === "not_found") return { ok: false, code: "VIN_NO_DATA" };
  const reason = exists.status === "unavailable" ? exists.reason : "VIN check unavailable.";
  return { ok: false, code: "VIN_CHECK_UNAVAILABLE", reason };
}

// Parse a date value that may arrive as:
//   - ISO string: "2021-03-15" / "2021-03-15T00:00:00Z"
//   - Unix seconds: 1615766400
//   - Unix milliseconds: 1615766400000
// Returns an ISO date string ("YYYY-MM-DD") or null.
function parseDate(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return parseDate(o.date ?? o.value ?? o.datetime ?? o.iso ?? o.name);
  }
  if (typeof raw === "number") {
    // YYYYMMDD integer from Korean providers (e.g. 20211030)
    if (raw >= 19_000_101 && raw <= 21_000_101) {
      const s = String(raw);
      if (s.length === 8) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
      }
    }
    // Unix seconds if <= 9999999999 (year ~2286), otherwise ms
    const ms = raw <= 9_999_999_999 ? raw * 1000 : raw;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // YYYYMMDD compact date (common in Korean insurance payloads)
    if (/^\d{8}$/.test(trimmed)) {
      const y = trimmed.slice(0, 4);
      const m = trimmed.slice(4, 6);
      const d = trimmed.slice(6, 8);
      const month = Number(m);
      const day = Number(d);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${y}-${m}-${d}`;
      }
    }
    // Plain integer string — Unix seconds/ms only (9+ digits), not YYYYMMDD
    if (/^\d{9,13}$/.test(trimmed)) {
      const n = Number(trimmed);
      const ms = n <= 9_999_999_999 ? n * 1000 : n;
      const d = new Date(ms);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    }
    const encarHeader = parseEncarMonthYearHeader(trimmed);
    if (encarHeader) return encarHeader;
    const monthDay2001 = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+2001$/i);
    if (monthDay2001) return null;
    // "January 20" without a 4-digit year defaults to year 2001 in JS — never guess
    if (/^[A-Za-z]+\s+\d{1,2}$/i.test(trimmed)) return null;
    const calendarIso = providerCalendarLabelToIso(trimmed);
    if (calendarIso) return calendarIso;
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    const iso = d.toISOString().slice(0, 10);
    const repaired = repairEncarMisParsedIsoDate(iso, null);
    return repaired ?? iso;
  }
  return null;
}

const LOT_EVENT_DATE_FIELDS = [
  "sale_date",
  "auction_date",
  "sold_date",
  "sold_at",
  "saleDate",
  "auctionDate",
] as const;

function parseLotPrimaryEventDate(lot: Record<string, unknown>): string | null {
  for (const key of LOT_EVENT_DATE_FIELDS) {
    const parsed = parseDate(lot[key]);
    if (parsed) return parsed;
  }
  return null;
}

/** Best available lot event date — US auctions use sale_date; Encar often leaves it null and uses bid/updated timestamps. */
export function resolveLotEventDate(lot: Record<string, unknown>): string | null {
  const saleD = parseLotPrimaryEventDate(lot);
  if (saleD) return saleD;

  const statusObj = (lot.status ?? {}) as Record<string, unknown>;
  const statusName = str(statusObj.name ?? lot.status)?.toLowerCase() ?? "";
  const hasFinalBid = Number(lot.final_bid) > 0;
  const naAuction = isNorthAmericanAuctionLot(lot);

  const bidTimestamp =
    parseDate(lot.final_bid_updated_at)
    ?? parseDate(lot.sale_date_updated_at)
    ?? parseDate(lot.updated_at);

  if (hasFinalBid && (statusName === "sold" || statusName === "sale" || naAuction)) {
    return bidTimestamp ?? parseDate(lot.created_at);
  }

  return parseDate(lot.updated_at) ?? parseDate(lot.created_at);
}

function pickBestMarketLot(lots: Array<Record<string, unknown>>): Record<string, unknown> | null {
  let best: Record<string, unknown> | null = null;
  let bestScore = -1;

  for (const lot of lots) {
    const finalBid = Number(lot.final_bid) || 0;
    const bid = Number(lot.bid) || 0;
    const buyNow = Number(lot.buy_now) || 0;
    const eventDate = resolveLotEventDate(lot);
    if (finalBid <= 0 && bid <= 0 && buyNow <= 0 && !eventDate) continue;

    let score = 0;
    if (isNorthAmericanAuctionLot(lot)) score += 1_000_000;
    if (finalBid > 0) score += 100_000 + Math.min(finalBid, 99_999);
    if (eventDate) score += 10_000 + (Date.parse(eventDate) || 0) / 1_000_000;
    if (buyNow > 0) score += 1_000;
    if (bid > 0) score += 100;

    if (score > bestScore) {
      bestScore = score;
      best = lot;
    }
  }

  return best;
}

function buildMarketDataFromLots(
  lots: Array<Record<string, unknown>>,
  repairedAuction: NormalizedVinData["auctionHistory"] | undefined,
  vehicleYear: number | null,
): NonNullable<NormalizedVinData["marketData"]> {
  const pricedAuction = (repairedAuction ?? []).find((e) => (e.finalPrice ?? 0) > 0);
  const bestLot = pickBestMarketLot(lots) ?? lots[0] ?? {};

  const lotFinalBid = Number(bestLot.final_bid) || null;
  const buyNow = Number(bestLot.buy_now) || null;
  const bid = Number(bestLot.bid) || null;
  const lotEventDate = resolveLotEventDate(bestLot);

  const lastAuctionPrice = pricedAuction?.finalPrice ?? lotFinalBid;
  const rawLastAuctionDate = pricedAuction?.date ?? lotEventDate;
  const lastAuctionDate = rawLastAuctionDate
    ? sanitizeReportIsoDate(rawLastAuctionDate, vehicleYear)
    : null;

  const estimatedValue =
    buyNow
    ?? bid
    ?? pricedAuction?.buyNowPrice
    ?? pricedAuction?.openingBid
    ?? null;

  return {
    estimatedValue,
    currency: "USD",
    lastAuctionPrice,
    lastAuctionDate,
  };
}

// Coerce a raw value to a non-empty string or null.
// Handles Carstat nested objects like { name: "Good", ko: "좋음" } by extracting .name/.en/.ko first;
// falls back to the first non-empty string-valued property for any other plain-object shape.
function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    // Prefer labelled string fields in priority order
    for (const key of ["name", "en", "ko", "value", "label", "text", "title"]) {
      if (typeof obj[key] === "string") {
        const s = (obj[key] as string).trim();
        if (s.length > 0) return s;
      }
    }
    // Last resort: first non-empty string property
    for (const val of Object.values(obj)) {
      if (typeof val === "string") {
        const s = val.trim();
        if (s.length > 0) return s;
      }
    }
    return null;
  }
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

const LOT_IMAGE_TIERS = [
  "big", "large", "full", "original", "high", "normal", "downloaded", "gallery", "thumbnail", "small",
] as const;

const TIER_QUALITY_RANK: Record<string, number> = {
  big: 60,
  large: 58,
  full: 56,
  original: 54,
  high: 50,
  normal: 40,
  downloaded: 20,
  gallery: 35,
  thumbnail: 10,
  small: 5,
};

/** Extract URL strings from Carstat image tier arrays (plain strings or { url } objects). */
export function extractLotImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const urls: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed.length > 0) urls.push(trimmed);
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      for (const key of ["url", "src", "href", "link", "path", "image", "original"]) {
        if (typeof obj[key] === "string") {
          const trimmed = (obj[key] as string).trim();
          if (trimmed.length > 0) {
            urls.push(trimmed);
            break;
          }
        }
      }
    }
  }
  return urls;
}

function lotImagesRecord(lot: Record<string, unknown>): Record<string, unknown> {
  const raw = lot.images;
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (Array.isArray(raw)) {
    return { gallery: raw };
  }
  return {};
}

/**
 * Highest-resolution photo URL list for a single lot (one tier only).
 * Prefer the tier with the most URLs; on ties prefer big/normal over partial downloaded cache.
 */
export function pickBestLotPhotoUrls(imgs: Record<string, unknown>): string[] {
  let best: string[] = [];
  let bestRank = -1;

  for (const key of LOT_IMAGE_TIERS) {
    const urls = extractLotImageUrls(imgs[key]);
    if (urls.length === 0) continue;

    const rank = TIER_QUALITY_RANK[key] ?? 0;
    const shouldReplace =
      urls.length > best.length
      || (urls.length === best.length && rank > bestRank);

    if (shouldReplace) {
      best = urls;
      bestRank = rank;
    }
  }

  return best;
}

// Collect unique photo URLs across lots — one resolution tier per lot (no thumbnail duplicates).
function collectPhotosFromLot(lot: Record<string, unknown>, existing: string[]): string[] {
  let result = collectPhotos(lotImagesRecord(lot), existing);
  if (Array.isArray(lot.photos)) {
    for (const p of extractLotImageUrls(lot.photos)) {
      if (!result.includes(p)) result.push(p);
    }
  }
  return result;
}

function collectPhotos(imgs: Record<string, unknown>, existing: string[]): string[] {
  const result = [...existing];
  for (const p of pickBestLotPhotoUrls(imgs)) {
    if (!result.includes(p)) result.push(p);
  }
  return result;
}

/** Carstat Copart/IAAI lots use damage.main / damage.second; older shapes use flat strings. */
export function extractLotDamages(raw: unknown): {
  primary: string | null;
  secondary: string | null;
  combined: string | null;
} {
  if (raw == null) return { primary: null, secondary: null, combined: null };
  if (typeof raw === "string") {
    const s = raw.trim();
    return { primary: s || null, secondary: null, combined: s || null };
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const primary = str(o.main ?? o.primary ?? o.primaryDamage ?? o.primary_damage ?? o.first);
    const secondary = str(o.second ?? o.secondary ?? o.secondaryDamage ?? o.secondary_damage);
    if (primary || secondary) {
      const combined = [primary, secondary].filter(Boolean).join("; ");
      return { primary, secondary, combined: combined || null };
    }
    const flat = str(raw);
    return { primary: flat, secondary: null, combined: flat };
  }
  return { primary: null, secondary: null, combined: null };
}

export function extractLotTitle(lot: Record<string, unknown>): string | null {
  return str(lot.detailed_title) ?? str(lot.title) ?? str(lot.sale_title_type) ?? str(lot.document);
}

export function isSalvageTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  return /salvage|rebuilt|junk|total\s*loss|non[- ]?repair|certificate\s+of\s+destruction|scrap|write[- ]?off|bos\b/i.test(title);
}

function isNorthAmericanAuctionLot(lot: Record<string, unknown>): boolean {
  const loc = (lot.location ?? {}) as Record<string, unknown>;
  const countryObj = (loc.country ?? {}) as Record<string, unknown>;
  const iso = str(countryObj.iso)?.toLowerCase();
  const name = str(countryObj.name)?.toLowerCase() ?? "";
  if (iso === "us" || iso === "ca" || iso === "usa") return true;
  if (name.includes("united states") || name.includes("canada")) return true;
  const domain = (lot.domain ?? {}) as Record<string, unknown>;
  const domainName = str(domain.name)?.toLowerCase() ?? "";
  return domainName.includes("copart") || domainName.includes("iaai");
}

function lotDomainName(lot: Record<string, unknown>): string {
  const domain = (lot.domain ?? {}) as Record<string, unknown>;
  return str(domain.name)?.toLowerCase() ?? "";
}

const KM_PER_MILE = 1.60934;

/** Odometer from provider lot — supports km, miles, or nested odometer objects. */
export function parseLotOdometerKm(lot: Record<string, unknown>): number | null {
  const lotOdo = lot.odometer;
  if (lotOdo != null && typeof lotOdo === "object" && !Array.isArray(lotOdo)) {
    const o = lotOdo as Record<string, unknown>;
    const km = Number(o.km);
    if (Number.isFinite(km) && km > 0) return Math.round(km);
    const mi = Number(o.mi ?? o.miles);
    if (Number.isFinite(mi) && mi > 0) return Math.round(mi * KM_PER_MILE);
  }
  const flat = Number(lotOdo);
  if (Number.isFinite(flat) && flat > 0) return Math.round(flat);
  return null;
}

function extractLotCountryCode(lot: Record<string, unknown>): string | null {
  const loc = (lot.location ?? {}) as Record<string, unknown>;
  const countryObj = (loc.country ?? {}) as Record<string, unknown>;
  return str(countryObj.iso ?? countryObj.name);
}

/** Prefer the country seen on the most lots (any provider / marketplace). */
export function resolveVehicleCountry(lots: Array<Record<string, unknown>>): string | null {
  const counts = new Map<string, number>();
  for (const lot of lots) {
    const code = extractLotCountryCode(lot);
    if (!code) continue;
    const key = code.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  }
  return best;
}

function lotsHaveRegistryTimeline(lots: Array<Record<string, unknown>>): boolean {
  return pickLotHistoryBlocks(lots).length > 0;
}

function resolveOwnerHistoryFromLots(
  lots: Array<Record<string, unknown>>,
  insurance: Record<string, unknown>,
  auctionOwnerHistory: NonNullable<NormalizedVinData["ownerHistory"]>,
): NonNullable<NormalizedVinData["ownerHistory"]> {
  const fromRegistryTimeline = extractKoreanOwnerHistory(lots, insurance);
  if (fromRegistryTimeline.length > 0) return fromRegistryTimeline;
  return auctionOwnerHistory;
}

/** Marketplace relists (Encar, etc.) — not separate auction events. */
function isMarketplaceListingLot(lot: Record<string, unknown>): boolean {
  if (isNorthAmericanAuctionLot(lot)) return false;
  const domain = lotDomainName(lot);
  return domain.length > 0 && !domain.includes("copart") && !domain.includes("iaai");
}

function inspectSummaryFlag(value: unknown): "yes" | "no" | "unknown" {
  const s = str(value)?.toLowerCase().replace(/'/g, "") ?? "";
  if (!s) return "unknown";
  if (s === "yes" || s === "y" || s === "true" || s === "1") return "yes";
  if (s === "doesnt exist" || s === "does not exist" || s === "no" || s === "n" || s === "false" || s === "0") {
    return "no";
  }
  return "unknown";
}

/** Encar / Korean performance inspection — structural accident vs cosmetic repair. */
export function parseKoreanInspectAccident(details: Record<string, unknown> | null | undefined): {
  hasStructuralAccident: boolean;
  hasMinorRepair: boolean;
  description: string | null;
} {
  const inspect = (details?.inspect ?? {}) as Record<string, unknown>;
  const summary = (inspect.accident_summary ?? {}) as Record<string, unknown>;
  if (!Object.keys(summary).length) {
    return { hasStructuralAccident: false, hasMinorRepair: false, description: null };
  }

  const accident = inspectSummaryFlag(summary.accident);
  const framework = inspectSummaryFlag(summary.main_framework);
  const exterior2 = inspectSummaryFlag(summary.exterior2rank);
  const simpleRepair = inspectSummaryFlag(summary.simple_repair);

  const hasStructuralAccident = accident === "yes" || framework === "yes";
  const hasMinorRepair = exterior2 === "yes" || simpleRepair === "yes";

  const parts: string[] = [];
  if (hasStructuralAccident) parts.push("structural accident flagged on inspection");
  if (framework === "yes") parts.push("main framework damage");
  if (exterior2 === "yes") parts.push("exterior panel repair");
  if (simpleRepair === "yes") parts.push("simple repair noted");

  return {
    hasStructuralAccident,
    hasMinorRepair,
    description: parts.length ? parts.join("; ") : null,
  };
}

const KR_INSURANCE_CLAIM_TYPES: Record<string, string> = {
  "1": "insurance_own_damage",
  "2": "insurance_third_party",
  "3": "insurance_third_party_own_damage",
};

export function isKoreanInsuranceClaimRecord(record: Record<string, unknown>): boolean {
  const typeCode = str(record.type);
  const hasPayout = record.insuranceBenefit != null
    || record.partCost != null
    || record.laborCost != null
    || record.paintingCost != null;
  return hasPayout && /^[123]$/.test(typeCode ?? "");
}

function mapKoreanInsuranceClaim(
  record: Record<string, unknown>,
): NonNullable<NormalizedVinData["insuranceClaims"]>[number] {
  const typeCode = str(record.type);
  const partCost = Number(record.partCost) || null;
  const laborCost = Number(record.laborCost) || null;
  const paintingCost = Number(record.paintingCost) || null;
  const lossAmount = sanitizeKoreanRepairKrwAmount(Number(record.insuranceBenefit) || null, {
    partCost,
    laborCost,
    paintingCost,
  });
  const costParts: string[] = [];
  if (partCost) costParts.push(`parts ₩${partCost.toLocaleString()}`);
  if (laborCost) costParts.push(`labor ₩${laborCost.toLocaleString()}`);
  if (paintingCost) costParts.push(`paint ₩${paintingCost.toLocaleString()}`);

  const rawDate = str(record.date);
  return {
    date: rawDate ? normalizeEventDate(rawDate) : parseDate(record.date),
    type: (typeCode && KR_INSURANCE_CLAIM_TYPES[typeCode]) ?? typeCode,
    lossAmount,
    partCost,
    laborCost,
    paintingCost,
    description: costParts.length ? costParts.join(", ") : null,
  };
}

type VinAccident = NonNullable<NormalizedVinData["accidents"]>[number];
type VinInsuranceClaim = NonNullable<NormalizedVinData["insuranceClaims"]>[number];

function inferKoreanLossSeverity(amount: number | null | undefined): string {
  return inferAccidentSeverityFromLossAmount(amount, { amountCurrency: "KRW" });
}

function inferUsdLossSeverity(amount: number | null | undefined): string {
  return inferAccidentSeverityFromLossAmount(amount, { amountCurrency: "USD" });
}

function parseWonAmount(value: string | null | undefined): number | null {
  return sanitizeKoreanRepairKrwAmount(parseKrwAmountFromText(value));
}

export function mapKoreanInsuranceClaimToAccident(
  claim: VinInsuranceClaim,
  country: string | null,
): VinAccident {
  return {
    date: claim.date ?? null,
    severity: inferKoreanLossSeverity(claim.lossAmount),
    description: claim.type ?? claim.description ?? null,
    country,
    type: "insurance",
    primaryDamage: null,
    secondaryDamage: null,
    airbagDeployed: null,
    odometerAtLoss: null,
    lossAmount: claim.lossAmount ?? null,
  };
}

export function registryEventIndicatesAccident(event: RegistryHistoryEvent): boolean {
  if (event.type === "insurance_event") return true;
  const blob = [
    event.title,
    event.subtitle,
    event.amount,
    ...(event.details ?? []).map((row) => `${row.label} ${row.value}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(accident|collision|damage|repair cost|insurance processing|own damage|third.party|insurance event)\b/.test(blob);
}

export function resolveRegistryAccidentLossAmount(event: RegistryHistoryEvent): number | null {
  const repairDetail = event.details?.find((row) => isRegistryRepairCostLabel(row.label));
  if (repairDetail?.value) {
    return parseWonAmount(repairDetail.value);
  }
  if (event.amount && isRegistryRepairCostLabel(event.amount)) {
    return parseWonAmount(event.amount);
  }
  return null;
}

export function mapRegistryEventToAccident(
  event: RegistryHistoryEvent,
  country: string | null,
): VinAccident | null {
  if (!registryEventIndicatesAccident(event)) return null;

  const lossAmount = resolveRegistryAccidentLossAmount(event);

  return {
    date: normalizeEventDate(event.date ?? null),
    severity: inferKoreanLossSeverity(lossAmount),
    description: event.title ?? event.subtitle ?? null,
    country,
    type: "registry",
    primaryDamage: null,
    secondaryDamage: null,
    airbagDeployed: null,
    odometerAtLoss: event.mileage ?? null,
    lossAmount,
  };
}

function buildKoreanSupplementalAccidents(
  insuranceClaims: VinInsuranceClaim[],
  registryHistory: RegistryHistoryEvent[],
  country: string | null,
): VinAccident[] {
  const fromClaims = insuranceClaims.map((claim) => mapKoreanInsuranceClaimToAccident(claim, country));
  const claimDateKeys = new Set(
    fromClaims
      .map((accident) => (accident.date ?? "").slice(0, 10))
      .filter(Boolean),
  );
  const fromRegistry = registryHistory
    .map((event) => mapRegistryEventToAccident(event, country))
    .filter((event): event is VinAccident => {
      if (!event) return false;
      const dateKey = (event.date ?? "").slice(0, 10);
      if (dateKey && claimDateKeys.has(dateKey)) return false;
      return true;
    });
  return dedupeAccidents([...fromClaims, ...fromRegistry]);
}

function mapStandardInsuranceAccident(
  record: Record<string, unknown>,
  country: string | null,
  totalLoss: number,
): NonNullable<NormalizedVinData["accidents"]>[number] {
  const rawSeverity = str(record.severity ?? record.damage_type ?? record.damageType);
  const odometerAtLoss = Number(record.odometerAtLoss ?? record.odometer_at_loss ?? record.odometer ?? record.mileage) || null;
  const lossAmount = Number(record.lossAmount ?? record.loss_amount ?? record.amount ?? record.damage_amount ?? record.insuranceBenefit) || null;

  let severity: string;
  if (totalLoss > 0) {
    severity = "total_loss";
  } else if (lossAmount != null && lossAmount > 0) {
    severity = inferUsdLossSeverity(lossAmount);
  } else if (rawSeverity) {
    severity = rawSeverity;
  } else {
    severity = "minor";
  }

  let airbagDeployed: boolean | null = null;
  const rawAirbag = record.airbag_deployed ?? record.airbagDeployed ?? record.airbags_deployed;
  if (rawAirbag != null) {
    if (typeof rawAirbag === "boolean") airbagDeployed = rawAirbag;
    else if (typeof rawAirbag === "number") airbagDeployed = rawAirbag > 0;
    else if (typeof rawAirbag === "string") airbagDeployed = /^(yes|true|1|deployed)$/i.test(rawAirbag.trim());
  }

  return {
    date: parseDate(record.date ?? record.occurrenceDate ?? record.accident_date ?? record.date_of_loss),
    severity,
    description: str(record.description ?? record.damageInfo ?? record.damage_description),
    country,
    type: str(record.type ?? record.accidentType ?? record.accident_type),
    primaryDamage: str(record.primaryDamage ?? record.primary_damage ?? record.primary_damage_location),
    secondaryDamage: str(record.secondaryDamage ?? record.secondary_damage ?? record.secondary_damage_location),
    airbagDeployed,
    odometerAtLoss,
    lossAmount,
  };
}

export type RegistryHistoryEvent = NonNullable<NormalizedVinData["registryHistory"]>[number];

const REGISTRY_AMOUNT_KEYS = [
  "total repair cost",
  "New car list price",
  "New car delivery price",
  "New car shipping",
  "New car list price",
] as const;

const REGISTRY_MILEAGE_KEYS = [
  "Driving distance during inspection",
  "Driving distance when changing",
  "Drown distance when changing",
  "Drone during inspection",
  "Mileage during inspection",
] as const;

const REGISTRY_LOCATION_KEYS = [
  "Address at time of purchase",
  "Address after change",
  "Address when purchasing",
] as const;

function stripHtmlText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isMeaningfulProviderText(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  const s = String(value).trim();
  if (!s || s === "[object Object]") return false;
  const lower = s.toLowerCase();
  if (lower === "no information" || lower === "n/a" || lower === "none" || lower === "unknown" || lower === "not available") {
    return false;
  }
  if (/^no\s+.+\s+information$/i.test(s)) return false;
  return true;
}

function cleanProviderMultiline(value: string | null): string | null {
  if (!value) return null;
  const lines = value.split(/\n/).map((line) => line.trim()).filter((line) => isMeaningfulProviderText(line));
  if (lines.length === 0) return null;
  return lines.join("\n");
}

function strField(record: Record<string, unknown>, key: string): string | null {
  const v = record[key];
  if (!isMeaningfulProviderText(v)) return null;
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

export function classifyKoreanRegistryTitle(title: string): string {
  const t = title.toLowerCase().replace(/\s+/g, " ").trim();
  if (/new car (delivery|shipment)/.test(t)) return "new_car_delivery";
  if (/car inspection completed|automobile inspection completed/.test(t)) return "inspection";
  if (/change registration/.test(t)) return "registration_change";
  if (t === "ownership" || /owner change/.test(t)) return "owner_change";
  if (/no car insurance|non[\s-]*insurance/.test(t)) return "no_insurance";
  if (/insurance processing|repair processing/.test(t)) return "insurance_event";
  return "other";
}

/** Encar/KOTSA recall rows — excluded from stored and displayed registry timelines. */
export function isKoreanRecallRegistryItem(item: Record<string, unknown>): boolean {
  const title = (strField(item, "title") ?? "").toLowerCase();
  const sub = (strField(item, "sub") ?? "").toLowerCase();
  const flag = (strField(item, "flag") ?? "").toLowerCase();
  if (/recall/.test(title) || /recall/.test(sub) || /recall/.test(flag)) return true;
  if (strField(item, "Recall date") || strField(item, "recall post date")) return true;
  return false;
}

function applyEncarDateRepairs<T extends { date?: string | null }>(
  items: T[] | undefined,
  vehicleYear: number | null,
): T[] | undefined {
  if (!items?.length) return items;
  return items.map((item) => ({
    ...item,
    date: sanitizeReportIsoDate(item.date ?? null, vehicleYear),
  }));
}

export function isKoreanRecallRegistryEvent(event: RegistryHistoryEvent): boolean {
  if (event.type === "recall") return true;
  const title = (event.title ?? "").toLowerCase();
  const subtitle = (event.subtitle ?? "").toLowerCase();
  if (/recall/.test(title) || /recall/.test(subtitle)) return true;
  return (event.details ?? []).some((row) => /recall/i.test(row.label));
}


function isKoreanOwnershipTitle(title: string): boolean {
  const t = title.toLowerCase().replace(/\s+/g, " ").trim();
  return t === "ownership" || /owner change/.test(t);
}

function pickLotHistoryBlocks(lots: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const seenContent = new Set<string>();
  const groups: Array<Record<string, unknown>> = [];

  for (const lot of lots) {
    const details = (lot.details ?? {}) as Record<string, unknown>;
    const history = Array.isArray(details.history) ? details.history as Array<Record<string, unknown>> : [];
    for (const group of history) {
      const groupDate = normalizeHistoryGroupDate(strField(group, "date"));
      const content = Array.isArray(group.content) ? group.content as Array<Record<string, unknown>> : [];
      const uniqueContent: Array<Record<string, unknown>> = [];
      for (const item of content) {
        const fp = historyContentFingerprint(item);
        if (seenContent.has(fp)) continue;
        seenContent.add(fp);
        uniqueContent.push(item);
      }
      if (uniqueContent.length > 0) {
        groups.push({
          ...group,
          ...(groupDate ? { date: groupDate } : {}),
          content: uniqueContent,
        });
      }
    }
  }

  return groups;
}

function fingerprintDateField(value: string | null): string {
  if (!value) return "";
  return normalizeEventDate(value) ?? value.trim().toLowerCase();
}

function historyContentFingerprint(item: Record<string, unknown>): string {
  const title = (strField(item, "title") ?? "").toLowerCase().replace(/\s+/g, " ");
  const changeDate = fingerprintDateField(strField(item, "Change date") ?? strField(item, "Date of change"));
  const inspectionDate = fingerprintDateField(strField(item, "Inspection date"));
  const occurrenceDate = fingerprintDateField(strField(item, "Date of occurrence"));
  const recallDate = fingerprintDateField(strField(item, "Recall date") ?? strField(item, "recall post date"));
  const mileage = REGISTRY_MILEAGE_KEYS
    .map((key) => strField(item, key))
    .filter(Boolean)
    .join("|");
  const sub = strField(item, "sub") ?? "";
  const subMileage = parseKmFromText(sub) ?? parseKmFromText(title);
  const repairCost = strField(item, "Total repair cost") ?? "";
  return `${title}|${changeDate}|${inspectionDate}|${occurrenceDate}|${recallDate}|${mileage}|${subMileage ?? ""}|${sub.slice(0, 80)}|${repairCost}`;
}

const HISTORY_MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function historyDateSortKey(date: string | null | undefined): number {
  if (!date) return Number.NEGATIVE_INFINITY;
  const trimmed = date.trim();
  if (!trimmed) return Number.NEGATIVE_INFINITY;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ts = Date.parse(`${trimmed}T12:00:00`);
    return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts;
  }

  if (/^\d{8}$/.test(trimmed)) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6);
    const d = trimmed.slice(6, 8);
    const ts = Date.parse(`${y}-${m}-${d}T12:00:00`);
    return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts;
  }

  const english = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
  if (english) {
    const month = HISTORY_MONTHS.indexOf(english[1]!.toLowerCase());
    if (month >= 0) {
      const day = parseInt(english[2]!, 10);
      const year = english[3] ? parseInt(english[3], 10) : Number.NEGATIVE_INFINITY;
      if (year !== Number.NEGATIVE_INFINITY) {
        return Date.UTC(year, month, day);
      }
    }
  }

  const encarMonthYear = trimmed.match(/^([A-Za-z]+)\s+(\d{2})$/i);
  if (encarMonthYear) {
    const month = HISTORY_MONTHS.indexOf(encarMonthYear[1]!.toLowerCase());
    const yy = parseInt(encarMonthYear[2]!, 10);
    if (month >= 0 && yy >= 19 && yy <= 99 && yy !== 30 && yy !== 31) {
      return Date.UTC(2000 + yy, month, 1);
    }
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function historyMileageSortKey(mileage: number | null | undefined): number {
  return mileage != null && mileage > 0 ? mileage : Number.NEGATIVE_INFINITY;
}

function sortHistoryNewestFirst<T extends { date?: string | null; mileage?: number | null; odometer?: number | null }>(items: T[]): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      dateKey: historyDateSortKey(item.date),
      mileageKey: historyMileageSortKey(item.mileage ?? item.odometer),
    }))
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) return b.dateKey - a.dateKey;
      if (a.mileageKey !== b.mileageKey) return b.mileageKey - a.mileageKey;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function sortOwnerHistoryChronologically(
  events: NonNullable<NormalizedVinData["ownerHistory"]>,
): NonNullable<NormalizedVinData["ownerHistory"]> {
  return sortHistoryNewestFirst(events);
}

function normalizeEventDate(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  if (/^\d{8}$/.test(trimmed)) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6);
    const d = trimmed.slice(6, 8);
    const month = Number(m);
    const day = Number(d);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  const english = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (english) {
    const month = ENGLISH_MONTH_INDEX[english[1]!.toLowerCase()];
    if (month != null) {
      const day = String(parseInt(english[2]!, 10)).padStart(2, "0");
      const monthStr = String(month).padStart(2, "0");
      return `${english[3]}-${monthStr}-${day}`;
    }
  }

  const englishMonthYear = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (englishMonthYear) {
    const month = ENGLISH_MONTH_INDEX[englishMonthYear[1]!.toLowerCase()];
    if (month != null) {
      return `${englishMonthYear[2]}-${String(month).padStart(2, "0")}-01`;
    }
  }

  const encarHeader = parseEncarMonthYearHeader(trimmed);
  if (encarHeader) return encarHeader;

  // Month + day without year (e.g. "October 30") — avoid JS defaulting to 2001
  if (/^[A-Za-z]+\s+\d{1,2}$/i.test(trimmed)) return null;

  return sanitizeReportIsoDate(trimmed, null);
}

const REGISTRY_ITEM_DATE_FIELDS = [
  "Date of occurrence",
  "Inspection date",
  "Car inspection completion date",
  "Completion date",
  "Change date",
  "Date of change",
  "Recall date",
  "recall post date",
  "First registration date",
  "Initial registration date",
  "Date of production",
  "Production date",
] as const;

/** End of an insurance lapse period, e.g. "April 2015 -April 2019 (Total 48 months)". */
function parseRegistryPeriodDate(raw: string | null): string | null {
  if (!raw) return null;
  const endRange = raw.match(/-\s*([A-Za-z]+)\s+(\d{4})/i);
  if (endRange) {
    const month = ENGLISH_MONTH_INDEX[endRange[1]!.toLowerCase()];
    if (month != null) {
      return `${endRange[2]}-${String(month).padStart(2, "0")}-01`;
    }
  }
  const matches = raw.match(/\b([A-Za-z]+)\s+(\d{4})\b/g);
  if (matches?.length) {
    const last = matches[matches.length - 1]!;
    const m = last.match(/^([A-Za-z]+)\s+(\d{4})$/i);
    if (m) {
      const month = ENGLISH_MONTH_INDEX[m[1]!.toLowerCase()];
      if (month != null) return `${m[2]}-${String(month).padStart(2, "0")}-01`;
    }
  }
  return null;
}

/** Sanitize malformed Encar group headers (e.g. duplicated "April 15, April 15"). */
export function normalizeHistoryGroupDate(raw: string | null): string | null {
  if (!raw) return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;

  const duplicated = trimmed.match(/^([A-Za-z]+\s+\d{1,2}),\s*\1$/i);
  if (duplicated) trimmed = duplicated[1]!;

  if (trimmed.includes(",")) {
    const segments = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    for (const segment of segments) {
      if (/^\d{4}-\d{2}-\d{2}/.test(segment)) return segment.slice(0, 10);
      if (/^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/i.test(segment)) return segment;
      if (parseEncarMonthYearHeader(segment)) return segment;
      if (/^[A-Za-z]+\s+\d{4}$/i.test(segment)) return segment;
    }
    return segments[0] ?? null;
  }

  return trimmed;
}

/** Prefer a full YYYY-MM-DD from item fields; never use month-only group headers when a year exists in details. */
export function resolveRegistryItemDate(
  item: Record<string, unknown>,
  groupDate: string | null,
): string | null {
  for (const key of REGISTRY_ITEM_DATE_FIELDS) {
    const value = strField(item, key);
    if (!value) continue;
    const normalized = normalizeEventDate(value);
    if (normalized && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  }

  const period = strField(item, "period") ?? strField(item, "sub");
  const fromPeriod = parseRegistryPeriodDate(period);
  if (fromPeriod) return fromPeriod;

  const normalizedGroup = normalizeHistoryGroupDate(groupDate);
  if (normalizedGroup) {
    const normalized = normalizeEventDate(normalizedGroup);
    if (normalized && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  }

  return null;
}

const ENGLISH_MONTH_INDEX: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

/**
 * Encar details.history group headers use "Month YY" (2-digit year), e.g. "January 20" → Jan 2020.
 * JavaScript parses the same string as Jan 20, **2001** when no 4-digit year is present.
 */
export function parseEncarMonthYearHeader(raw: string): string | null {
  const m = raw.trim().match(/^([A-Za-z]+)\s+(\d{2})$/i);
  if (!m) return null;
  const monthNum = ENGLISH_MONTH_INDEX[m[1]!.toLowerCase()];
  if (monthNum == null) return null;
  const nn = parseInt(m[2]!, 10);
  // Likely day-of-month without year (e.g. "October 30") — do not invent a year
  if (nn === 30 || nn === 31) return null;
  if (nn < 19 || nn > 99) return null;
  const year = 2000 + nn;
  return `${year}-${String(monthNum).padStart(2, "0")}-01`;
}

/** Korean ownership transfers from details.history and insurance_v2.ownerChanges. */
export function extractKoreanOwnerHistory(
  lots: Array<Record<string, unknown>>,
  insurance: Record<string, unknown>,
): NonNullable<NormalizedVinData["ownerHistory"]> {
  const events: NonNullable<NormalizedVinData["ownerHistory"]> = [];

  for (const group of pickLotHistoryBlocks(lots)) {
    const content = Array.isArray(group.content) ? group.content as Array<Record<string, unknown>> : [];
    for (const item of content) {
      const title = strField(item, "title") ?? "";
      if (!isKoreanOwnershipTitle(title)) continue;

      const changeDate = normalizeEventDate(strField(item, "Change date"))
        ?? normalizeEventDate(strField(item, "Date of change"));
      const mileage = parseKmFromText(strField(item, "Drown distance when changing"))
        ?? parseKmFromText(strField(item, "Driving distance when changing"))
        ?? parseKmFromText(strField(item, "sub"));
      const transaction = strField(item, "Transaction")
        ?? strField(item, "Transaction type");
      const flag = strField(item, "flag");

      events.push({
        date: changeDate,
        location: null,
        mileage,
        auctionPrice: null,
        lotStatus: transaction ?? flag,
        condition: null,
      });
    }
  }

  const meaningful = events.filter((entry) =>
    isMeaningfulProviderText(entry.date)
    || entry.mileage != null
    || isMeaningfulProviderText(entry.lotStatus)
    || isMeaningfulProviderText(entry.location),
  );

  if (meaningful.length > 0) {
    return sortOwnerHistoryChronologically(dedupeOwnerHistory(meaningful));
  }

  const dates = Array.isArray(insurance.ownerChanges)
    ? (insurance.ownerChanges as unknown[])
      .map((d) => normalizeEventDate(str(d)))
      .filter((d): d is string => !!d)
    : [];

  return sortOwnerHistoryChronologically(dedupeOwnerHistory(dates.map((date) => ({
    date,
    location: null,
    mileage: null,
    auctionPrice: null,
    lotStatus: null,
    condition: null,
  }))));
}

function mapKoreanRegistryContentItem(
  item: Record<string, unknown>,
  groupDate: string | null,
): RegistryHistoryEvent {
  const rawTitle = strField(item, "title") ?? "";
  const title = rawTitle.replace(/\n/g, " ").trim() || null;
  const subtitleRaw = cleanProviderMultiline(strField(item, "sub"));
  let subtitle = subtitleRaw?.replace(/\n/g, " · ") ?? null;
  const type = classifyKoreanRegistryTitle(rawTitle);

  let mileage: number | null = null;
  let mileageFromField = false;
  let amount: string | null = null;
  let location: string | null = null;
  const details: Array<{ label: string; value: string }> = [];
  const reserved = new Set(["title", "sub", "flag"]);

  for (const [key, raw] of Object.entries(item)) {
    if (reserved.has(key) || raw == null) continue;
    const value = typeof raw === "string" ? stripHtmlText(raw) : String(raw);
    if (!isMeaningfulProviderText(value)) continue;

    const keyLower = key.toLowerCase();
    if (REGISTRY_MILEAGE_KEYS.some((k) => k.toLowerCase() === keyLower)) {
      const parsed = parseKmFromText(value);
      if (parsed != null) {
        mileage = parsed;
        mileageFromField = true;
      }
      details.push({ label: key, value });
      continue;
    }
    if (REGISTRY_AMOUNT_KEYS.some((k) => k.toLowerCase() === keyLower)) {
      const isRepair = isRegistryRepairCostLabel(key);
      const normalized = isRepair
        ? (sanitizeKoreanRepairAmountText(value) ?? null)
        : (formatKoreanListPriceAmountText(value) ?? normalizeKrwAmountText(value) ?? value);
      if (!normalized) continue;
      details.push({ label: key, value: normalized });
      continue;
    }
    if (REGISTRY_LOCATION_KEYS.some((k) => k.toLowerCase() === keyLower)) {
      location = value;
      continue;
    }
    if (
      keyLower === "date of occurrence"
      || keyLower === "inspection date"
      || keyLower === "date of change"
      || keyLower === "change date"
      || keyLower === "completion date"
      || keyLower === "car inspection completion date"
      || keyLower === "inspection completion date"
      || keyLower === "recall date"
      || keyLower === "recall post date"
      || keyLower === "initial registration date"
      || keyLower === "first registration date"
      || keyLower === "date of production"
      || keyLower === "production date"
    ) {
      details.unshift({ label: key, value });
      continue;
    }
    details.push({ label: key, value });
  }

  if (!mileageFromField && (type === "inspection" || type === "owner_change")) {
    mileage = parseKmFromText(subtitle) ?? parseKmFromText(title) ?? mileage;
  }
  if (REGISTRY_TYPES_WITHOUT_MILEAGE.has(type) && !mileageFromField) {
    mileage = null;
  }

  if (!amount && subtitle) {
    const m = subtitle.match(/total\s+([\d.,]+\s+million won|[\d,]+\s+won)/i);
    if (m) amount = sanitizeKoreanRepairAmountText(m[1]!) ?? normalizeKrwAmountText(m[1]!);
  }

  subtitle = stripRegistrySubtitleNoise(subtitle, mileage);
  if (!location && subtitle) {
    const parts = subtitle.split(/\n| · /).map((p) => p.trim()).filter(Boolean);
    const locCandidate = parts.find((p) =>
      !/mileage|total|no information|recall|inspection/i.test(p)
      && !isEncarMileageTypoLine(p),
    );
    if (locCandidate && locCandidate.length > 3) location = locCandidate;
  }

  location = sanitizeRegistryLocation(location);

  let eventDate = resolveRegistryItemDate(item, groupDate);

  amount = resolveRegistryDisplayAmount({ type, amount, details });

  return {
    date: eventDate,
    type,
    title,
    subtitle,
    mileage,
    amount,
    location,
    details: details.length > 0 ? details : undefined,
  };
}

function sanitizeRegistryHistoryEvent(event: RegistryHistoryEvent): RegistryHistoryEvent | null {
  const details = (event.details ?? []).filter((row) => isMeaningfulProviderText(row.value));
  const cleaned: RegistryHistoryEvent = {
    ...event,
    title: event.title && isMeaningfulProviderText(event.title) ? event.title : null,
    subtitle: event.subtitle && isMeaningfulProviderText(event.subtitle) ? event.subtitle : null,
    amount: event.amount && isMeaningfulProviderText(event.amount) ? event.amount : null,
    location: event.location && isMeaningfulProviderText(event.location) ? event.location : null,
    date: event.date && isMeaningfulProviderText(event.date) ? event.date : null,
    details: details.length > 0 ? details : undefined,
  };
  const hasContent = Boolean(
    cleaned.title
    || cleaned.subtitle
    || cleaned.date
    || cleaned.mileage != null
    || cleaned.amount
    || cleaned.location
    || (cleaned.details?.length ?? 0) > 0
    || cleaned.type,
  );
  return hasContent ? cleaned : null;
}

/** Pick the richest details.history block across Korean marketplace lots. */
export function extractRegistryHistoryFromLots(
  lots: Array<Record<string, unknown>>,
): RegistryHistoryEvent[] {
  const events: RegistryHistoryEvent[] = [];
  for (const group of pickLotHistoryBlocks(lots)) {
    const groupDate = strField(group, "date");
    const content = Array.isArray(group.content) ? group.content as Array<Record<string, unknown>> : [];
    for (const item of content) {
      if (isKoreanRecallRegistryItem(item)) continue;
      const mapped = mapKoreanRegistryContentItem(item, groupDate);
      if (isKoreanRecallRegistryEvent(mapped)) continue;
      const sanitized = sanitizeRegistryHistoryEvent(mapped);
      if (sanitized) events.push(sanitized);
    }
  }

  return sortHistoryNewestFirst(dedupeRegistryHistoryEvents(events));
}

/** Pick the richest insurance_v2 block across all lots (any source domain). */
export function extractInsuranceV2FromLots(lots: Array<Record<string, unknown>>): Record<string, unknown> {
  let best: Record<string, unknown> = {};
  let bestScore = -1;
  for (const lot of lots) {
    const details = (lot.details ?? {}) as Record<string, unknown>;
    const insurance = (details.insurance_v2 ?? {}) as Record<string, unknown>;
    const accidents = Array.isArray(insurance.accidents) ? insurance.accidents : [];
    const score = accidents.length * 10
      + (Number(insurance.accidentCnt) || 0)
      + (Number(insurance.ownerChangeCnt) || 0);
    if (score > bestScore) {
      bestScore = score;
      best = insurance;
    }
  }
  if (bestScore >= 0) return best;
  const firstDetails = (lots[0]?.details ?? {}) as Record<string, unknown>;
  return (firstDetails.insurance_v2 ?? {}) as Record<string, unknown>;
}

function pickLotDetailsWithInspect(lots: Array<Record<string, unknown>>): Record<string, unknown> {
  for (const lot of lots) {
    const details = (lot.details ?? {}) as Record<string, unknown>;
    const inspect = details.inspect as Record<string, unknown> | undefined;
    if (inspect?.accident_summary) return details;
  }
  const firstDetails = (lots[0]?.details ?? {}) as Record<string, unknown>;
  return firstDetails ?? {};
}

export function resolveVinAccidents(input: {
  country: string | null;
  insurance: Record<string, unknown>;
  lotDetails: Record<string, unknown>;
  auctionAccidents: NonNullable<NormalizedVinData["accidents"]>;
  registryHistory?: RegistryHistoryEvent[];
}): {
  accidents: NonNullable<NormalizedVinData["accidents"]>;
  insuranceClaims: NonNullable<NormalizedVinData["insuranceClaims"]>;
  accidentCount: number;
} {
  const { country, insurance, lotDetails, auctionAccidents, registryHistory = [] } = input;
  const totalLoss = Number(insurance.totalLossCnt ?? 0);
  const rawRecords = Array.isArray(insurance.accidents)
    ? insurance.accidents as Array<Record<string, unknown>>
    : [];

  const koreanClaims = rawRecords.filter(isKoreanInsuranceClaimRecord);
  const standardRecords = rawRecords.filter((r) => !isKoreanInsuranceClaimRecord(r));
  const usesKoreanClaimModel = koreanClaims.length > 0
    && (country?.toLowerCase() === "kr" || standardRecords.length === 0);

  const insuranceClaims = sortHistoryNewestFirst(
    usesKoreanClaimModel
      ? koreanClaims.map(mapKoreanInsuranceClaim)
      : [],
  );

  const standardAccidents = standardRecords
    .map((r) => mapStandardInsuranceAccident(r, country, totalLoss))
    .filter((a) => a.date || a.description || a.primaryDamage || a.severity || a.lossAmount);

  const inspect = parseKoreanInspectAccident(lotDetails);
  const inspectionAccidents: NonNullable<NormalizedVinData["accidents"]> = [];
  if (inspect.hasStructuralAccident) {
    const summary = (lotDetails.inspect as Record<string, unknown> | undefined)?.accident_summary as Record<string, unknown> | undefined;
    const frameworkYes = inspectSummaryFlag(summary?.main_framework) === "yes";
    inspectionAccidents.push({
      date: null,
      severity: frameworkYes ? "major" : "moderate",
      description: inspect.description,
      country,
      type: "inspection",
      primaryDamage: null,
      secondaryDamage: null,
      airbagDeployed: null,
      odometerAtLoss: null,
      lossAmount: null,
    });
  }

  const koreanSupplemental = usesKoreanClaimModel
    ? buildKoreanSupplementalAccidents(insuranceClaims, registryHistory, country)
    : registryHistory
      .map((event) => mapRegistryEventToAccident(event, country))
      .filter((event): event is VinAccident => event != null);

  let accidents: NonNullable<NormalizedVinData["accidents"]> = [];
  if (standardAccidents.length > 0) {
    accidents = dedupeAccidents([...standardAccidents, ...koreanSupplemental, ...inspectionAccidents]);
  } else if (inspectionAccidents.length > 0) {
    accidents = dedupeAccidents([...inspectionAccidents, ...koreanSupplemental]);
  } else if (koreanSupplemental.length > 0) {
    accidents = koreanSupplemental;
  } else if (!usesKoreanClaimModel && auctionAccidents.length > 0) {
    accidents = auctionAccidents;
  } else if (!usesKoreanClaimModel && auctionAccidents.length === 0 && rawRecords.length > 0) {
    accidents = rawRecords.map((r) => mapStandardInsuranceAccident(r, country, totalLoss));
  } else if (!usesKoreanClaimModel) {
    accidents = auctionAccidents;
  }

  if (auctionAccidents.length > 0) {
    accidents = dedupeAccidents([...accidents, ...auctionAccidents]);
  }

  const accidentCount = accidents.length;
  return {
    accidents: sortHistoryNewestFirst(accidents),
    insuranceClaims,
    accidentCount,
  };
}

// Normalize carstat.dev /api/local-report/{vin} response.
// Handles both:
//   - direct vehicle object at root level (new local-report format)
//   - { data: [{...}] } wrapper (legacy search format)
// Field mapping for carstat.dev report shape:
//   { id, year, vin, manufacturer: {name}, model: {name}, generation: {name},
//     body_type: {name}, color: {name}, engine: {name}, transmission: {name}, fuel: {name},
//     cylinders, hp, lots: [{ odometer: {km, mi}, damage, condition, images, location,
//       bid, buy_now, final_bid, sale_date, status, title, detailed_title,
//       damage: { main: {name}, second: {name} }, details: { insurance_v2 } }] }
export function normalizeCarstatResponse(body: Record<string, unknown>): NormalizedVinData {
  // Unwrap { data: [...] } or { data: {...} } if present
  let raw: Record<string, unknown> = body;
  if (body.data !== undefined) {
    const dataArr = Array.isArray(body.data) ? body.data as Record<string, unknown>[] : null;
    if (dataArr && dataArr.length > 0) {
      raw = dataArr[0];
    } else if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
      raw = body.data as Record<string, unknown>;
    }
  }

  if (!raw || Object.keys(raw).length === 0) {
    throw new Error("No vehicle data in provider response");
  }

  const mfr = (raw.manufacturer ?? {}) as Record<string, unknown>;
  const mdl = (raw.model ?? {}) as Record<string, unknown>;
  const gen = (raw.generation ?? {}) as Record<string, unknown>;
  const bodyType = (raw.body_type ?? {}) as Record<string, unknown>;
  const colorObj = (raw.color ?? {}) as Record<string, unknown>;
  const engineObj = (raw.engine ?? {}) as Record<string, unknown>;
  const transmissionObj = (raw.transmission ?? {}) as Record<string, unknown>;
  const fuelObj = (raw.fuel ?? {}) as Record<string, unknown>;

  const lots = Array.isArray(raw.lots) ? raw.lots as Array<Record<string, unknown>> : [];

  let odometerKm: number | null = null;
  for (const l of lots) {
    const km = parseLotOdometerKm(l);
    if (km != null && (odometerKm == null || km > odometerKm)) odometerKm = km;
  }

  // --- Process ALL lots for richer history data ---
  let allPhotos: string[] = [];
  const mileageHistory: NormalizedVinData["mileageHistory"] = [];
  const ownerHistory: NormalizedVinData["ownerHistory"] = [];
  const auctionHistory: NormalizedVinData["auctionHistory"] = [];
  const auctionAccidents: NonNullable<NormalizedVinData["accidents"]> = [];
  let titleStatus: string | null = null;
  let isSalvageFromLots = false;
  const seenMarketplaceDomains = new Set<string>();

  for (const l of lots) {
    // Always merge photos from every lot — marketplace dedup is for history rows only.
    allPhotos = collectPhotosFromLot(l, allPhotos);

    if (isMarketplaceListingLot(l)) {
      const domain = lotDomainName(l);
      if (domain && seenMarketplaceDomains.has(domain)) continue;
      if (domain) seenMarketplaceDomains.add(domain);
    }

    // Mileage reading per lot (Copart, IAAI, Encar, and other provider domains)
    const km = parseLotOdometerKm(l);
    const saleD = resolveLotEventDate(l);
    const condition = str(l.condition);
    const lotTitle = extractLotTitle(l);
    const { primary: primaryDamage, secondary: secondaryDamage, combined: damage } = extractLotDamages(l.damage);
    const auctionPrice = Number(l.final_bid) || null;
    const lotStatus = str(l.status);
    const openingBid = Number(l.bid) || null;
    const buyNowPrice = Number(l.buy_now) || null;

    if (lotTitle) {
      if (!titleStatus) titleStatus = lotTitle;
      if (isSalvageTitle(lotTitle)) isSalvageFromLots = true;
    }

    const loc = (l.location ?? {}) as Record<string, unknown>;
    const locCountry = (loc.country ?? {}) as Record<string, unknown>;
    const locName = str(locCountry.name ?? locCountry.iso);
    const locCity = str(loc.city ?? loc.city_name);
    const locState = str(loc.state ?? loc.state_name ?? loc.region);

    if (isNorthAmericanAuctionLot(l) && (primaryDamage || secondaryDamage || lotTitle)) {
      auctionAccidents.push({
        date: saleD,
        severity: isSalvageTitle(lotTitle) ? "total_loss" : null,
        description: lotTitle,
        country: locName,
        type: "auction",
        primaryDamage,
        secondaryDamage,
        airbagDeployed: null,
        odometerAtLoss: km,
        lossAmount: null,
      });
    }

    if (km) {
      mileageHistory.push({
        date: saleD,
        odometer: km,
        unit: "km",
        source: isNorthAmericanAuctionLot(l) ? "na_auction" : "listing",
        condition,
        damage,
        primaryDamage,
        secondaryDamage,
        auctionPrice,
        lotStatus,
        titleStatus: lotTitle,
      });
    }

    // Ownership event per lot (auction = change of hands)
    ownerHistory.push({
      date: saleD,
      location: locName,
      mileage: km,
      auctionPrice,
      lotStatus,
      condition,
    });

    auctionHistory.push({
      date: saleD,
      city: locCity,
      state: locState,
      country: locName,
      condition,
      damage,
      primaryDamage,
      secondaryDamage,
      titleStatus: lotTitle,
      openingBid,
      buyNowPrice,
      finalPrice: auctionPrice,
      lotStatus,
    });
  }

  if (allPhotos.length < MAX_VIN_PHOTOS && Array.isArray(raw.photos)) {
    allPhotos = collectPhotos({ gallery: raw.photos }, allPhotos).slice(0, MAX_VIN_PHOTOS);
  }

  const photos = allPhotos.slice(0, MAX_VIN_PHOTOS);

  const country = resolveVehicleCountry(lots);

  const lotDetails = pickLotDetailsWithInspect(lots);
  const insurance = extractInsuranceV2FromLots(lots);
  const ownerChanges = Number(insurance.ownerChangeCnt ?? 0);
  const resolvedOwnerHistory = dedupeOwnerHistory(
    resolveOwnerHistoryFromLots(lots, insurance, ownerHistory),
  );
  const totalLoss = Number(insurance.totalLossCnt ?? 0);

  // Derive salvage/stolen from insurance flags and US/Canada auction title
  const isSalvageFromInsurance = totalLoss > 0
    || !!(insurance.is_salvage ?? insurance.isSalvage ?? insurance.salvage ?? insurance.totalLoss);
  const isSalvage = isSalvageFromInsurance || isSalvageFromLots;
  const isStolen = !!(insurance.stolen ?? insurance.is_stolen ?? insurance.theft ?? insurance.isStolen);

  const registryHistory = lotsHaveRegistryTimeline(lots)
    ? extractRegistryHistoryFromLots(lots)
    : [];

  const { accidents, insuranceClaims, accidentCount: resolvedAccidentCount } = resolveVinAccidents({
    country,
    insurance,
    lotDetails,
    auctionAccidents,
    registryHistory,
  });

  const hp = Number(raw.hp) || null;
  const cylinders = Number(raw.cylinders) || null;
  const engineName = str(engineObj.name) ?? (hp ? `${hp} hp` : null);

  const vehicleYear = Number(raw.year) || null;

  const sortedMileageHistory = mileageHistory.length > 0
    ? sortHistoryNewestFirst(dedupeMileageHistory(mileageHistory, vehicleYear))
    : undefined;
  const sortedOwnerHistory = resolvedOwnerHistory.length > 0
    ? sortHistoryNewestFirst(resolvedOwnerHistory)
    : undefined;
  const sortedRegistryHistory = registryHistory.length > 0
    ? sortHistoryNewestFirst(registryHistory)
    : undefined;
  const sortedAuctionHistory = auctionHistory.length > 0
    ? sortHistoryNewestFirst(dedupeAuctionHistory(auctionHistory, vehicleYear))
    : undefined;
  const resolvedOdometer = resolveLatestOdometerKm({
    odometer: odometerKm,
    country,
    mileageHistory: sortedMileageHistory,
    ownerHistory: sortedOwnerHistory,
    registryHistory: sortedRegistryHistory,
  });

  const repairedAccidents = dedupeAccidents(
    applyEncarDateRepairs(accidents, vehicleYear) ?? accidents,
    vehicleYear,
  );
  const repairedClaims = dedupeInsuranceClaims(
    applyEncarDateRepairs(insuranceClaims, vehicleYear) ?? insuranceClaims,
    vehicleYear,
  );
  const repairedRegistry = dedupeRegistryHistory(
    applyEncarDateRepairs(sortedRegistryHistory, vehicleYear) ?? sortedRegistryHistory ?? [],
    vehicleYear,
  );
  const repairedMileage = applyEncarDateRepairs(sortedMileageHistory, vehicleYear) ?? sortedMileageHistory;
  const repairedOwners = dedupeOwnerHistory(
    applyEncarDateRepairs(sortedOwnerHistory, vehicleYear) ?? sortedOwnerHistory ?? [],
    vehicleYear,
  );
  const repairedAuction = applyEncarDateRepairs(sortedAuctionHistory, vehicleYear) ?? sortedAuctionHistory;

  return {
    make: str(mfr.name),
    model: str(mdl.name),
    year: vehicleYear,
    trim: str(gen.name),
    engine: engineName,
    transmission: str(transmissionObj.name),
    fuelType: str(fuelObj.name),
    bodyType: str(bodyType.name),
    color: str(colorObj.name),
    country,
    odometer: resolvedOdometer,
    accidentCount: resolvedAccidentCount,
    ownerCount: ownerChanges + 1,
    hp,
    cylinders,
    isSalvage,
    isStolen,
    titleStatus,
    photos,
    accidents: sortHistoryNewestFirst(repairedAccidents),
    insuranceClaims: repairedClaims.length > 0 ? repairedClaims : undefined,
    registryHistory: repairedRegistry,
    mileageHistory: repairedMileage,
    ownerHistory: repairedOwners,
    auctionHistory: repairedAuction,
    marketData: buildMarketDataFromLots(lots, repairedAuction, vehicleYear),
  };
}
