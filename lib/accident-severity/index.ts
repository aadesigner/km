/** USD tiers for accident damage labels shown in reports. */
export const ACCIDENT_SEVERITY_USD_MINOR_MAX = 1300;
export const ACCIDENT_SEVERITY_USD_MODERATE_MAX = 3000;

export const DEFAULT_KRW_PER_USD_FOR_SEVERITY = 1537;

export type AccidentSeverityTier = "minor" | "moderate" | "major" | "total_loss";

export function inferAccidentSeverityFromUsd(
  usd: number,
): Exclude<AccidentSeverityTier, "total_loss"> {
  if (!Number.isFinite(usd) || usd <= 0) return "minor";
  if (usd < ACCIDENT_SEVERITY_USD_MINOR_MAX) return "minor";
  if (usd < ACCIDENT_SEVERITY_USD_MODERATE_MAX) return "moderate";
  return "major";
}

export function inferAccidentSeverityFromLossAmount(
  amount: number | null | undefined,
  opts?: {
    amountCurrency?: "KRW" | "USD";
    krwPerUsd?: number | null;
  },
): Exclude<AccidentSeverityTier, "total_loss"> {
  if (amount == null || amount <= 0) return "minor";

  const rate = typeof opts?.krwPerUsd === "number" && opts.krwPerUsd > 0
    ? opts.krwPerUsd
    : DEFAULT_KRW_PER_USD_FOR_SEVERITY;

  const usd = opts?.amountCurrency === "KRW" ? amount / rate : amount;
  return inferAccidentSeverityFromUsd(usd);
}
