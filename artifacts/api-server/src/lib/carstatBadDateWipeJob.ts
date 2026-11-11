/**
 * DB batch + one-shot boot job: strip Carstat 2026-09-17/18 event dates from catalog + lookups.
 */
import { db, vinCatalogTable, vinLookupsTable, systemLogsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import {
  CARSTAT_BAD_DATE_WIPE_V1_MARKER,
  dataTextMayContainCarstatBadDate,
  wipeCarstatBadDatesFromData,
} from "./carstatBadDateWipe.js";
import { logger } from "./logger.js";

export type CarstatBadDateWipeBatchOpts = {
  write: boolean;
  limit?: number;
  vin?: string;
};

export type CarstatBadDateWipeBatchResult = {
  scanned: number;
  changed: number;
  lookupsPatched: number;
  droppedHistory: number;
  droppedExtras: number;
  samples: Array<{
    vin: string;
    droppedHistory: number;
    droppedExtras: number;
    clearedLastAuctionDate: boolean;
  }>;
};

/** Carstat local only (not USA HTML reports). */
const carstatLocalProvider = sql`
  lower(coalesce(${vinCatalogTable.providerName}, '')) like 'carstat%'
  and lower(coalesce(${vinCatalogTable.providerName}, '')) not like '%usa%'
`;

const badDateText = sql`(
  ${vinCatalogTable.data}::text like '%2026-09-17%'
  or ${vinCatalogTable.data}::text like '%2026-09-18%'
)`;

export async function runCarstatBadDateWipeBatch(
  opts: CarstatBadDateWipeBatchOpts,
): Promise<CarstatBadDateWipeBatchResult> {
  const onlyVin = opts.vin?.trim().toUpperCase() ?? "";
  const where = onlyVin
    ? and(eq(vinCatalogTable.vin, onlyVin), carstatLocalProvider)
    : and(carstatLocalProvider, badDateText);

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
  const result: CarstatBadDateWipeBatchResult = {
    scanned: 0,
    changed: 0,
    lookupsPatched: 0,
    droppedHistory: 0,
    droppedExtras: 0,
    samples: [],
  };

  for (const row of rows) {
    result.scanned += 1;
    const data =
      row.data && typeof row.data === "object" && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {};

    if (!dataTextMayContainCarstatBadDate(data)) continue;

    const wiped = wipeCarstatBadDatesFromData(data);
    if (!wiped.changed) continue;

    result.changed += 1;
    result.droppedHistory += wiped.stats.droppedHistory;
    result.droppedExtras += wiped.stats.droppedExtras;
    if (result.samples.length < 30) {
      result.samples.push({
        vin: row.vin,
        droppedHistory: wiped.stats.droppedHistory,
        droppedExtras: wiped.stats.droppedExtras,
        clearedLastAuctionDate: wiped.stats.clearedLastAuctionDate,
      });
    }

    if (!opts.write) continue;

    await db
      .update(vinCatalogTable)
      .set({ data: wiped.data, updatedAt: new Date() })
      .where(eq(vinCatalogTable.id, row.id));

    const lookupRows = await db
      .select({ id: vinLookupsTable.id, data: vinLookupsTable.data })
      .from(vinLookupsTable)
      .where(eq(vinLookupsTable.vin, row.vin));

    for (const lookup of lookupRows) {
      const ld =
        lookup.data && typeof lookup.data === "object" && !Array.isArray(lookup.data)
          ? (lookup.data as Record<string, unknown>)
          : {};
      if (!dataTextMayContainCarstatBadDate(ld)) continue;
      const wipedLookup = wipeCarstatBadDatesFromData(ld);
      if (!wipedLookup.changed) continue;
      await db
        .update(vinLookupsTable)
        .set({ data: wipedLookup.data, updatedAt: new Date() })
        .where(eq(vinLookupsTable.id, lookup.id));
      result.lookupsPatched += 1;
    }
  }

  return result;
}

/** First production boot after deploy: wipe once, then mark done. Idempotent. */
export async function runOneShotCarstatBadDateWipeOnBoot(): Promise<CarstatBadDateWipeBatchResult | null> {
  const [existing] = await db
    .select({ id: systemLogsTable.id })
    .from(systemLogsTable)
    .where(eq(systemLogsTable.message, CARSTAT_BAD_DATE_WIPE_V1_MARKER))
    .limit(1);

  if (existing) {
    logger.info("Carstat bad-date wipe v1 already applied — skip");
    return null;
  }

  logger.info("Starting one-shot Carstat bad-date wipe (2026-09-17/18)…");
  const summary = await runCarstatBadDateWipeBatch({ write: true });

  await db.insert(systemLogsTable).values({
    level: "info",
    message: CARSTAT_BAD_DATE_WIPE_V1_MARKER,
    context: JSON.stringify({
      scanned: summary.scanned,
      changed: summary.changed,
      lookupsPatched: summary.lookupsPatched,
      droppedHistory: summary.droppedHistory,
      droppedExtras: summary.droppedExtras,
      samples: summary.samples,
      at: new Date().toISOString(),
    }),
  });

  logger.info(
    {
      scanned: summary.scanned,
      changed: summary.changed,
      lookupsPatched: summary.lookupsPatched,
      droppedHistory: summary.droppedHistory,
      droppedExtras: summary.droppedExtras,
    },
    "Carstat bad-date wipe v1 complete",
  );

  return summary;
}
