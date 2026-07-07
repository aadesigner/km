import {
  parseKmFromText,
  resolveLatestOdometerKm,
  type OdometerResolveInput,
} from "@workspace/odometer-resolve";
import { historyDateSortKey } from "@/lib/history-sort";

export {
  isKoreaVehicleCountry,
  parseKmFromText,
  resolveLatestOdometerKm,
  type OdometerResolveInput,
} from "@workspace/odometer-resolve";

export type MileageSourceInput = OdometerResolveInput & {
  mileageHistory?: Array<{
    odometer?: number | null;
    date?: string | null;
    source?: string | null;
  }> | null;
  ownerHistory?: Array<{ mileage?: number | null; date?: string | null }> | null;
  registryHistory?: Array<{
    mileage?: number | null;
    date?: string | null;
    details?: Array<{ value?: string | null }> | null;
  }> | null;
};

type DatedReading = { km: number; date?: string | null };

function yearFromHistoryDate(date: string | null | undefined): number | null {
  if (!date?.trim()) return null;
  const trimmed = date.trim();
  const iso = trimmed.match(/^(\d{4})-\d{2}-\d{2}/);
  if (iso) return Number(iso[1]);
  const key = historyDateSortKey(trimmed);
  if (!Number.isFinite(key) || key === Number.NEGATIVE_INFINITY) return null;
  return new Date(key).getUTCFullYear();
}

function collectDatedReadings(input: MileageSourceInput): DatedReading[] {
  const out: DatedReading[] = [];
  const add = (km?: number | null, date?: string | null) => {
    if (km != null && km > 0) out.push({ km, date });
  };

  if (input.odometer != null && input.odometer > 0) {
    const listingMatch = input.mileageHistory?.find((e) => e.odometer === input.odometer);
    add(input.odometer, listingMatch?.date);
  }

  for (const entry of input.mileageHistory ?? []) {
    if (entry.source === "na_auction") continue;
    add(entry.odometer, entry.date);
  }

  for (const entry of input.ownerHistory ?? []) {
    add(entry.mileage, entry.date);
  }

  for (const event of input.registryHistory ?? []) {
    add(event.mileage, event.date);
    for (const row of event.details ?? []) {
      add(parseKmFromText(row.value), event.date);
    }
  }

  return out;
}

function newestDatedReading(readings: DatedReading[]): DatedReading | null {
  let best: DatedReading | null = null;
  let bestKey = Number.NEGATIVE_INFINITY;
  for (const reading of readings) {
    if (!reading.date?.trim()) continue;
    const key = historyDateSortKey(reading.date);
    if (key > bestKey) {
      bestKey = key;
      best = reading;
    }
  }
  return best;
}

/** Highest km reading from listing odometer + mileage/ownership/registry history. */
export function resolveLatestRecordedOdometer(input: MileageSourceInput): number | null {
  return resolveLatestOdometerKm(input);
}

/** Calendar year of the dated reading that matches the resolved latest odometer (when known). */
export function resolveLatestOdometerRecordedYear(input: MileageSourceInput): number | null {
  const km = resolveLatestRecordedOdometer(input);
  if (km == null) return null;

  const readings = collectDatedReadings(input);
  const matching = readings.filter((r) => r.km === km);
  const dated = newestDatedReading(matching.length > 0 ? matching : readings);
  return yearFromHistoryDate(dated?.date);
}
