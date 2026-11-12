/**
 * Collapse duplicate timeline rows across VIN report cards.
 * Keys normalize dates so "April 16, 2019" and "2019-04-16" match.
 */

import { sanitizeReportIsoDate } from "@/lib/encar-date-repair";

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
  // Protect thousands separators so "20,200 USD" / "24.009.000 KRW" are not
  // shredded into "20 · 200 USD" when merging same-label extras.
  const protectedValue = value
    .replace(/(\d),(\d{3})\b/g, "$1\u2011$2")
    .replace(/(\d)\.(\d{3})\b/g, "$1\u2011$2");
  return protectedValue
    .split(/[·|,;/]+/)
    .map((part) => part.replace(/\u2011/g, ",").trim())
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

function pickAuctionLotStatus(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null | undefined {
  const rank = (value: string | null | undefined) => {
    const token = normalizeToken(value);
    if (/sold|sale/.test(token)) return 3;
    if (/listed|active/.test(token)) return 2;
    if (token) return 1;
    return 0;
  };
  return rank(a) >= rank(b) ? (a || b) : (b || a);
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

export type OwnerHistoryLike = {
  date?: string | null;
  location?: string | null;
  mileage?: number | null;
  auctionPrice?: number | null;
  lotStatus?: string | null;
  condition?: string | null;
};

export function ownerHistoryDedupeKey(
  entry: OwnerHistoryLike,
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

export function dedupeOwnerHistory<T extends OwnerHistoryLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries,
    (entry) => ownerHistoryDedupeKey(entry, vehicleYear),
    (a, b) => mergeDefinedFields(a, b),
  );
}

export type MileageHistoryLike = {
  date?: string | null;
  odometer?: number | null;
  unit?: string | null;
  source?: string | null;
  condition?: string | null;
  damage?: string | null;
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  auctionPrice?: number | null;
  currency?: string | null;
  lotStatus?: string | null;
  titleStatus?: string | null;
  location?: string | null;
  description?: string | null;
};

/** Prefer real auction houses over Archive Alpha placeholder market labels. */
export function mileageSourceRank(source: string | null | undefined): number {
  const s = normalizeToken(source);
  if (!s) return 0;
  if (/copart/.test(s)) return 100;
  if (/iaai|insurance\s*auto\s*auction/.test(s)) return 95;
  if (/encar/.test(s)) return 85;
  if (/manheim/.test(s)) return 80;
  if (/korean\s*inspection|inspection|registry|insurance|export/.test(s)) return 70;
  if (/first\s*registration|initial\s*registration/.test(s)) return 60;
  if (/european\s*marketplace|korean\s*marketplace|us\s*auction|^listing$|^marketplace$/.test(s)) {
    return 5;
  }
  return 40;
}

export function isWeakMileageSource(source: string | null | undefined): boolean {
  return mileageSourceRank(source) <= 5;
}

/** Same-day scrapes often disagree by tens of km — not three real readings. */
export function sameDayOdometersClose(a: number, b: number): boolean {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left <= 0 || right <= 0) return false;
  const diff = Math.abs(left - right);
  if (diff <= 500) return true;
  const max = Math.max(left, right);
  return max > 0 && diff / max <= 0.015;
}

function mileageDamageRichness(entry: MileageHistoryLike): number {
  const primary = (entry.primaryDamage ?? entry.damage ?? "").trim();
  const secondary = (entry.secondaryDamage ?? "").trim();
  let score = primary.length + (secondary ? secondary.length + 12 : 0);
  if (/^cosmetic$/i.test(primary) && !secondary) score -= 8;
  return score;
}

export function mergeMileageHistoryEntries<T extends MileageHistoryLike>(a: T, b: T): T {
  const aRank = mileageSourceRank(a.source);
  const bRank = mileageSourceRank(b.source);
  const preferA =
    aRank > bRank
    || (aRank === bRank && mileageDamageRichness(a) >= mileageDamageRichness(b));
  const primary = preferA ? a : b;
  const secondary = preferA ? b : a;
  const aOdo = Number(a.odometer);
  const bOdo = Number(b.odometer);
  const odometer =
    preferA && Number.isFinite(aOdo) && aOdo > 0
      ? aOdo
      : (!preferA && Number.isFinite(bOdo) && bOdo > 0
        ? bOdo
        : pickPositiveNumber(a.odometer, b.odometer) ?? a.odometer ?? b.odometer);

  return {
    ...secondary,
    ...primary,
    date: primary.date || secondary.date,
    odometer,
    unit: primary.unit || secondary.unit,
    source: primary.source || secondary.source,
    condition: pickLongerText(primary.condition, secondary.condition),
    damage: pickLongerText(primary.damage, secondary.damage),
    primaryDamage:
      mileageDamageRichness(primary) >= mileageDamageRichness(secondary)
        ? (primary.primaryDamage || primary.damage || secondary.primaryDamage || secondary.damage)
        : (secondary.primaryDamage || secondary.damage || primary.primaryDamage || primary.damage),
    secondaryDamage: primary.secondaryDamage || secondary.secondaryDamage,
    auctionPrice: primary.auctionPrice ?? secondary.auctionPrice,
    currency: primary.currency || secondary.currency,
    lotStatus: pickAuctionLotStatus(primary.lotStatus, secondary.lotStatus),
    titleStatus: pickLongerText(primary.titleStatus, secondary.titleStatus),
    location: pickLongerText(primary.location, secondary.location),
    description: pickLongerText(primary.description, secondary.description),
  };
}

export function mileageHistoryDedupeKey(
  entry: MileageHistoryLike,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  const odometer = entry.odometer ?? -1;
  const primary = normalizeToken(entry.primaryDamage);
  return `${date}|${odometer}|${primary}`;
}

/**
 * Collapse provider mashups: same calendar day + near-equal odometer
 * (Copart 93,540 / US Auction 93,580 / Korean Marketplace 93,500) → one row.
 * Far-apart same-day readings (possible rollback) stay separate.
 */
export function dedupeMileageHistory<T extends MileageHistoryLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  if (entries.length <= 1) return entries;

  const byDate = new Map<string, T[]>();
  const undated: T[] = [];
  for (const entry of entries) {
    const dateKey = normalizedDateKey(entry.date, vehicleYear);
    if (!dateKey) {
      undated.push(entry);
      continue;
    }
    const bucket = byDate.get(dateKey) ?? [];
    bucket.push(entry);
    byDate.set(dateKey, bucket);
  }

  const out: T[] = [...undated];
  for (const group of byDate.values()) {
    const clusters: T[][] = [];
    for (const entry of group) {
      const odo = Number(entry.odometer);
      let placed = false;
      for (const cluster of clusters) {
        const seed = Number(cluster[0]?.odometer);
        if (
          Number.isFinite(odo)
          && Number.isFinite(seed)
          && sameDayOdometersClose(odo, seed)
        ) {
          cluster.push(entry);
          placed = true;
          break;
        }
      }
      if (!placed) clusters.push([entry]);
    }

    for (const cluster of clusters) {
      // Drop weak marketplace stubs when a real house reading exists in the cluster.
      const hasStrong = cluster.some((e) => !isWeakMileageSource(e.source));
      const usable = hasStrong
        ? cluster.filter((e) => !isWeakMileageSource(e.source))
        : cluster;
      const merged = usable.reduce((acc, cur) => mergeMileageHistoryEntries(acc, cur));
      out.push(merged);
    }
  }

  return out;
}

export type AuctionHistoryLike = {
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
  currency?: string | null;
};

export function auctionHistoryDedupeKey(
  entry: AuctionHistoryLike,
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

function mergeAuctionHistoryEntries<T extends AuctionHistoryLike>(a: T, b: T): T {
  const merged = mergeDefinedFields(
    a as T & Record<string, unknown>,
    b as T & Record<string, unknown>,
  ) as T;
  return {
    ...merged,
    city: pickLongerText(a.city, b.city) ?? merged.city,
    state: pickLongerText(a.state, b.state) ?? merged.state,
    country: pickLongerText(a.country, b.country) ?? merged.country,
    condition: pickLongerText(a.condition, b.condition) ?? merged.condition,
    damage: mergeStampLikeText(a.damage, b.damage) ?? merged.damage,
    primaryDamage: mergeStampLikeText(a.primaryDamage, b.primaryDamage) ?? merged.primaryDamage,
    secondaryDamage: mergeStampLikeText(a.secondaryDamage, b.secondaryDamage) ?? merged.secondaryDamage,
    titleStatus: pickLongerText(a.titleStatus, b.titleStatus) ?? merged.titleStatus,
    lotStatus: pickAuctionLotStatus(a.lotStatus, b.lotStatus) ?? merged.lotStatus,
    openingBid: pickPositiveNumber(a.openingBid, b.openingBid) ?? merged.openingBid,
    buyNowPrice: pickPositiveNumber(a.buyNowPrice, b.buyNowPrice) ?? merged.buyNowPrice,
    finalPrice: pickPositiveNumber(a.finalPrice, b.finalPrice) ?? merged.finalPrice,
  };
}

export function dedupeAuctionHistory<T extends AuctionHistoryLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries as Array<T & Record<string, unknown>>,
    (entry) => auctionHistoryDedupeKey(entry, vehicleYear),
    (a, b) => mergeAuctionHistoryEntries(a as T, b as T) as T & Record<string, unknown>,
  ) as T[];
}

export type AccidentLike = {
  date?: string | null;
  severity?: string | null;
  type?: string | null;
  country?: string | null;
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  lossAmount?: number | null;
  partCost?: number | null;
  laborCost?: number | null;
  paintingCost?: number | null;
  currency?: string | null;
  odometerAtLoss?: number | null;
  airbagDeployed?: boolean | null;
  description?: string | null;
};

export function accidentDedupeKey(
  entry: AccidentLike,
  vehicleYear?: number | null,
): string {
  const date = normalizedDateKey(entry.date, vehicleYear);
  const family = accidentTypeFamily(entry);
  if (date) return `d:${date}|${family}`;
  const desc = normalizeToken(entry.description).slice(0, 48);
  const primary = normalizeToken(entry.primaryDamage);
  return `undated|${family}|${desc}|${primary}`;
}

function isPartsDumpDescription(value?: string | null): boolean {
  const raw = (value ?? "").trim();
  if (!raw) return false;
  if (/paid\s*[\d,.\s]+/i.test(raw) && /(parts|labor|paint)\s*[\d,.\s]+/i.test(raw)) return false;
  return (raw.match(/;/g) ?? []).length >= 2
    || /removable|replacement|sheet metal|surface repair|detachable/i.test(raw);
}

function mergeAccidentEntries<T extends AccidentLike>(a: T, b: T): T {
  const merged = mergeDefinedFields(
    a as T & Record<string, unknown>,
    b as T & Record<string, unknown>,
  ) as T;
  const aSev = normalizeToken(a.severity);
  const bSev = normalizeToken(b.severity);
  const severity = aSev === "total_loss" || bSev === "total_loss"
    ? (aSev === "total_loss" ? a.severity : b.severity)
    : pickLongerText(a.severity, b.severity);
  const airbagDeployed = a.airbagDeployed === true || b.airbagDeployed === true
    ? true
    : a.airbagDeployed === false || b.airbagDeployed === false
      ? false
      : a.airbagDeployed ?? b.airbagDeployed ?? null;
  // Prefer money summaries over repaired-parts dumps in accident descriptions.
  const description = isPartsDumpDescription(a.description) && !isPartsDumpDescription(b.description)
    ? b.description
    : isPartsDumpDescription(b.description) && !isPartsDumpDescription(a.description)
      ? a.description
      : mergeStampLikeText(a.description, b.description);
  return {
    ...merged,
    type: pickLongerText(a.type, b.type) ?? merged.type,
    severity: severity ?? merged.severity,
    description: description ?? merged.description,
    primaryDamage: mergeStampLikeText(a.primaryDamage, b.primaryDamage) ?? merged.primaryDamage,
    secondaryDamage: mergeStampLikeText(a.secondaryDamage, b.secondaryDamage) ?? merged.secondaryDamage,
    lossAmount: pickPositiveNumber(a.lossAmount, b.lossAmount) ?? merged.lossAmount,
    partCost: pickPositiveNumber(a.partCost, b.partCost) ?? merged.partCost,
    laborCost: pickPositiveNumber(a.laborCost, b.laborCost) ?? merged.laborCost,
    paintingCost: pickPositiveNumber(a.paintingCost, b.paintingCost) ?? merged.paintingCost,
    odometerAtLoss: pickPositiveNumber(a.odometerAtLoss, b.odometerAtLoss) ?? merged.odometerAtLoss,
    airbagDeployed,
  };
}

export function dedupeAccidents<T extends AccidentLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries as Array<T & Record<string, unknown>>,
    (entry) => accidentDedupeKey(entry, vehicleYear),
    (a, b) => mergeAccidentEntries(a as T, b as T) as T & Record<string, unknown>,
  ) as T[];
}

export type InsuranceClaimLike = {
  date?: string | null;
  type?: string | null;
  lossAmount?: number | null;
  currency?: string | null;
  partCost?: number | null;
  laborCost?: number | null;
  paintingCost?: number | null;
  description?: string | null;
};

export function insuranceClaimDedupeKey(
  entry: InsuranceClaimLike,
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

export function dedupeInsuranceClaims<T extends InsuranceClaimLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(entries, (entry) => insuranceClaimDedupeKey(entry, vehicleYear));
}

export type ServiceHistoryLike = {
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
  // Drop em-dash tails so slight field differences don't fork the key.
  return t
    .replace(/\s*[—–]\s*record\s*#\d+.*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function serviceHistoryDedupeKey(
  entry: ServiceHistoryLike,
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

function mergeServiceHistoryEntries<T extends ServiceHistoryLike>(a: T, b: T): T {
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

export function dedupeServiceHistory<T extends ServiceHistoryLike>(
  entries: T[],
  vehicleYear?: number | null,
): T[] {
  return dedupeByKey(
    entries as Array<T & Record<string, unknown>>,
    (entry) => serviceHistoryDedupeKey(entry, vehicleYear),
    (a, b) => mergeServiceHistoryEntries(a as T, b as T) as T & Record<string, unknown>,
  ) as T[];
}

export type RegistryHistoryLike = {
  date?: string | null;
  type?: string | null;
  title?: string | null;
  subtitle?: string | null;
  mileage?: number | null;
  amount?: string | null;
  location?: string | null;
  details?: Array<{ label: string; value: string }>;
};

function isPlaceholderRegistryText(value?: string | null): boolean {
  const t = (value ?? "").trim();
  if (!t) return true;
  return /^[-–—·.\s]+$/.test(t);
}

function registryEventRichness(event: RegistryHistoryLike): number {
  let score = 0;
  if (event.date) score += 4;
  if (event.subtitle && !isPlaceholderRegistryText(event.subtitle)) score += 2;
  if (event.amount && !isPlaceholderRegistryText(event.amount)) score += 2;
  if (event.location) score += 1;
  score += event.details?.length ?? 0;
  if (event.mileage != null) score += 1;
  return score;
}

export function registryHistoryDedupeKey(
  event: RegistryHistoryLike,
  vehicleYear?: number | null,
): string {
  const title = normalizeToken(event.title).slice(0, 80);
  const date = normalizedDateKey(event.date, vehicleYear);
  let type = event.type ?? "other";
  // Korea insurance repeats the same ownership/registration row in two arrays.
  if (title && (type === "ownership" || type === "registration")) {
    type = "ownership_or_registration";
  }
  const mileage = event.mileage ?? -1;
  const amount = normalizeToken(event.amount).slice(0, 48);
  // Empty same-day shells (no title/mileage/amount) collapse regardless of type.
  if (!title && mileage < 0 && !amount) {
    return `empty|${date}`;
  }
  return `${type}|${date}|${title}|${mileage}|${amount}`;
}

export function dedupeRegistryHistory<T extends RegistryHistoryLike>(
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

function currencyTokenFromExtraValue(value: string | null | undefined): string {
  const raw = String(value ?? "");
  const m = raw.match(/\b(USD|EUR|GBP|KRW|CAD|AUD|JPY|CHF)\b/i);
  return m?.[1]?.toUpperCase() ?? "";
}

export function vehicleExtraDedupeKey(entry: VehicleExtraLike): string {
  const label = extraLabelKey(entry);
  if (!label) return `raw:${normalizeToken(entry.value)}`;
  // Money rows must not merge across currencies (USD + KRW → "20 · 200 USD · … KRW").
  if (
    /^(pre_accident_value|pre-accident value|actual cash value \(acv\)|actual_cash_value|estimated repair cost|average price|price without tax)$/i
      .test(label)
    || /pre.?accident|actual cash|estimated repair|average price|price without tax/i.test(label)
  ) {
    const ccy = currencyTokenFromExtraValue(entry.value);
    if (ccy) return `label:${label}|${ccy}`;
  }
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
