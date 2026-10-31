/**
 * Collapse duplicate timeline rows across VIN report cards.
 * Keep aligned with artifacts/kmcheck/src/lib/history-dedupe.ts
 */

import { sanitizeReportIsoDate } from "./encar-date-repair.js";

function normalizeToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizedDateKey(
  date: string | null | undefined,
  vehicleYear?: number | null,
): string {
  return sanitizeReportIsoDate(date, vehicleYear)?.slice(0, 10)
    ?? normalizeToken(date);
}

function pickLongerText(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null | undefined {
  if (!a) return b;
  if (!b) return a;
  return a.length >= b.length ? a : b;
}

function pickPositiveNumber(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null | undefined {
  const left = typeof a === "number" && Number.isFinite(a) && a > 0 ? a : null;
  const right = typeof b === "number" && Number.isFinite(b) && b > 0 ? b : null;
  if (left == null) return right ?? a ?? b;
  if (right == null) return left;
  return Math.max(left, right);
}

function splitStampParts(value: string): string[] {
  return value
    .split(/[·|,;/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mergeStampLikeText(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null | undefined {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left) return right || b;
  if (!right) return left;
  const leftNorm = normalizeToken(left);
  const rightNorm = normalizeToken(right);
  if (leftNorm === rightNorm) return left.length >= right.length ? left : right;
  if (leftNorm.includes(rightNorm)) return left;
  if (rightNorm.includes(leftNorm)) return right;
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const part of [...splitStampParts(left), ...splitStampParts(right)]) {
    const key = normalizeToken(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    parts.push(part);
  }
  return parts.join(" · ");
}

function looksLikeDateValue(value: string): boolean {
  return /^\d{4}([-/]\d{1,2}([-/]\d{1,2})?)?/.test(value.trim())
    || /^\d{4}-\d{2}-\d{2}T/.test(value.trim());
}

function laterDateValue(
  a: string | null | undefined,
  b: string | null | undefined,
  vehicleYear?: number | null,
): string | null | undefined {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left) return right || b;
  if (!right) return left;
  const leftKey = normalizedDateKey(left, vehicleYear);
  const rightKey = normalizedDateKey(right, vehicleYear);
  if (!leftKey) return right;
  if (!rightKey) return left;
  return leftKey >= rightKey ? left : right;
}

function accidentTypeFamily(entry: {
  type?: string | null;
  severity?: string | null;
  description?: string | null;
  primaryDamage?: string | null;
}): string {
  const blob = [entry.type, entry.severity, entry.description, entry.primaryDamage]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/total[_\s-]?loss|전손|\bsalvage\b/.test(blob)) return "total_loss";
  if (/flood|침수|waterlog|water_flood/.test(blob)) return "flood";
  if (/theft|stolen|угон|도난/.test(blob)) return "theft";
  return normalizeToken(entry.type) || "accident";
}

function mergeDefinedFields<T extends Record<string, unknown>>(a: T, b: T): T {
  return {
    ...a,
    ...b,
    date: (a.date as string | null | undefined) || (b.date as string | null | undefined),
    location: pickLongerText(
      a.location as string | null | undefined,
      b.location as string | null | undefined,
    ),
    lotStatus: pickLongerText(
      a.lotStatus as string | null | undefined,
      b.lotStatus as string | null | undefined,
    ),
    condition: pickLongerText(
      a.condition as string | null | undefined,
      b.condition as string | null | undefined,
    ),
    mileage: (a.mileage as number | null | undefined) ?? (b.mileage as number | null | undefined),
    auctionPrice: (a.auctionPrice as number | null | undefined) ?? (b.auctionPrice as number | null | undefined),
    odometer: (a.odometer as number | null | undefined) ?? (b.odometer as number | null | undefined),
    subtitle: pickLongerText(
      a.subtitle as string | null | undefined,
      b.subtitle as string | null | undefined,
    ),
    amount: pickLongerText(
      a.amount as string | null | undefined,
      b.amount as string | null | undefined,
    ),
    description: pickLongerText(
      a.description as string | null | undefined,
      b.description as string | null | undefined,
    ),
    details: ((a.details as unknown[] | undefined)?.length ?? 0) >= ((b.details as unknown[] | undefined)?.length ?? 0)
      ? a.details
      : b.details,
  };
}

function richnessScore(entry: Record<string, unknown>): number {
  let score = 0;
  for (const value of Object.values(entry)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) score += value.length * 2;
    else score += 1;
  }
  return score;
}

function dedupeByKey<T extends Record<string, unknown>>(
  entries: T[],
  keyFn: (entry: T) => string,
  merge?: (a: T, b: T) => T,
): T[] {
  const byKey = new Map<string, T>();
  for (const entry of entries) {
    const key = keyFn(entry);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, entry);
      continue;
    }
    if (merge) {
      byKey.set(key, merge(existing, entry));
    } else {
      byKey.set(key, richnessScore(entry) >= richnessScore(existing) ? entry : existing);
    }
  }
  return Array.from(byKey.values());
}

export type OwnerHistoryEntry = {
  date?: string | null;
  location?: string | null;
  mileage?: number | null;
  auctionPrice?: number | null;
  lotStatus?: string | null;
  condition?: string | null;
};

export function ownerHistoryDedupeKey(
  entry: OwnerHistoryEntry,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  if (date && entry.mileage != null && entry.mileage > 0) {
    return `dm:${date}|${entry.mileage}`;
  }
  if (date) {
    const status = normalizeToken(entry.lotStatus);
    const location = normalizeToken(entry.location);
    const price = entry.auctionPrice ?? "";
    return `d:${date}|${status}|${location}|${price}`;
  }
  const status = normalizeToken(entry.lotStatus);
  const location = normalizeToken(entry.location);
  if (status || location || entry.mileage != null) {
    return `ctx:${status}|${location}|${entry.mileage ?? ""}`;
  }
  return `raw:${JSON.stringify(entry)}`;
}

export function dedupeOwnerHistory<T extends OwnerHistoryEntry>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries,
    (entry) => ownerHistoryDedupeKey(entry, vehicleYear),
    (a, b) => mergeDefinedFields(a, b),
  );
}

export type MileageHistoryEntry = {
  date?: string | null;
  odometer?: number | null;
  condition?: string | null;
  primaryDamage?: string | null;
};

export function mileageHistoryDedupeKey(
  entry: MileageHistoryEntry,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  const odometer = entry.odometer ?? -1;
  const primary = normalizeToken(entry.primaryDamage);
  return `${date}|${odometer}|${primary}`;
}

export function dedupeMileageHistory<T extends MileageHistoryEntry>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(entries, (entry) => mileageHistoryDedupeKey(entry, vehicleYear));
}

export type AuctionHistoryEntry = {
  date?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  primaryDamage?: string | null;
  finalPrice?: number | null;
};

export function auctionHistoryDedupeKey(
  entry: AuctionHistoryEntry,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  if (date) return `d:${date}`;
  const city = normalizeToken(entry.city);
  const state = normalizeToken(entry.state);
  const country = normalizeToken(entry.country);
  const finalPrice = entry.finalPrice ?? -1;
  return `undated|${city}|${state}|${country}|${finalPrice}`;
}

function mergeAuctionHistoryEntries<T extends AuctionHistoryEntry>(a: T, b: T): T {
  const merged = mergeDefinedFields(
    a as T & Record<string, unknown>,
    b as T & Record<string, unknown>,
  ) as T;
  return {
    ...merged,
    city: pickLongerText(a.city, b.city) ?? merged.city,
    state: pickLongerText(a.state, b.state) ?? merged.state,
    country: pickLongerText(a.country, b.country) ?? merged.country,
    primaryDamage: mergeStampLikeText(a.primaryDamage, b.primaryDamage) ?? merged.primaryDamage,
    finalPrice: pickPositiveNumber(a.finalPrice, b.finalPrice) ?? merged.finalPrice,
  };
}

export function dedupeAuctionHistory<T extends AuctionHistoryEntry>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries as Array<T & Record<string, unknown>>,
    (entry) => auctionHistoryDedupeKey(entry, vehicleYear),
    (a, b) => mergeAuctionHistoryEntries(a as T, b as T) as T & Record<string, unknown>,
  ) as T[];
}

export type VinAccidentEntry = {
  date?: string | null;
  type?: string | null;
  severity?: string | null;
  lossAmount?: number | null;
  description?: string | null;
  primaryDamage?: string | null;
  odometerAtLoss?: number | null;
};

export function accidentDedupeKey(
  entry: VinAccidentEntry,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  const family = accidentTypeFamily(entry);
  if (date) return `d:${date}|${family}`;
  const desc = normalizeToken(entry.description).slice(0, 48);
  const primary = normalizeToken(entry.primaryDamage);
  return `undated|${family}|${desc}|${primary}`;
}

function mergeAccidentEntries<T extends VinAccidentEntry>(a: T, b: T): T {
  const merged = mergeDefinedFields(
    a as T & Record<string, unknown>,
    b as T & Record<string, unknown>,
  ) as T;
  return {
    ...merged,
    type: pickLongerText(a.type, b.type) ?? merged.type,
    description: mergeStampLikeText(a.description, b.description) ?? merged.description,
    primaryDamage: mergeStampLikeText(a.primaryDamage, b.primaryDamage) ?? merged.primaryDamage,
    lossAmount: pickPositiveNumber(a.lossAmount, b.lossAmount) ?? merged.lossAmount,
    odometerAtLoss: pickPositiveNumber(a.odometerAtLoss, b.odometerAtLoss) ?? merged.odometerAtLoss,
  };
}

export function dedupeAccidents<T extends VinAccidentEntry>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries as Array<T & Record<string, unknown>>,
    (entry) => accidentDedupeKey(entry, vehicleYear),
    (a, b) => mergeAccidentEntries(a as T, b as T) as T & Record<string, unknown>,
  ) as T[];
}

export type InsuranceClaimEntry = {
  date?: string | null;
  type?: string | null;
  lossAmount?: number | null;
  partCost?: number | null;
  laborCost?: number | null;
  paintingCost?: number | null;
};

export function insuranceClaimDedupeKey(
  entry: InsuranceClaimEntry,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  const type = normalizeToken(entry.type);
  const loss = entry.lossAmount ?? 0;
  const part = entry.partCost ?? 0;
  const labor = entry.laborCost ?? 0;
  const paint = entry.paintingCost ?? 0;
  return `${date}|${type}|${loss}|${part}|${labor}|${paint}`;
}

export function dedupeInsuranceClaims<T extends InsuranceClaimEntry>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(entries, (entry) => insuranceClaimDedupeKey(entry, vehicleYear));
}

export type ServiceHistoryEntry = {
  date?: string | null;
  mileage?: number | null;
  title?: string | null;
  location?: string | null;
  description?: string | null;
  details?: Array<{ label: string; value: string }>;
};

/** Provider record ids like "record #8026005635" — strongest merge key. */
export function extractServiceRecordId(
  ...texts: Array<string | null | undefined>
): string | null {
  for (const text of texts) {
    if (!text) continue;
    const m = text.match(/record\s*#\s*(\d{5,})/i) ?? text.match(/#(\d{7,})/);
    if (m?.[1]) return m[1];
  }
  return null;
}

function serviceTitleCore(title: string | null | undefined): string {
  const t = normalizeToken(title);
  if (!t) return "";
  if (/korean\s+performance\s+inspection/.test(t)) return "korean_performance_inspection";
  return t
    .replace(/\s*[—–]\s*record\s*#\d+.*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function serviceHistoryDedupeKey(
  entry: ServiceHistoryEntry,
  vehicleYear?: number | null,
): string {
  const detailText = (entry.details ?? []).flatMap((d) => [d.label, d.value]);
  const recordId = extractServiceRecordId(entry.title, entry.description, ...detailText);
  if (recordId) return `rec:${recordId}`;

  const date = normalizedDateKey(entry.date, vehicleYear);
  const mileage = entry.mileage ?? -1;
  const core = serviceTitleCore(entry.title);
  if (core === "korean_performance_inspection" && date && mileage > 0) {
    return `kpi:${date}|${mileage}`;
  }
  const location = normalizeToken(entry.location);
  return `${date}|${core || normalizeToken(entry.title)}|${mileage}|${location}`;
}

function mergeServiceHistoryEntries<T extends ServiceHistoryEntry>(a: T, b: T): T {
  const merged = mergeDefinedFields(
    a as T & Record<string, unknown>,
    b as T & Record<string, unknown>,
  ) as T;
  return {
    ...merged,
    title: pickLongerText(a.title, b.title) ?? merged.title,
    description: pickLongerText(a.description, b.description) ?? merged.description,
    mileage: a.mileage ?? b.mileage ?? null,
  };
}

export function dedupeServiceHistory<T extends ServiceHistoryEntry>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries as Array<T & Record<string, unknown>>,
    (entry) => serviceHistoryDedupeKey(entry, vehicleYear),
    (a, b) => mergeServiceHistoryEntries(a as T, b as T) as T & Record<string, unknown>,
  ) as T[];
}

export type RegistryHistoryEntry = {
  date?: string | null;
  type?: string | null;
  title?: string | null;
  subtitle?: string | null;
  mileage?: number | null;
  amount?: string | null;
  location?: string | null;
  details?: Array<{ label: string; value: string }>;
};

function registryEventRichness(event: RegistryHistoryEntry): number {
  let score = 0;
  if (event.date) score += 4;
  if (event.subtitle) score += 2;
  if (event.amount) score += 2;
  if (event.location) score += 1;
  score += event.details?.length ?? 0;
  if (event.mileage != null) score += 1;
  return score;
}

export function registryHistoryDedupeKey(
  event: RegistryHistoryEntry,
  vehicleYear?: number | null,
): string {
  const title = normalizeToken(event.title).slice(0, 80);
  const date = normalizedDateKey(event.date, vehicleYear);
  const type = event.type ?? "other";
  const mileage = event.mileage ?? -1;
  const amount = normalizeToken(event.amount).slice(0, 48);
  // Empty same-day shells (no title/mileage/amount) collapse regardless of type.
  if (!title && mileage < 0 && !amount) {
    return `empty|${date}`;
  }
  return `${type}|${date}|${title}|${mileage}|${amount}`;
}

export function dedupeRegistryHistory<T extends RegistryHistoryEntry>(
  events: T[],
  vehicleYear?: number | null,
): T[] {
  const byKey = new Map<string, T>();
  for (const event of events) {
    const key = registryHistoryDedupeKey(event, vehicleYear);
    const existing = byKey.get(key);
    if (!existing || registryEventRichness(event) > registryEventRichness(existing)) {
      byKey.set(key, event);
    }
  }
  return Array.from(byKey.values());
}

export type VehicleExtraLike = {
  key?: string | null;
  label?: string | null;
  value?: string | null;
  observedAt?: string | null;
};

function extraLabelKey(entry: VehicleExtraLike): string {
  const raw = normalizeToken(entry.label) || normalizeToken(entry.key);
  if (!raw) return "";
  if (/^(hp|horsepower)$/.test(raw)) return "horsepower";
  if (/^first\s*registration/.test(raw) || raw === "firstregistration") return "first_registration";
  if (/^drive\s*type$/.test(raw) || raw === "drivetype") return "drive_type";
  if (/^auction\s*end/.test(raw) || raw === "end_time" || raw === "endtime") return "auction_end";
  return raw.replace(/\s+/g, "_");
}

export function vehicleExtraDedupeKey(entry: VehicleExtraLike): string {
  const label = extraLabelKey(entry);
  if (!label) return `raw:${normalizeToken(entry.value)}`;
  return `label:${label}`;
}

/** Hide source/marketplace branding — reports never name Carstat, Finn, AutoScout, GetCarAPI. */
export function isProviderBrandingExtra(entry: VehicleExtraLike): boolean {
  const label = extraLabelKey(entry);
  if (/^(marketplace|source|provider|provider_name|data_source|datasource)$/.test(label)) {
    return true;
  }
  const value = normalizeToken(entry.value);
  return /^(carstat|finn(\.no)?|autoscout(24)?(\s+(es|be))?|getcarapi|getcar api)$/.test(value);
}

function mergeVehicleExtraEntries<T extends VehicleExtraLike>(
  a: T,
  b: T,
  vehicleYear?: number | null,
): T {
  const labelKey = extraLabelKey(a) || extraLabelKey(b);
  const aVal = String(a.value ?? "").trim();
  const bVal = String(b.value ?? "").trim();
  let value: string | null | undefined;
  if (
    labelKey === "auction_end"
    || (looksLikeDateValue(aVal) && looksLikeDateValue(bVal))
  ) {
    value = laterDateValue(a.value, b.value, vehicleYear);
  } else if (labelKey === "first_registration" && aVal && bVal) {
    value = aVal.length >= bVal.length ? aVal : bVal;
  } else {
    value = mergeStampLikeText(a.value, b.value);
  }
  return {
    ...a,
    ...b,
    key: a.key || b.key,
    label: a.label || b.label,
    value,
    observedAt: laterDateValue(a.observedAt, b.observedAt, vehicleYear),
  };
}

export function dedupeVehicleExtras<T extends VehicleExtraLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  const visible = entries.filter((entry) => !isProviderBrandingExtra(entry));
  return dedupeByKey(
    visible as Array<T & Record<string, unknown>>,
    (entry) => vehicleExtraDedupeKey(entry),
    (a, b) => mergeVehicleExtraEntries(a as T, b as T, vehicleYear) as T & Record<string, unknown>,
  ) as T[];
}
