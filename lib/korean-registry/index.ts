/** KOTSA / Encar registry field labels that carry odometer readings. */
export const REGISTRY_MILEAGE_FIELD_PATTERN =
  /driving distance|drown distance|drone during|mileage during/i;

export const REGISTRY_AMOUNT_FIELD_PATTERN =
  /repair cost|list price|delivery price|new car shipping/i;

const TYPES_WITHOUT_MILEAGE = new Set([
  "insurance_event",
  "no_insurance",
  "new_car_delivery",
  "registration_change",
]);

export const REGISTRY_TYPES_WITHOUT_MILEAGE = TYPES_WITHOUT_MILEAGE;

export type RegistryLike = {
  type?: string | null;
  mileage?: number | null;
  details?: Array<{ label: string; value: string }> | null;
};

export function hasExplicitRegistryMileage(event: RegistryLike): boolean {
  return (event.details ?? []).some(
    (row) => REGISTRY_MILEAGE_FIELD_PATTERN.test(row.label) && /km/i.test(row.value),
  );
}

export function isRegistryAmountLabel(label: string): boolean {
  return REGISTRY_AMOUNT_FIELD_PATTERN.test(label);
}

export function isRegistryRepairCostLabel(label: string): boolean {
  return /total repair cost/i.test(label);
}

/** Repair payouts above this are almost always new-car list prices mis-tagged by the provider. */
export const MAX_PLAUSIBLE_KRW_REPAIR_PAYOUT = 80_000_000;

export type KoreanRepairCostParts = {
  partCost?: number | null;
  laborCost?: number | null;
  paintingCost?: number | null;
};

export function koreanRepairComponentSum(parts: KoreanRepairCostParts): number {
  return (parts.partCost ?? 0) + (parts.laborCost ?? 0) + (parts.paintingCost ?? 0);
}

/** Mileage shown on registry cards — only KOTSA fields, never listing odometer leaks. */
export function resolveRegistryDisplayMileage(
  event: RegistryLike,
  opts?: { listingOdometer?: number | null },
): number | null {
  const mileage = event.mileage;
  if (mileage == null || mileage <= 0) return null;

  const type = event.type ?? "other";
  if (TYPES_WITHOUT_MILEAGE.has(type)) return null;

  const explicit = hasExplicitRegistryMileage(event);
  if (!explicit && type !== "inspection" && type !== "owner_change") return null;

  if (opts?.listingOdometer != null && mileage === opts.listingOdometer && !explicit) {
    return null;
  }

  return mileage;
}

/** Provider sometimes sends KRW repair costs as plain digits without "won". */
export function normalizeKrwAmountText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/won|₩|million/i.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/[^\d]/g, "");
  // 5–8 digits: typical repair band. 9+ digits are usually list prices (100M+ KRW).
  if (/^\d{5,8}$/.test(digits)) {
    const n = Number.parseInt(digits, 10);
    if (n >= 10_000 && n < MAX_PLAUSIBLE_KRW_REPAIR_PAYOUT) {
      return `${n.toLocaleString("en-US")} won`;
    }
  }
  return trimmed;
}

/** Parse KRW from provider text — ignores bare 9–10 digit list-price-scale numbers. */
export function parseKrwAmountFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const normalized = normalizeKrwAmountText(text) ?? text.trim();

  const million = normalized.match(/([\d.,]+)\s*million\s+won/i);
  if (million) {
    const n = parseFloat(million[1]!.replace(/,/g, ""));
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : null;
  }

  const wonSuffix = normalized.match(/([\d,]+)\s*won/i);
  if (wonSuffix) {
    const n = parseInt(wonSuffix[1]!.replace(/,/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const wonPrefix = normalized.match(/₩\s*([\d,]+)/);
  if (wonPrefix) {
    const n = parseInt(wonPrefix[1]!.replace(/,/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const digits = normalized.replace(/[^\d]/g, "");
  if (/^\d{5,8}$/.test(digits)) {
    const n = Number.parseInt(digits, 10);
    if (n >= 10_000 && n < MAX_PLAUSIBLE_KRW_REPAIR_PAYOUT) return n;
  }

  return null;
}

/**
 * Drop or correct implausible Korean repair payouts (e.g. new-car list price in a damage field).
 * When part/labor/paint breakdown exists and is much smaller, prefer that sum.
 */
export function sanitizeKoreanRepairKrwAmount(
  krw: number | null | undefined,
  parts?: KoreanRepairCostParts,
): number | null {
  if (krw == null || !Number.isFinite(krw) || krw <= 0) return null;

  const components = koreanRepairComponentSum(parts ?? {});
  const hasComponents = components > 0;

  if (krw >= MAX_PLAUSIBLE_KRW_REPAIR_PAYOUT) {
    if (hasComponents && components < MAX_PLAUSIBLE_KRW_REPAIR_PAYOUT) return components;
    return null;
  }

  if (hasComponents && krw > components * 8) return components;

  return Math.round(krw);
}

export function sanitizeKoreanRepairAmountText(
  text: string | null | undefined,
  parts?: KoreanRepairCostParts,
): string | null {
  const parsed = parseKrwAmountFromText(text);
  if (parsed == null) return null;
  const sane = sanitizeKoreanRepairKrwAmount(parsed, parts);
  if (sane == null) return null;
  return `${sane.toLocaleString("en-US")} won`;
}

/** Chip/summary amount on registry cards — repair cost only for insurance events. */
export function resolveRegistryDisplayAmount(
  event: RegistryLike & { type?: string | null; amount?: string | null },
): string | null {
  const type = event.type ?? "other";
  const repairRow = (event.details ?? []).find((row) => isRegistryRepairCostLabel(row.label));
  if (repairRow?.value) {
    const sanitized = sanitizeKoreanRepairAmountText(repairRow.value);
    if (sanitized) return sanitized;
  }

  if (type === "insurance_event") return null;

  for (const row of event.details ?? []) {
    if (isRegistryAmountLabel(row.label) && !isRegistryRepairCostLabel(row.label)) {
      return normalizeKrwAmountText(row.value);
    }
  }

  const raw = event.amount;
  if (!raw) return null;
  if (isRegistryRepairCostLabel(raw)) return sanitizeKoreanRepairAmountText(raw);
  return normalizeKrwAmountText(raw);
}

export function stripRegistrySubtitleNoise(
  subtitle: string | null | undefined,
  mileage: number | null,
): string | null {
  if (!subtitle) return null;
  let text = subtitle;

  if (mileage != null) {
    text = text
      .replace(/^mileage\s+[\d,]+\s*km\s*$/i, "")
      .replace(/^comprehensive examination\s+[\d,]+\s*km(?:\s+of\s+mileage)?\s*$/i, "")
      .replace(/^[\d,]+\s*km\s+of\s+mileage\s*$/i, "");
  }

  text = text
    .replace(/total\s+[\d.,]+\s+(?:million\s+)?won/gi, "")
    .replace(/\s*·\s*·+\s*/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .trim();

  return text || null;
}
