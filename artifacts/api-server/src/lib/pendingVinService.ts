import {
  db,
  pendingVinChecksTable,
  pendingVinCheckRequestsTable,
  vinLookupsTable,
  usersTable,
  paymentsTable,
} from "@workspace/db";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import {
  getCatalogVin,
  upsertVinCatalog,
  checkLocalExists,
  syncStampedCatalogToAllLookups,
} from "./vinService.js";
import { sanitizeCatalogPayload, catalogHasDeliverableReport, applyCatalogAdminPatch } from "./vinCatalogImport.js";
import { decodeVinPeek, isTrustworthyVinIdentity } from "./vinDecodePreview.js";
import { validateCheckDigit } from "@workspace/vin-decode";
import { logger } from "./logger.js";
import { providersTable } from "@workspace/db";
import { transformVinPhotoData } from "./imageProxy.js";
import { extractVinPhotoUrls, invalidateVinImageCache } from "./vinImageCache.js";
import { fireVinReadyEmailForUser } from "./vinReadyEmail.js";
import { firePendingVinAdminNotification } from "./pendingVinAdminEmail.js";
import { notifyVinLookupPublished } from "./vinLookupNotify.js";
import {
  applyFrozenKrwPerUsd,
  getCurrentKrwPerUsd,
  readFrozenKrwPerUsd,
} from "./krwRate.js";
import {
  prepareManualPublishCatalogData,
  finalizeAdminCatalogSave,
  detectAdminCatalogMileageTouched,
} from "./pendingVinCatalogPrep.js";

export { prepareManualPublishCatalogData, finalizeAdminCatalogSave, detectAdminCatalogMileageTouched, reconcileLockedOdometerData } from "./pendingVinCatalogPrep.js";

const MAX_VIN_PHOTOS = 24;

async function stampLookupReportData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const currentRate = await getCurrentKrwPerUsd();
  return applyFrozenKrwPerUsd(data, {
    existingRate: readFrozenKrwPerUsd(data),
    currentRate,
  });
}

function transformVinPhotos(data: unknown, mediaVersion?: number): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const transformed = transformVinPhotoData(data as Record<string, unknown>, mediaVersion) as Record<string, unknown>;
  if (Array.isArray(transformed.photos)) {
    transformed.photos = (transformed.photos as string[]).slice(0, MAX_VIN_PHOTOS);
  }
  return transformed;
}

export const PENDING_MANUAL_LOOKUP_STATUS = "pending_manual" as const;

export type VinFulfillmentMode = "standard" | "manual_pending";

export function buildManualPendingReportData(
  identity: Awaited<ReturnType<typeof decodeVinPeek>>,
): Record<string, unknown> {
  const payload = sanitizeCatalogPayload({
    make: identity.make,
    model: identity.model,
    year: identity.year,
    trim: identity.trim,
    engine: identity.engine,
    country: identity.country,
    photos: [],
    accidents: [],
    accidentCount: 0,
    mileageHistory: [],
    ownerHistory: [],
    insuranceClaims: [],
    registryHistory: [],
    auctionHistory: [],
    marketData: null,
    isSalvage: null,
    isStolen: null,
    ownerCount: null,
    odometer: null,
  });
  return { ...payload, fulfillmentPending: true };
}

export async function isVinEligibleForManualPending(vin: string): Promise<boolean> {
  const normalized = vin.trim().toUpperCase();
  if (normalized.length !== 17 || /[IOQ]/.test(normalized)) return false;

  const catalog = await getCatalogVin(normalized);
  if (catalog?.data && catalogHasDeliverableReport(catalog.data)) return false;

  const identity = await decodeVinPeek(normalized, validateCheckDigit(normalized), null);
  return isTrustworthyVinIdentity(identity, normalized);
}

/** Whether post-payment should use manual pending flow (not in catalog / local-exists). */
export async function resolveVinFulfillmentMode(vin: string): Promise<VinFulfillmentMode> {
  const normalized = vin.trim().toUpperCase();
  const catalog = await getCatalogVin(normalized);
  if (catalog?.data && catalogHasDeliverableReport(catalog.data)) return "standard";

  const [provider] = await db.select().from(providersTable)
    .where(eq(providersTable.isActive, true))
    .orderBy(providersTable.id)
    .limit(1);

  if (provider?.apiKey?.trim()) {
    const exists = await checkLocalExists(normalized, provider.baseUrl, provider.apiKey);
    if (exists.status === "exists") return "standard";
    if (exists.status === "unavailable") {
      // Provider down — still allow manual if decode is trustworthy
      return (await isVinEligibleForManualPending(normalized)) ? "manual_pending" : "standard";
    }
  }

  return (await isVinEligibleForManualPending(normalized)) ? "manual_pending" : "standard";
}

export async function getOrCreatePendingVinCheck(
  vin: string,
  identity: Awaited<ReturnType<typeof decodeVinPeek>>,
) {
  const normalized = vin.trim().toUpperCase();
  const [existing] = await db.select().from(pendingVinChecksTable)
    .where(and(
      eq(pendingVinChecksTable.vin, normalized),
      eq(pendingVinChecksTable.status, "open"),
    ))
    .limit(1);

  if (existing) return { pending: existing, isNew: false };

  const draftData = buildManualPendingReportData(identity);
  const [created] = await db.insert(pendingVinChecksTable).values({
    vin: normalized,
    status: "open",
    draftData,
  }).returning();

  return { pending: created, isNew: true };
}

export async function fulfillManualPendingVinLookup(opts: {
  vin: string;
  userId: string;
  paymentId: number | null;
}): Promise<typeof vinLookupsTable.$inferSelect> {
  const normalized = opts.vin.trim().toUpperCase();
  const identity = await decodeVinPeek(normalized, validateCheckDigit(normalized), null);

  if (!isTrustworthyVinIdentity(identity, normalized)) {
    throw Object.assign(new Error("VIN failed decoder validation"), { code: "VIN_INVALID" });
  }

  const { pending, isNew: isNewPending } = await getOrCreatePendingVinCheck(normalized, identity);
  const data = (pending.draftData as Record<string, unknown>) ?? buildManualPendingReportData(identity);

  const [lookup] = await db.insert(vinLookupsTable).values({
    vin: normalized,
    userId: opts.userId,
    status: PENDING_MANUAL_LOOKUP_STATUS,
    data,
    providerName: "manual_pending",
    fromCache: false,
    paymentId: opts.paymentId,
  }).returning();

  await db.insert(pendingVinCheckRequestsTable).values({
    pendingVinCheckId: pending.id,
    userId: opts.userId,
    paymentId: opts.paymentId,
    lookupId: lookup.id,
  });

  const [{ requestCount }] = await db.select({ requestCount: count() })
    .from(pendingVinCheckRequestsTable)
    .where(eq(pendingVinCheckRequestsTable.pendingVinCheckId, pending.id));

  const [customer] = await db.select({
    name: usersTable.name,
    email: usersTable.email,
  }).from(usersTable).where(eq(usersTable.id, opts.userId)).limit(1);

  void firePendingVinAdminNotification({
    pendingId: pending.id,
    vin: normalized,
    isNewPending,
    requestCount: requestCount ?? 1,
    customer: customer ?? null,
    vehicle: {
      year: identity.year,
      make: identity.make,
      model: identity.model,
    },
  });

  logger.info({
    msg: "manual_pending_vin_fulfilled",
    vin: normalized,
    userId: opts.userId,
    lookupId: lookup.id,
    pendingVinCheckId: pending.id,
    isNewPending,
  });

  return lookup;
}

export async function publishPendingVinCheck(opts: {
  pendingId: number;
  adminId: string;
  draftData: Record<string, unknown>;
}) {
  const [pending] = await db.select().from(pendingVinChecksTable)
    .where(eq(pendingVinChecksTable.id, opts.pendingId))
    .limit(1);

  if (!pending || pending.status !== "open") {
    throw Object.assign(new Error("Pending VIN check not found or already published"), { code: "NOT_FOUND" });
  }

  const vin = pending.vin.toUpperCase();
  const existingDraft =
    pending.draftData && typeof pending.draftData === "object" && !Array.isArray(pending.draftData)
      ? (pending.draftData as Record<string, unknown>)
      : {};
  const merged = applyCatalogAdminPatch(existingDraft, opts.draftData);
  const mileageTouched = detectAdminCatalogMileageTouched(existingDraft, opts.draftData);
  const prepared = finalizeAdminCatalogSave(merged, mileageTouched);
  const payload = sanitizeCatalogPayload(prepared);
  delete payload.fulfillmentPending;
  const stamped = await stampLookupReportData(payload);

  await upsertVinCatalog(vin, "admin", stamped);

  const now = new Date();
  await db.update(pendingVinChecksTable)
    .set({
      status: "published",
      draftData: stamped,
      updatedAt: now,
      publishedAt: now,
      publishedBy: opts.adminId,
    })
    .where(eq(pendingVinChecksTable.id, pending.id));

  const requests = await db.select().from(pendingVinCheckRequestsTable)
    .where(eq(pendingVinCheckRequestsTable.pendingVinCheckId, pending.id));

  const lookupIds = requests.map((r) => r.lookupId).filter((id): id is number => id != null);
  await syncStampedCatalogToAllLookups(vin, stamped, now, {
    promoteLookupIds: lookupIds,
    promoteAllPendingManual: true,
  });

  await invalidateVinImageCache(extractVinPhotoUrls(stamped));

  notifyVinLookupPublished(vin);

  const notifiedUsers = new Set<string>();
  for (const req of requests) {
    if (!req.notifyOnPublish || req.notifiedAt) continue;
    if (notifiedUsers.has(req.userId)) {
      await db.update(pendingVinCheckRequestsTable)
        .set({ notifiedAt: now })
        .where(eq(pendingVinCheckRequestsTable.id, req.id));
      continue;
    }
    const [user] = await db.select({
      name: usersTable.name,
      email: usersTable.email,
    }).from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (user?.email) {
      const sent = await fireVinReadyEmailForUser(req.lookupId, vin, stamped, user);
      if (sent) notifiedUsers.add(req.userId);
      if (sent) {
        await db.update(pendingVinCheckRequestsTable)
          .set({ notifiedAt: now })
          .where(eq(pendingVinCheckRequestsTable.id, req.id));
      }
    }
  }

  return { vin, stamped, requests, lookupIds };
}

export async function savePendingVinCheckDraft(opts: {
  pendingId: number;
  draftData: Record<string, unknown>;
}) {
  const [pending] = await db.select().from(pendingVinChecksTable)
    .where(eq(pendingVinChecksTable.id, opts.pendingId))
    .limit(1);

  if (!pending || pending.status !== "open") {
    throw Object.assign(new Error("Pending VIN check not found or already published"), { code: "NOT_FOUND" });
  }

  const existingDraft =
    pending.draftData && typeof pending.draftData === "object" && !Array.isArray(pending.draftData)
      ? (pending.draftData as Record<string, unknown>)
      : {};

  const merged = applyCatalogAdminPatch(existingDraft, opts.draftData);
  const mileageTouched = detectAdminCatalogMileageTouched(existingDraft, opts.draftData);
  const prepared = finalizeAdminCatalogSave(merged, mileageTouched);
  const payload = sanitizeCatalogPayload(prepared);
  const stamped = await stampLookupReportData({ ...payload, fulfillmentPending: true });

  const now = new Date();
  await db.update(pendingVinChecksTable)
    .set({ draftData: stamped, updatedAt: now })
    .where(eq(pendingVinChecksTable.id, pending.id));

  const requests = await db.select({ lookupId: pendingVinCheckRequestsTable.lookupId })
    .from(pendingVinCheckRequestsTable)
    .where(eq(pendingVinCheckRequestsTable.pendingVinCheckId, pending.id));

  const lookupIds = requests.map((r) => r.lookupId).filter((id): id is number => id != null);
  if (lookupIds.length > 0) {
    await db.update(vinLookupsTable)
      .set({
        data: stamped,
        updatedAt: now,
      })
      .where(and(
        inArray(vinLookupsTable.id, lookupIds),
        eq(vinLookupsTable.status, PENDING_MANUAL_LOOKUP_STATUS),
      ));
  }

  const [updated] = await db.select().from(pendingVinChecksTable)
    .where(eq(pendingVinChecksTable.id, pending.id))
    .limit(1);

  return updated!;
}

export function mediaVersionFromUpdatedAt(d: Date | string | null | undefined): number {
  if (!d) return 0;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

export function serializeLookupForClient(
  lookup: typeof vinLookupsTable.$inferSelect,
) {
  const mediaVersion = mediaVersionFromUpdatedAt(lookup.updatedAt);
  return {
    ...lookup,
    data: transformVinPhotos(lookup.data, mediaVersion),
    isPendingManual: lookup.status === PENDING_MANUAL_LOOKUP_STATUS,
  };
}

export async function listPendingVinChecksForAdmin(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const items = await db.select().from(pendingVinChecksTable)
    .where(eq(pendingVinChecksTable.status, "open"))
    .orderBy(desc(pendingVinChecksTable.updatedAt))
    .limit(limit)
    .offset(offset);

  const enriched = await Promise.all(items.map(async (row) => {
    const requests = await db.select({
      id: pendingVinCheckRequestsTable.id,
      userId: pendingVinCheckRequestsTable.userId,
      paymentId: pendingVinCheckRequestsTable.paymentId,
      lookupId: pendingVinCheckRequestsTable.lookupId,
      createdAt: pendingVinCheckRequestsTable.createdAt,
      email: usersTable.email,
      name: usersTable.name,
    })
      .from(pendingVinCheckRequestsTable)
      .leftJoin(usersTable, eq(usersTable.id, pendingVinCheckRequestsTable.userId))
      .where(eq(pendingVinCheckRequestsTable.pendingVinCheckId, row.id));

    return { ...row, requests };
  }));

  return enriched;
}

export async function getPendingVinCheckById(id: number) {
  const [row] = await db.select().from(pendingVinChecksTable)
    .where(eq(pendingVinChecksTable.id, id))
    .limit(1);
  if (!row) return null;

  const requests = await db.select({
    id: pendingVinCheckRequestsTable.id,
    userId: pendingVinCheckRequestsTable.userId,
    paymentId: pendingVinCheckRequestsTable.paymentId,
    lookupId: pendingVinCheckRequestsTable.lookupId,
    createdAt: pendingVinCheckRequestsTable.createdAt,
    email: usersTable.email,
    name: usersTable.name,
  })
    .from(pendingVinCheckRequestsTable)
    .leftJoin(usersTable, eq(usersTable.id, pendingVinCheckRequestsTable.userId))
    .where(eq(pendingVinCheckRequestsTable.pendingVinCheckId, row.id));

  return { ...row, requests };
}

export function buildPendingVinExportPayload(row: {
  id: number;
  vin: string;
  status: string;
  draftData: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    format: "kmcheck-pending-vin",
    version: 1,
    exportedAt: new Date().toISOString(),
    id: row.id,
    vin: row.vin,
    status: row.status,
    draftData: row.draftData ?? {},
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

function extractDraftFromImportPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw Object.assign(new Error("Expected a JSON object"), { code: "INVALID_PAYLOAD" });
  }
  const obj = payload as Record<string, unknown>;
  if (obj.draftData && typeof obj.draftData === "object" && !Array.isArray(obj.draftData)) {
    return obj.draftData as Record<string, unknown>;
  }
  const { format: _f, version: _v, exportedAt: _e, id: _id, vin: _vin, status: _s, createdAt: _c, updatedAt: _u, ...rest } = obj;
  if (Object.keys(rest).length > 0) return rest;
  throw Object.assign(new Error("No draftData found in import file"), { code: "INVALID_PAYLOAD" });
}

export async function importPendingVinDraftFromJson(opts: {
  pendingId: number;
  payload: unknown;
}) {
  const draftData = extractDraftFromImportPayload(opts.payload);
  return savePendingVinCheckDraft({ pendingId: opts.pendingId, draftData });
}

export async function buildAllPendingVinExportPayload() {
  const rows = await db.select().from(pendingVinChecksTable)
    .where(eq(pendingVinChecksTable.status, "open"))
    .orderBy(desc(pendingVinChecksTable.updatedAt));
  return {
    format: "kmcheck-pending-vin-list",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: rows.length,
    items: rows.map((row) => buildPendingVinExportPayload(row)),
  };
}

export async function importPendingVinDraftsFromJson(payload: unknown) {
  let entries: unknown[];
  if (Array.isArray(payload)) {
    entries = payload;
  } else if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)) {
    entries = (payload as { items: unknown[] }).items;
  } else if (payload && typeof payload === "object") {
    entries = [payload];
  } else {
    throw Object.assign(new Error("Expected a JSON array or { items: [...] }"), { code: "INVALID_PAYLOAD" });
  }

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        skipped++;
        continue;
      }
      const obj = entry as Record<string, unknown>;
      const vin = String(obj.vin ?? "").trim().toUpperCase();
      const pendingIdRaw = obj.id;
      const pendingId = typeof pendingIdRaw === "number"
        ? pendingIdRaw
        : parseInt(String(pendingIdRaw ?? ""), 10);
      const draftData = extractDraftFromImportPayload(entry);

      let targetId = Number.isFinite(pendingId) ? pendingId : null;
      if (!targetId && vin.length === 17) {
        const [row] = await db.select({ id: pendingVinChecksTable.id })
          .from(pendingVinChecksTable)
          .where(and(
            eq(pendingVinChecksTable.vin, vin),
            eq(pendingVinChecksTable.status, "open"),
          ))
          .limit(1);
        targetId = row?.id ?? null;
      }
      if (!targetId) {
        skipped++;
        errors.push(vin || `id:${String(obj.id ?? "?")}`);
        continue;
      }
      await savePendingVinCheckDraft({ pendingId: targetId, draftData });
      updated++;
    } catch (err) {
      skipped++;
      errors.push(String((err as Error).message ?? err));
    }
  }

  return { updated, skipped, errors: errors.slice(0, 20) };
}

/** Remove an open pending VIN check, delete linked client lookups, and revoke their payments. */
export async function removePendingVinCheck(opts: { pendingId: number; adminId?: string }) {
  const row = await getPendingVinCheckById(opts.pendingId);
  if (!row || row.status !== "open") {
    throw Object.assign(new Error("Pending VIN check not found"), { code: "NOT_FOUND" });
  }

  const lookupIds = row.requests.map((r) => r.lookupId).filter((id): id is number => id != null);
  const paymentIds = [...new Set(row.requests.map((r) => r.paymentId).filter((id): id is number => id != null))];
  const userIds = [...new Set(row.requests.map((r) => r.userId))];
  const vin = row.vin.toUpperCase();
  const now = new Date();
  const revokedPaymentIds = new Set<number>();

  await db.transaction(async (tx) => {
    if (lookupIds.length > 0) {
      await tx.delete(vinLookupsTable).where(inArray(vinLookupsTable.id, lookupIds));
    }

    if (paymentIds.length > 0) {
      const revokedById = await tx.update(paymentsTable)
        .set({ status: "revoked", updatedAt: now })
        .where(and(
          inArray(paymentsTable.id, paymentIds),
          eq(paymentsTable.status, "completed"),
        ))
        .returning({ id: paymentsTable.id });
      for (const row of revokedById) revokedPaymentIds.add(row.id);
    }

    for (const userId of userIds) {
      const revokedByUser = await tx.update(paymentsTable)
        .set({ status: "revoked", updatedAt: now })
        .where(and(
          eq(paymentsTable.userId, userId),
          eq(paymentsTable.vin, vin),
          eq(paymentsTable.status, "completed"),
        ))
        .returning({ id: paymentsTable.id });
      for (const row of revokedByUser) revokedPaymentIds.add(row.id);
    }

    await tx.delete(pendingVinCheckRequestsTable)
      .where(eq(pendingVinCheckRequestsTable.pendingVinCheckId, opts.pendingId));
    await tx.delete(pendingVinChecksTable).where(eq(pendingVinChecksTable.id, opts.pendingId));
  });

  logger.info({
    msg: "pending_vin_removed",
    pendingId: opts.pendingId,
    vin,
    adminId: opts.adminId,
    removedLookupIds: lookupIds,
    revokedPaymentIds: [...revokedPaymentIds],
  });

  return { vin, removedLookupIds: lookupIds, paymentsRevoked: revokedPaymentIds.size };
}
