/**
 * Opel vs Vauxhall — shared Stellantis/GM platforms, separate market badges.
 * WMI W0L serves both; VXK and W0V are UK-market identifiers.
 */

import { compilePrefixRules, matchLongestPrefix } from "./prefix-match";

export const OPEL_VAUXHALL_WMIS = ["W0L", "W0V", "VXK"] as const;

/** UK assembly plants → Vauxhall badge (position 11 / index 10). */
const VAUXHALL_PLANT_CODES = new Set(["8", "E", "L", "U"]);

const OPEL_VAUXHALL_PLANTS: Record<string, { city: string; country: string }> = {
  "1": { city: "Rüsselsheim", country: "Germany" },
  "2": { city: "Bochum", country: "Germany" },
  "3": { city: "Saint Petersburg", country: "Russia" },
  "8": { city: "Ellesmere Port", country: "United Kingdom" },
  B: { city: "Zaragoza", country: "Spain" },
  E: { city: "Ellesmere Port", country: "United Kingdom" },
  G: { city: "Gliwice", country: "Poland" },
  L: { city: "Luton", country: "United Kingdom" },
  S: { city: "Bochum", country: "Germany" },
  T: { city: "Rüsselsheim", country: "Germany" },
  U: { city: "Luton", country: "United Kingdom" },
  A: { city: "Rüsselsheim", country: "Germany" },
};

/** Platform letter at VIN position 4 (index 3) — GM/Stellantis era. */
const PLATFORM_AT_4: Record<string, string> = {
  "0": "Corsa",
  B: "Corsa",
  G: "Insignia",
  P: "Astra",
  S: "Meriva",
  W: "Cascada",
  M: "Mokka",
  N: "Grandland",
  "4": "Crossland",
  F: "Frontera",
  V: "Vivaro",
  C: "Combo",
  J: "Mokka",
  D: "Astra",
  T: "Insignia",
};

const PREFIX_RULES = compilePrefixRules([
  { prefix: "W0L0ZEL", model: "Corsa F" },
  { prefix: "W0L0ZEC", model: "Corsa-e" },
  { prefix: "W0L0ADF", model: "Astra L" },
  { prefix: "W0L0AD", model: "Astra L" },
  { prefix: "W0LJD", model: "Mokka" },
  { prefix: "W0L4", model: "Crossland" },
  { prefix: "W0LP", model: "Astra" },
  { prefix: "W0LS", model: "Astra" },
  { prefix: "W0LB", model: "Corsa" },
  { prefix: "W0LT", model: "Insignia" },
  { prefix: "W0LG", model: "Insignia" },
  { prefix: "W0LM", model: "Mokka" },
  { prefix: "W0LN", model: "Grandland" },
  { prefix: "W0LF", model: "Frontera" },
  { prefix: "W0LV", model: "Vivaro" },
  { prefix: "W0LC", model: "Combo" },
  { prefix: "W0V", model: "Vivaro" },
  { prefix: "VXKP", model: "Astra" },
  { prefix: "VXKB", model: "Corsa" },
  { prefix: "VXK", model: "Astra" },
]);

export function isOpelVauxhallVin(vin: string): boolean {
  const wmi = vin.toUpperCase().slice(0, 3);
  return (OPEL_VAUXHALL_WMIS as readonly string[]).includes(wmi);
}

export function decodeOpelVauxhallPlant(vin: string): { city: string; country: string } | null {
  if (!isOpelVauxhallVin(vin) || vin.length < 11) return null;
  return OPEL_VAUXHALL_PLANTS[vin[10].toUpperCase()] ?? null;
}

/** Split Opel (continental) vs Vauxhall (UK badge). */
export function decodeOpelVauxhallMake(vin: string): "Opel" | "Vauxhall" | null {
  if (!isOpelVauxhallVin(vin)) return null;
  const wmi = vin.toUpperCase().slice(0, 3);
  if (wmi === "VXK" || wmi === "W0V") return "Vauxhall";
  if (wmi === "W0L" && vin.length >= 11) {
    const plant = vin[10].toUpperCase();
    if (VAUXHALL_PLANT_CODES.has(plant)) return "Vauxhall";
    const plantInfo = OPEL_VAUXHALL_PLANTS[plant];
    if (plantInfo?.country === "United Kingdom") return "Vauxhall";
  }
  return "Opel";
}

export function decodeOpelVauxhallModel(vin: string): string | null {
  if (!isOpelVauxhallVin(vin)) return null;
  const upper = vin.toUpperCase();
  const prefixHit = matchLongestPrefix(upper, PREFIX_RULES);
  if (prefixHit) return prefixHit.model;
  if (upper.length >= 4) {
    const fromPlatform = PLATFORM_AT_4[upper[3]];
    if (fromPlatform) return fromPlatform;
    const FOUR_CHAR: Record<string, string> = {
      W0LS: "Astra",
      W0LB: "Corsa",
      W0LT: "Insignia",
      W0LM: "Mokka",
      W0LN: "Grandland",
    };
    const fromFour = FOUR_CHAR[upper.slice(0, 4)];
    if (fromFour) return fromFour;
  }
  return null;
}
