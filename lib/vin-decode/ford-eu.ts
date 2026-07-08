/**
 * Ford Europe VIN decoding (WF0*, WF1*, 8AF*, SA1* Ford UK).
 * EU ZZZ format uses type-approval codes at positions 7–9.
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
];

const FORD_EU_WMIS = ["WF0", "WF1", "8AF", "SA1"] as const;

const FORD_EU_RULES = compilePrefixRules(
  FORD_EU_WMIS.flatMap((wmi) => rulesForWmi(wmi, FORD_EU_CODES)),
);

/** Non-ZZZ Ford EU prefix rules (older format). */
const FORD_EU_PREFIX: PrefixRule[] = compilePrefixRules([
  { prefix: "WF0EXX", model: "Focus" },
  { prefix: "WF0FXX", model: "Fiesta" },
  { prefix: "WF0KXX", model: "Mondeo" },
  { prefix: "WF0MXX", model: "Galaxy" },
  { prefix: "WF0SXX", model: "S-Max" },
  { prefix: "WF0UXX", model: "Kuga" },
  { prefix: "WF0JXX", model: "C-Max" },
]);

export function isFordEuWmi(wmi: string): boolean {
  return FORD_EU_WMIS.some((p) => wmi.startsWith(p));
}

export function decodeFordEuModel(vin: string): string | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 9) return null;
  if (!isFordEuWmi(u.slice(0, 3))) return null;

  if (u.slice(3, 6) === "ZZZ") {
    const hit = matchLongestPrefix(u, FORD_EU_RULES);
    if (hit) return hit.model;
  }

  return matchLongestPrefix(u, FORD_EU_PREFIX)?.model ?? null;
}
