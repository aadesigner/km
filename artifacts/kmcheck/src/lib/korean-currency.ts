/** Default KRW per 1 USD when admin rate is unset (USD/KRW ~1,415 as of Aug 2026) */
export const DEFAULT_KRW_PER_USD = 1415;

export function isKoreanCountry(country?: string | null): boolean {
  return country?.toLowerCase() === "kr";
}

/** Encar/KOTSA insurance payouts and registry repair costs are stored as KRW. */
export function isKoreanSourcedAccidentType(type?: string | null): boolean {
  const normalized = type?.toLowerCase();
  return normalized === "insurance" || normalized === "registry" || normalized === "inspection";
}

export function reportUsesKrwAmounts(input?: {
  country?: string | null;
  insuranceClaims?: unknown[] | null;
}): boolean {
  if (isKoreanCountry(input?.country)) return true;
  return Array.isArray(input?.insuranceClaims) && input.insuranceClaims.length > 0;
}

export function shouldFormatAccidentLossAsKrw(input: {
  vehicleCountry?: string | null;
  accidentType?: string | null;
  accidentCountry?: string | null;
  hasKoreanInsuranceClaims?: boolean;
}): boolean {
  if (reportUsesKrwAmounts({
    country: input.vehicleCountry,
    insuranceClaims: input.hasKoreanInsuranceClaims ? [{}] : null,
  })) {
    return true;
  }
  if (isKoreanCountry(input.accidentCountry)) return true;
  return isKoreanSourcedAccidentType(input.accidentType);
}

export function convertKrwToUsd(krw: number, krwPerUsd: number): number {
  if (!Number.isFinite(krw) || !Number.isFinite(krwPerUsd) || krwPerUsd <= 0) return 0;
  return krw / krwPerUsd;
}

export function formatUsdAmount(usd: number): string {
  const rounded = Math.round(usd);
  return `$${rounded.toLocaleString()}`;
}

/** Parse KRW from provider strings: "2,566,720 won", "136.6 million won", "₩7060220" */
export function parseKrwFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const trimmed = text.trim();

  const million = trimmed.match(/([\d.,]+)\s*million\s+won/i);
  if (million) {
    const n = parseFloat(million[1]!.replace(/,/g, ""));
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : null;
  }

  const wonSuffix = trimmed.match(/([\d,]+)\s*won/i);
  if (wonSuffix) {
    const n = parseInt(wonSuffix[1]!.replace(/,/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const wonPrefix = trimmed.match(/₩\s*([\d,]+)/);
  if (wonPrefix) {
    const n = parseInt(wonPrefix[1]!.replace(/,/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return null;
}

/** USD primary with original won in parentheses — plain text for print */
export function formatKoreanWonPlain(krw: number, krwPerUsd: number): string {
  const rate = krwPerUsd > 0 ? krwPerUsd : DEFAULT_KRW_PER_USD;
  const usd = convertKrwToUsd(krw, rate);
  return `${formatUsdAmount(usd)} (₩${krw.toLocaleString()})`;
}

/** @deprecated use formatKoreanWonPlain */
export const formatKoreanInsuranceAmount = formatKoreanWonPlain;

export function formatKoreanWonFromText(
  text: string,
  krwPerUsd?: number | null,
): string | null {
  const krw = parseKrwFromText(text);
  if (krw == null) return null;
  return formatKoreanWonPlain(krw, resolveKrwPerUsd(krwPerUsd));
}

export function resolveKrwPerUsd(rate: number | null | undefined): number {
  return typeof rate === "number" && rate > 0 ? rate : DEFAULT_KRW_PER_USD;
}
