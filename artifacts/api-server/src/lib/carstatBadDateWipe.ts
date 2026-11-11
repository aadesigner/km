/**
 * Strip known-bad Carstat event dates (2026-09-17 / 2026-09-18) from stored VIN JSON.
 * Those days were stamped incorrectly onto mileage / auction / extras — wipe entries, keep the rest.
 */
import { resolveLatestOdometerKm } from "@workspace/odometer-resolve";

/** system_logs.message — boot runs once when this is absent. */
export const CARSTAT_BAD_DATE_WIPE_V1_MARKER = "one_shot:carstat_bad_date_wipe_v1";

/** YYYY-MM-DD prefixes to remove from history / extras. */
export const CARSTAT_BAD_DATE_PREFIXES = ["2026-09-17", "2026-09-18"] as const;

const HISTORY_ARRAY_KEYS = [
  "mileageHistory",
  "ownerHistory",
  "auctionHistory",
  "accidents",
  "insuranceClaims",
  "serviceHistory",
  "registryHistory",
  "recallHistory",
] as const;

export type CarstatBadDateWipeStats = {
  droppedHistory: number;
  droppedExtras: number;
  clearedLastAuctionDate: boolean;
  odometerBefore: number | null;
  odometerAfter: number | null;
};

export type CarstatBadDateWipeResult = {
  changed: boolean;
  data: Record<string, unknown>;
  stats: CarstatBadDateWipeStats;
};

export function isCarstatBadEventDate(raw: unknown): boolean {
  if (raw == null) return false;
  const s = String(raw).trim();
  if (!s) return false;
  for (const prefix of CARSTAT_BAD_DATE_PREFIXES) {
    if (s === prefix || s.startsWith(`${prefix}T`) || s.startsWith(`${prefix} `)) {
      return true;
    }
  }
  return false;
}

function filterDatedArray(raw: unknown): { next: unknown; dropped: number } {
  if (!Array.isArray(raw)) return { next: raw, dropped: 0 };
  const kept: unknown[] = [];
  let dropped = 0;
  for (const item of raw) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const date = (item as { date?: unknown }).date;
      if (isCarstatBadEventDate(date)) {
        dropped += 1;
        continue;
      }
    }
    kept.push(item);
  }
  return { next: kept, dropped };
}

function positiveOdo(raw: unknown): number | null {
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/**
 * Pure transform: remove history/extras rows stamped with the bad Carstat dates.
 * Recalculates unlocked odometer from remaining mileage when possible.
 */
export function wipeCarstatBadDatesFromData(
  input: Record<string, unknown>,
): CarstatBadDateWipeResult {
  const data: Record<string, unknown> = { ...input };
  const locked = data.odometerLocked === true;
  const odometerBefore = positiveOdo(data.odometer ?? data.mileage);

  const stats: CarstatBadDateWipeStats = {
    droppedHistory: 0,
    droppedExtras: 0,
    clearedLastAuctionDate: false,
    odometerBefore,
    odometerAfter: odometerBefore,
  };

  for (const key of HISTORY_ARRAY_KEYS) {
    if (!(key in data)) continue;
    const { next, dropped } = filterDatedArray(data[key]);
    if (dropped > 0) {
      data[key] = next;
      stats.droppedHistory += dropped;
    }
  }

  if (Array.isArray(data.vehicleExtras)) {
    const kept: unknown[] = [];
    for (const item of data.vehicleExtras) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const observedAt = (item as { observedAt?: unknown }).observedAt;
        if (isCarstatBadEventDate(observedAt)) {
          stats.droppedExtras += 1;
          continue;
        }
      }
      kept.push(item);
    }
    if (stats.droppedExtras > 0) {
      data.vehicleExtras = kept;
    }
  }

  const market =
    data.marketData && typeof data.marketData === "object" && !Array.isArray(data.marketData)
      ? { ...(data.marketData as Record<string, unknown>) }
      : null;
  if (market && isCarstatBadEventDate(market.lastAuctionDate)) {
    market.lastAuctionDate = null;
    data.marketData = market;
    stats.clearedLastAuctionDate = true;
  }

  const changed =
    stats.droppedHistory > 0
    || stats.droppedExtras > 0
    || stats.clearedLastAuctionDate;

  if (!changed) {
    return { changed: false, data: input, stats };
  }

  if (!locked) {
    const repairedOdometer = resolveLatestOdometerKm({
      odometer: odometerBefore,
      country: typeof data.country === "string" ? data.country : null,
      mileageHistory: Array.isArray(data.mileageHistory)
        ? (data.mileageHistory as Array<{ date?: string | null; odometer?: number | null; mileage?: number | null }>)
        : null,
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
    stats.odometerAfter = repairedOdometer;
    if (repairedOdometer != null) {
      data.odometer = repairedOdometer;
      data.mileage = repairedOdometer;
    } else if (odometerBefore != null && stats.droppedHistory > 0) {
      // Bad-dated mileage was the only reading — clear stale scalar.
      const mileageLeft = Array.isArray(data.mileageHistory) ? data.mileageHistory.length : 0;
      if (mileageLeft === 0) {
        data.odometer = null;
        data.mileage = null;
        stats.odometerAfter = null;
      }
    }
  }

  return { changed: true, data, stats };
}

/** Fast prefilter: JSON text contains either bad day. */
export function dataTextMayContainCarstatBadDate(raw: unknown): boolean {
  if (raw == null) return false;
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text.includes("2026-09-17") || text.includes("2026-09-18");
}
