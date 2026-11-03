/**
 * DB batch + one-shot boot job for catalog mileage repair.
 * Kept separate from pure repair helpers so unit tests don't need DATABASE_URL.
 */
import { db, vinCatalogTable, vinLookupsTable, systemLogsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CATALOG_MILEAGE_REPAIR_V1_MARKER,
  repairCatalogMileageData,
} from "./mileageHistoryRepair.js";
import { logger } from "./logger.js";

export type CatalogMileageRepairBatchOpts = {
  write: boolean;
  limit?: number;
  vin?: string;
};

export type CatalogMileageRepairBatchResult = {
  scanned: number;
  changed: number;
  lockedSkipped: number;
  lookupsPatched: number;
  samples: Array<{
    vin: string;
    before: number;
    after: number;
    droppedNaAuction: number;
    odometerBefore: number | null;
    odometerAfter: number | null;
  }>;
};

/** Scan catalog rows and optionally persist repaired mileageHistory. */
export async function runCatalogMileageRepairBatch(
  opts: CatalogMileageRepairBatchOpts,
): Promise<CatalogMileageRepairBatchResult> {
  const onlyVin = opts.vin?.trim().toUpperCase() ?? "";
  const where = onlyVin
    ? eq(vinCatalogTable.vin, onlyVin)
    : sql`jsonb_typeof(data->'mileageHistory') = 'array'
        AND jsonb_array_length(data->'mileageHistory') >= 2`;

  let query = db
    .select({
      id: vinCatalogTable.id,
      vin: vinCatalogTable.vin,
      data: vinCatalogTable.data,
    })
    .from(vinCatalogTable)
    .where(where);

  if (opts.limit != null && opts.limit > 0) {
    query = query.limit(opts.limit) as typeof query;
  }

  const rows = await query;
  const result: CatalogMileageRepairBatchResult = {
    scanned: 0,
    changed: 0,
    lockedSkipped: 0,
    lookupsPatched: 0,
    samples: [],
  };

  for (const row of rows) {
    result.scanned += 1;
    const data = row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
    const repaired = repairCatalogMileageData(data);
    if (repaired.skippedLocked) {
      result.lockedSkipped += 1;
      continue;
    }
    if (!repaired.changed) continue;

    result.changed += 1;
    if (result.samples.length < 20) {
      result.samples.push({
        vin: row.vin,
        before: repaired.stats.beforeCount,
        after: repaired.stats.afterCount,
        droppedNaAuction: repaired.stats.droppedNaAuction,
        odometerBefore: repaired.stats.odometerBefore,
        odometerAfter: repaired.stats.odometerAfter,
      });
    }

    if (!opts.write) continue;

    await db
      .update(vinCatalogTable)
      .set({ data: repaired.data, updatedAt: new Date() })
      .where(eq(vinCatalogTable.id, row.id));

    const lookupRows = await db
      .select({ id: vinLookupsTable.id, data: vinLookupsTable.data })
      .from(vinLookupsTable)
      .where(eq(vinLookupsTable.vin, row.vin));

    for (const lookup of lookupRows) {
      const ld = lookup.data && typeof lookup.data === "object" && !Array.isArray(lookup.data)
        ? (lookup.data as Record<string, unknown>)
        : {};
      const repairedLookup = repairCatalogMileageData(ld);
      if (!repairedLookup.changed) continue;
      await db
        .update(vinLookupsTable)
        .set({ data: repairedLookup.data, updatedAt: new Date() })
        .where(eq(vinLookupsTable.id, lookup.id));
      result.lookupsPatched += 1;
    }
  }

  return result;
}

/**
 * First production boot after deploy: repair zigzag Carstat mileage once, then mark done.
 * Safe to call on every start — no-ops after the marker row exists. Repair itself is idempotent.
 */
export async function runOneShotCatalogMileageRepairOnBoot(): Promise<CatalogMileageRepairBatchResult | null> {
  const [existing] = await db
    .select({ id: systemLogsTable.id })
    .from(systemLogsTable)
    .where(eq(systemLogsTable.message, CATALOG_MILEAGE_REPAIR_V1_MARKER))
    .limit(1);

  if (existing) {
    logger.info("Catalog mileage repair v1 already applied — skip");
    return null;
  }

  logger.info("Starting one-shot catalog mileage repair v1…");
  const summary = await runCatalogMileageRepairBatch({ write: true });

  await db.insert(systemLogsTable).values({
    level: "info",
    message: CATALOG_MILEAGE_REPAIR_V1_MARKER,
    context: JSON.stringify({
      scanned: summary.scanned,
      changed: summary.changed,
      lockedSkipped: summary.lockedSkipped,
      lookupsPatched: summary.lookupsPatched,
      samples: summary.samples,
      at: new Date().toISOString(),
    }),
  });

  logger.info(
    {
      scanned: summary.scanned,
      changed: summary.changed,
      lockedSkipped: summary.lockedSkipped,
      lookupsPatched: summary.lookupsPatched,
    },
    "Catalog mileage repair v1 complete",
  );

  return summary;
}
