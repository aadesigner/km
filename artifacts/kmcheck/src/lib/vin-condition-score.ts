import { accidentsForScoring } from "@/lib/accident-signals";

export type VinScoreAccident = {
  severity?: string | null;
};

export type VinScoreMileageEntry = {
  odometer?: number | null;
  date?: string | null;
};

export type VinScoreInput = {
  odometer?: number | null;
  year?: number | null;
  accidents?: VinScoreAccident[] | null;
  accidentCount?: number | null;
  insuranceClaims?: Array<{ date?: string | null; type?: string | null; lossAmount?: number | null }> | null;
  registryHistory?: Array<{
    type?: string | null;
    title?: string | null;
    subtitle?: string | null;
    amount?: string | null;
    details?: Array<{ label?: string; value?: string | null }> | null;
  }> | null;
  ownerCount?: number | null;
  isSalvage?: boolean | null;
  isStolen?: boolean | null;
  mileageHistory?: VinScoreMileageEntry[] | null;
};

export type VinScoreResult = {
  score: string;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  trackColor: string;
  /** Top accent bar on hero card (Tailwind gradient stops). */
  accentBar: string;
  accentGlow: string;
};

const PERFECT_MAX_KM = 130_000;
/** Pre-finalize cap for clean cars at 130k–250k km. */
const HIGH_KM_CLEAN_SCORE = 9.5;
const MIN_SCORE = 2.0;
/** Applied to every car in finalize — displayed scores never exceed this. */
const MAX_SCORE = 9.5;
const SCORE_REDUCTION = 0.5;

const GREEN = {
  textColor: "text-green-700 dark:text-green-400",
  bgColor: "bg-green-50 dark:bg-green-950/60",
  borderColor: "border-green-200 dark:border-green-800",
  trackColor: "#16a34a",
  accentBar: "from-emerald-400/55 via-primary/40 to-emerald-300/30",
  accentGlow: "from-emerald-500/10 via-primary/5 to-transparent",
};

const AMBER = {
  textColor: "text-amber-700 dark:text-amber-400",
  bgColor: "bg-amber-50 dark:bg-amber-950/60",
  borderColor: "border-amber-200 dark:border-amber-800",
  trackColor: "#d97706",
  accentBar: "from-amber-400/55 via-orange-300/40 to-amber-300/25",
  accentGlow: "from-amber-500/10 via-orange-400/5 to-transparent",
};

const RED = {
  textColor: "text-red-700 dark:text-red-400",
  bgColor: "bg-red-50 dark:bg-red-950/60",
  borderColor: "border-red-200 dark:border-red-800",
  trackColor: "#dc2626",
  accentBar: "from-red-500/55 via-red-400/45 to-orange-400/30",
  accentGlow: "from-red-500/10 via-red-400/5 to-transparent",
};

export function hasMileageRollback(history: VinScoreMileageEntry[]): boolean {
  const dated = [...history]
    .filter((e) => e.odometer != null && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  for (let i = 1; i < dated.length; i++) {
    if ((dated[i].odometer ?? 0) < (dated[i - 1].odometer ?? 0)) return true;
  }
  return false;
}

function resolvedAccidents(input: VinScoreInput): VinScoreAccident[] {
  return accidentsForScoring(input);
}

function accidentCount(input: VinScoreInput): number {
  return resolvedAccidents(input).length;
}

function isCleanBase(input: VinScoreInput): boolean {
  return (
    accidentCount(input) === 0
    && input.isSalvage !== true
    && input.isStolen !== true
    && (input.ownerCount == null || input.ownerCount <= 3)
  );
}

function singleAccidentPenalty(severity?: string | null): number {
  const s = (severity ?? "").toLowerCase();
  if (s.includes("total")) return 1.4;
  if (s.includes("major") || s.includes("severe")) return 0.65;
  if (s.includes("moderate")) return 0.28;
  if (s.includes("minor") || s.includes("light")) return 0.1;
  return 0.18;
}

const ACCIDENT_DIMINISH = [1, 0.75, 0.55, 0.4, 0.3, 0.25];

function accidentsPenalty(input: VinScoreInput): number {
  const list = resolvedAccidents(input);
  if (list.length === 0) return 0;

  const penalties = list
    .map((a) => singleAccidentPenalty(a.severity))
    .sort((a, b) => b - a);

  let sum = 0;
  for (let i = 0; i < penalties.length; i++) {
    sum += penalties[i]! * (ACCIDENT_DIMINISH[i] ?? 0.2);
  }
  return Math.min(sum, 2.6);
}

/** Higher km under 130k shaves points; very low km for age may indicate rollback risk. */
function mileagePenalty(km: number | null | undefined, year: number | null | undefined): number {
  let penalty = 0;

  if (km == null) {
    penalty += 0.4;
  } else if (km < PERFECT_MAX_KM) {
    if (km >= 100_000) penalty += 0.35;
    else if (km >= 80_000) penalty += 0.25;
    else if (km >= 50_000) penalty += 0.15;
  } else if (km >= 400_000) {
    // 400k+: heavy wear — steep penalty, worsens further above 400k
    penalty += 5.5 + ((km - 400_000) / 100_000) * 0.9;
  } else if (km >= 350_000) {
    // 350k–400k: high wear band
    penalty += 4.2 + ((km - 350_000) / 50_000) * 1.3;
  } else if (km >= 300_000) {
    // 300k–350k: elevated wear — steeper than pre-300k ramp
    penalty += 3.5 + ((km - 300_000) / 50_000) * 0.7;
  } else if (km >= 280_000) {
    penalty += 2.4 + ((km - 280_000) / 20_000) * 0.8;
  } else if (km >= 250_000) {
    penalty += 1.5 + ((km - 250_000) / 30_000) * 0.9;
  } else if (km >= 200_000) {
    penalty += 0.75 + ((km - 200_000) / 50_000) * 0.75;
  } else {
    penalty += 0.35 + ((km - PERFECT_MAX_KM) / 70_000) * 0.4;
  }

  if (km != null && year != null) {
    const age = Math.max(1, new Date().getFullYear() - year);
    const expectedKm = age * 12_000;
    if (km < expectedKm * 0.25 && age >= 4) penalty += 1.2;
    else if (km < expectedKm * 0.4 && age >= 3) penalty += 0.6;
  }

  return penalty;
}

/** Mild penalty — multiple owners are common on used imports and should not dominate the score. */
function ownersPenalty(ownerCount: number | null | undefined): number {
  if (ownerCount == null) return 0.15;
  if (ownerCount <= 3) return 0;
  if (ownerCount === 4) return 0.3;
  if (ownerCount === 5) return 0.45;
  return Math.min(0.45 + (ownerCount - 5) * 0.12, 0.85);
}

function labelForScore(final: number, t: (key: string) => string): Pick<VinScoreResult, "label" | "textColor" | "bgColor" | "borderColor" | "trackColor" | "accentBar" | "accentGlow"> {
  if (final >= 8) return { label: t("report_clean"), ...GREEN };
  if (final >= 6) return { label: t("report_caution"), ...AMBER };
  return { label: t("report_risk"), ...RED };
}

function finalize(raw: number, t: (key: string) => string): VinScoreResult {
  const adjusted = parseFloat((raw - SCORE_REDUCTION).toFixed(1));
  const final = Math.max(MIN_SCORE, Math.min(MAX_SCORE, adjusted));
  return { score: final.toFixed(1), ...labelForScore(final, t) };
}

/** Condition score from report data (display max 9.5). Shared by full and public VIN report pages. */
export function computeVinConditionScore(
  input: VinScoreInput | null | undefined,
  t: (key: string) => string,
): VinScoreResult | null {
  if (!input) return null;

  const km = input.odometer ?? null;
  const history = input.mileageHistory ?? [];
  const rollback = history.length >= 2 && hasMileageRollback(history);
  const clean = isCleanBase(input);

  // Best case: under 130k km, no accidents, ≤3 owners, not salvage/stolen, no rollback → displays 9.5
  if (
    km != null
    && km < PERFECT_MAX_KM
    && clean
    && !rollback
    && mileagePenalty(km, input.year ?? null) < 0.55
  ) {
    return finalize(10, t);
  }

  let score = 10;

  score -= accidentsPenalty(input);
  score -= mileagePenalty(km, input.year ?? null);
  score -= ownersPenalty(input.ownerCount);
  if (input.isSalvage === true) score -= 5.5;
  if (input.isStolen === true) score -= 3.5;
  if (rollback) score -= 2.5;

  // Clean 130k–250k: still capped near 9.5; above 250k penalties apply fully
  if (km != null && km >= PERFECT_MAX_KM && km < 250_000 && clean && !rollback) {
    score = Math.min(score, HIGH_KM_CLEAN_SCORE);
  }

  return finalize(score, t);
}

/** Map full-report lookup shape. */
export function scoreInputFromLookup(data: {
  odometer?: number | null;
  year?: number | null;
  accidents?: VinScoreAccident[] | null;
  accidentCount?: number | null;
  insuranceClaims?: VinScoreInput["insuranceClaims"];
  registryHistory?: VinScoreInput["registryHistory"];
  ownerCount?: number | null;
  isSalvage?: boolean | null;
  isStolen?: boolean | null;
  mileageHistory?: VinScoreMileageEntry[] | null;
} | null | undefined): VinScoreInput | null {
  if (!data) return null;
  return {
    odometer: data.odometer,
    year: data.year,
    accidents: data.accidents,
    accidentCount: data.accidentCount,
    insuranceClaims: data.insuranceClaims,
    registryHistory: data.registryHistory,
    ownerCount: data.ownerCount,
    isSalvage: data.isSalvage,
    isStolen: data.isStolen,
    mileageHistory: data.mileageHistory,
  };
}

/** Map public-report shape (salvage/stolen field names differ). */
export function scoreInputFromPublic(data: {
  odometer?: number | null;
  year?: number | null;
  accidents?: VinScoreAccident[] | null;
  accidentCount?: number | null;
  insuranceClaims?: VinScoreInput["insuranceClaims"];
  registryHistory?: VinScoreInput["registryHistory"];
  ownerCount?: number | null;
  salvage?: boolean | null;
  stolen?: boolean | null;
  mileageHistory?: VinScoreMileageEntry[] | null;
} | null | undefined): VinScoreInput | null {
  if (!data) return null;
  return {
    odometer: data.odometer,
    year: data.year,
    accidents: data.accidents,
    accidentCount: data.accidentCount,
    insuranceClaims: data.insuranceClaims,
    registryHistory: data.registryHistory,
    ownerCount: data.ownerCount,
    isSalvage: data.salvage,
    isStolen: data.stolen,
    mileageHistory: data.mileageHistory,
  };
}
