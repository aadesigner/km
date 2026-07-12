/** Earliest model year we offer paid history lookups for. */
export const MIN_VEHICLE_LOOKUP_YEAR = 2008;

export function plausibleDecodedYear(year: number | null | undefined): year is number {
  if (year == null || !Number.isFinite(year)) return false;
  const max = new Date().getFullYear() + 2;
  return year >= 1980 && year <= max;
}

/** True when decoder returned a confident year before {@link MIN_VEHICLE_LOOKUP_YEAR}. */
export function isVehicleTooOldForLookup(year: number | null | undefined): boolean {
  return plausibleDecodedYear(year) && year < MIN_VEHICLE_LOOKUP_YEAR;
}

export function isVehicleEligibleForHistoryLookup(year: number | null | undefined): boolean {
  return !isVehicleTooOldForLookup(year);
}
