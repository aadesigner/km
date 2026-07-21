/**
 * Ford Europe VIN decoding (WF0*, WF1*, 8AF*, SA1*, SFA*).
 *
 * Two layouts:
 * - ZZZ homologation: type code at positions 7–9 after ZZZ filler.
 * - XX layout (older EU): positions 5–6 are "XX"; production year at
 *   position 11 (Ford calendar cycle), NOT ISO position 10.
 *
 * Conservative: ambiguous plant/model → family or null, never invent.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

type CodeRule = { code: string; model: string; chassis?: string };

function rulesForWmi(wmi: string, codes: CodeRule[]): PrefixRule[] {
  return codes.map(({ code, model, chassis }) => ({
    prefix: `${wmi}ZZZ${code}`,
    model: chassis ? `${model} (${chassis})` : model,
  }));
}

const FORD_EU_CODES: CodeRule[] = [
  { code: "GBJ", model: "Focus", chassis: "Mk4" },
  { code: "FFJ", model: "Fiesta", chassis: "Mk7/Mk8" },
  { code: "U5J", model: "Kuga", chassis: "Mk2/Mk3" },
  { code: "NUG", model: "Puma" },
  { code: "TKD", model: "Mondeo", chassis: "Mk5" },
  { code: "BSF", model: "S-Max" },
  { code: "CGB", model: "Galaxy" },
  { code: "RUG", model: "EcoSport" },
  { code: "TKE", model: "Tourneo Connect" },
  { code: "T7E", model: "Tourneo Custom" },
  { code: "TNE", model: "Transit Connect" },
  { code: "TTE", model: "Transit Custom" },
  { code: "TTF", model: "Transit" },
  { code: "M7G", model: "Mustang Mach-E" },
  { code: "MUG", model: "Mustang Mach-E" },
  { code: "CXB", model: "Ranger", chassis: "T6/T7" },
  { code: "FNG", model: "Focus", chassis: "Mk3 / Focus Active" },
  { code: "JHH", model: "Fiesta", chassis: "Mk6" },
  { code: "JJB", model: "Fiesta", chassis: "Mk7" },
  { code: "EJB", model: "Focus", chassis: "Mk2/Mk3" },
  { code: "GCB", model: "C-Max" },
  { code: "GDD", model: "Grand C-Max" },
  { code: "BDA", model: "Ka" },
  { code: "BFB", model: "Ka+" },
  { code: "E7B", model: "B-Max" },
  { code: "SJB", model: "Edge" },
  { code: "SFB", model: "S-Max", chassis: "Mk2" },
  { code: "UFB", model: "Kuga", chassis: "Mk1" },
  { code: "UFJ", model: "Kuga", chassis: "Mk2" },
  { code: "NGJ", model: "Puma" },
  { code: "NGC", model: "Puma ST" },
  { code: "AAB", model: "Escort" },
  { code: "ABF", model: "Fiesta" },
];

/** Core Ford Europe WMIs. VS6 is shared with SEAT — only XX-layout Ford Spain. */
const FORD_EU_WMIS = ["WF0", "WF1", "8AF", "SA1", "SFA"] as const;

const FORD_EU_RULES = compilePrefixRules(
  FORD_EU_WMIS.flatMap((wmi) => rulesForWmi(wmi, FORD_EU_CODES)),
);

/**
 * Non-ZZZ Ford EU prefixes (XX and letter-body layouts).
 * Longest match wins. Saarlouis GC Focus lines verified against production VINs.
 */
const FORD_EU_PREFIX: PrefixRule[] = compilePrefixRules([
  // Saarlouis Focus (Mk2/Mk3 era) — body digit + XX + GC plant
  { prefix: "WF05XXGC", model: "Focus" },
  { prefix: "WF03XXGC", model: "Focus" },
  { prefix: "WF04XXGC", model: "Focus" },
  { prefix: "WF0AXXGC", model: "Focus" },
  { prefix: "WF0BXXGC", model: "Focus" },
  { prefix: "WF1AXXGC", model: "Focus" },
  { prefix: "WF15XXGC", model: "Focus" },
  // Letter-at-pos4 + XX (classic product-line letter)
  { prefix: "WF0EXX", model: "Focus" },
  { prefix: "WF0FXX", model: "Fiesta" },
  { prefix: "WF0KXX", model: "Mondeo" },
  { prefix: "WF0MXX", model: "Galaxy" },
  { prefix: "WF0SXX", model: "S-Max" },
  { prefix: "WF0UXX", model: "Kuga" },
  { prefix: "WF0JXX", model: "C-Max" },
  { prefix: "WF0RXX", model: "Ka" },
  { prefix: "WF0DXX", model: "Focus" },
  { prefix: "WF0TXX", model: "Transit" },
  { prefix: "WF0PXX", model: "Transit Connect" },
  { prefix: "WF0VXX", model: "Transit" },
  { prefix: "WF0LXX", model: "Galaxy" },
  { prefix: "WF0HXX", model: "Fiesta" },
  { prefix: "WF0WXX", model: "Galaxy" },
  { prefix: "WF1EXX", model: "Focus" },
  { prefix: "WF1FXX", model: "Fiesta" },
  { prefix: "SFAEXX", model: "Focus" },
  { prefix: "SFAFXX", model: "Fiesta" },
  { prefix: "SFATXX", model: "Transit Connect" },
]);

/**
 * Classic XX-layout model letter at position 9 (workshop manuals).
 * Used only when no longer prefix matched — reused letters stay conservative.
 */
const FORD_XX_MODEL_AT_9: Record<string, string> = {
  A: "Escort / Orion",
  B: "Mondeo",
  D: "Focus",
  E: "Puma / Capri",
  F: "Fiesta",
  G: "Scorpio / Granada",
  J: "Fiesta / Fusion",
  R: "Ka",
  S: "Galaxy",
  W: "Galaxy",
  P: "Transit / Tourneo Connect",
};

/**
 * Ford Europe XX-layout production year at position 11 (calendar year).
 * Digits 1–9 = 2001–2009; letters follow Ford fleet / workshop tables
 * (C=2012 … F=2015 … P=2023 …). Prefer recent cycle when ambiguous.
 */
const FORD_XX_YEAR_AT_11: Record<string, number> = {
  "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005,
  "6": 2006, "7": 2007, "8": 2008, "9": 2009,
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015,
  G: 2016, H: 2017, J: 2018, K: 2019, L: 2020, M: 2021,
  N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027,
  W: 2028, X: 2029, Y: 2030,
};

export function isFordEuWmi(wmi: string): boolean {
  if (FORD_EU_WMIS.some((p) => wmi.startsWith(p))) return true;
  // VS6: Ford Spain XX-layout only — SEAT owns VS6A/K/… and VS6ZZZ homologation.
  return wmi === "VS6";
}

/** True when Ford Europe VIN uses the classic XX filler at positions 5–6. */
export function isFordEuXxLayout(vin: string): boolean {
  const u = vin.trim().toUpperCase();
  if (u.length < 12) return false;
  const wmi = u.slice(0, 3);
  if (!isFordEuWmi(wmi)) return false;
  // SEAT VS6 passenger cars are not XX-layout Ford.
  if (wmi === "VS6" && u.slice(3, 6) === "ZZZ") return false;
  if (wmi === "VS6" && /^VS6[ABKLM]/.test(u.slice(0, 4))) return false;
  return u.slice(4, 6) === "XX";
}

/** Production calendar year from position 11 for XX-layout Ford Europe VINs. */
export function decodeFordEuXxYear(vin: string): number | null {
  if (!isFordEuXxLayout(vin)) return null;
  const code = vin.trim().toUpperCase()[10];
  if (!code) return null;
  const year = FORD_XX_YEAR_AT_11[code];
  if (year == null) return null;
  const currentYear = new Date().getFullYear();
  return year <= currentYear + 2 ? year : null;
}

export function decodeFordEuModel(vin: string): string | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 9) return null;
  const wmi = u.slice(0, 3);
  if (!isFordEuWmi(wmi)) return null;

  // Do not steal SEAT VS6 homologation / letter lines.
  if (wmi === "VS6") {
    if (u.slice(3, 6) === "ZZZ") return null;
    if (/^VS6[ABKLM]/.test(u.slice(0, 4))) return null;
    if (u.slice(4, 6) !== "XX") return null;
  }

  if (u.slice(3, 6) === "ZZZ") {
    const hit = matchLongestPrefix(u, FORD_EU_RULES);
    if (hit) return hit.model;
    return null;
  }

  const prefixHit = matchLongestPrefix(u, FORD_EU_PREFIX);
  if (prefixHit) return prefixHit.model;

  if (u.slice(4, 6) === "XX" && u.length >= 9) {
    return FORD_XX_MODEL_AT_9[u[8]] ?? null;
  }

  return null;
}
