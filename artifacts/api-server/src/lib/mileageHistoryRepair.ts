/**
 * Repair zigzag / false-rollback mileage timelines stored in vin_catalog.
 * Primary causes: NA auction miles mixed into KR timelines, flat-mile lots stamped as km.
 */
import { isKoreaVehicleCountry, resolveLatestOdometerKm } from "@workspace/odometer-resolve";
import { dedupeMileageHistory } from "./history-dedupe.js";

/** system_logs.message — boot runs once when this is absent. */
export const CATALOG_MILEAGE_REPAIR_V1_MARKER = "one_shot:catalog_mileage_repair_v1";

export type RepairableMileageEntry = {
  date?: string | null;
  odometer?: number | null;
  mileage?: number | null;
  unit?: string | null;
  source?: string | null;
  [key: string]: unknown;
};

export type MileageRepairStats = {
  beforeCount: number;
  afterCount: number;
  droppedNaAuction: number;
  convertedMi: number;
  droppedInvalid: number;
  odometerBefore: number | null;
  odometerAfter: number | null;
};

export type MileageRepairResult = {
  changed: boolean;
  skippedLocked: boolean;
  data: Record<string, unknown>;
  stats: MileageRepairStats;
};

function asEntry(raw: unknown): RepairableMileageEntry | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as RepairableMileageEntry;
}

function positiveOdo(entry: RepairableMileageEntry): number | null {
  const raw = entry.odometer ?? entry.mileage;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function registryHasMileage(registryHistory: unknown): boolean {
  if (!Array.isArray(registryHistory) || registryHistory.length === 0) return false;
  for (const event of registryHistory) {
    if (!event || typeof event !== "object") continue;
    const e = event as { mileage?: unknown; details?: Array<{ value?: unknown }> };
    const m = Number(e.mileage);
    if (Number.isFinite(m) && m > 0) return true;
    for (const row of e.details ?? []) {
      if (typeof row?.value === "string" && /\d/.test(row.value) && /km/i.test(row.value)) {
        return true;
      }
    }
  }
  return false;
}

/** Drop Copart/IAAI readings from Korean timelines — they create false rollbacks. */
export function shouldStripNaAuctionMileage(
  country: string | null | undefined,
  registryHistory: unknown,
): boolean {
  return isKoreaVehicleCountry(country) && registryHasMileage(registryHistory);
}

/**
 * Normalize + repair a mileageHistory array in place of catalog `data`.
 * Does not call Carstat. Respects odometerLocked.
 */
export function repairCatalogMileageData(
  input: Record<string, unknown>,
): MileageRepairResult {
  const data = { ...input };
  const locked = data.odometerLocked === true;
  const rawHistory = Array.isArray(data.mileageHistory) ? data.mileageHistory : [];
  const odometerBefore =
    data.odometer != null && Number.isFinite(Number(data.odometer)) && Number(data.odometer) > 0
      ? Math.round(Number(data.odometer))
      : null;

  const stats: MileageRepairStats = {
    beforeCount: rawHistory.length,
    afterCount: rawHistory.length,
    droppedNaAuction: 0,
    convertedMi: 0,
    droppedInvalid: 0,
    odometerBefore,
    odometerAfter: odometerBefore,
  };

  if (locked) {
    return { changed: false, skippedLocked: true, data: input, stats };
  }

  const stripNa = shouldStripNaAuctionMileage(
    typeof data.country === "string" ? data.country : null,
    data.registryHistory,
  );

  const normalized: RepairableMileageEntry[] = [];
  for (const raw of rawHistory) {
    const entry = asEntry(raw);
    if (!entry) {
      stats.droppedInvalid += 1;
      continue;
    }

    if (stripNa && entry.source === "na_auction") {
      stats.droppedNaAuction += 1;
      continue;
    }

    let odo = positiveOdo(entry);
    if (odo == null) {
      stats.droppedInvalid += 1;
      continue;
    }

    const unit = String(entry.unit ?? "km").trim().toLowerCase();
    if (unit === "mi" || unit === "mile" || unit === "miles") {
      odo = Math.round(odo * 1.60934);
      stats.convertedMi += 1;
    }

    const next: RepairableMileageEntry = {
      ...entry,
      odometer: odo,
      unit: "km",
    };
    delete next.mileage;
    normalized.push(next);
  }

  const vehicleYear =
    data.year != null && Number.isFinite(Number(data.year)) ? Number(data.year) : null;
  const deduped = dedupeMileageHistory(normalized, vehicleYear) as RepairableMileageEntry[];

  // Newest first (date desc; missing dates last by odometer desc)
  deduped.sort((a, b) => {
    const da = String(a.date ?? "");
    const db = String(b.date ?? "");
    if (da && db && da !== db) return db.localeCompare(da);
    if (da && !db) return -1;
    if (!da && db) return 1;
    return (b.odometer ?? 0) - (a.odometer ?? 0);
  });

  const repairedOdometer = resolveLatestOdometerKm({
    odometer: odometerBefore,
    country: typeof data.country === "string" ? data.country : null,
    mileageHistory: deduped,
    ownerHistory: Array.isArray(data.ownerHistory)
      ? (data.ownerHistory as Array<{ mileage?: number | null }>)
      : null,
    registryHistory: Array.isArray(data.registryHistory)
      ? (data.registryHistory as Array<{
          mileage?: number | null;
          details?: Array<{ value?: string | null }> | null;
        }>)
      : null,
  });

  stats.afterCount = deduped.length;
  stats.odometerAfter = repairedOdometer;

  const historyChanged =
    stats.droppedNaAuction > 0
    || stats.convertedMi > 0
    || stats.droppedInvalid > 0
    || stats.beforeCount !== stats.afterCount
    || JSON.stringify(rawHistory) !== JSON.stringify(deduped);

  const odoChanged = (odometerBefore ?? null) !== (repairedOdometer ?? null);

  if (!historyChanged && !odoChanged) {
    return { changed: false, skippedLocked: false, data: input, stats };
  }

  if (deduped.length > 0) data.mileageHistory = deduped;
  else delete data.mileageHistory;

  if (repairedOdometer != null) data.odometer = repairedOdometer;
  else if ("odometer" in data && !locked) delete data.odometer;

  return { changed: true, skippedLocked: false, data, stats };
}

/**
 * Ingest-time filter: strip NA auction mileage from KR+registry timelines
 * before persist (mirrors headline odometer trust rules).
 */
export function filterMileageHistoryForPersist<T extends { source?: string | null }>(
  entries: T[],
  country: string | null | undefined,
  registryHistory: unknown,
): T[] {
  if (!shouldStripNaAuctionMileage(country, registryHistory)) return entries;
  return entries.filter((e) => e.source !== "na_auction");
}
