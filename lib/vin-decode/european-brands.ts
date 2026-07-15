/**
 * Model decoding for popular EU brands outside the premium (BMW/MB/Audi/Porsche) tables.
 * Škoda, Renault, Fiat, Peugeot/Citroën (ZZZ), and SEAT.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";
import {
  decodeSeatEuHomologation,
  decodeSeatEuModel,
  formatSeatDisplay,
  SEAT_EU_WMIS,
} from "./seat-eu";
import { decodeVolvoModel, isVolvoVin } from "./volvo";
import { decodeOpelVauxhallModel, isOpelVauxhallVin } from "./opel-vauxhall";

const SKODA_MODEL_78: Record<string, string> = {
  NJ: "Fabia",
  "6H": "Fabia",
  "6Y": "Fabia",
  NX: "Octavia",
  NE: "Octavia",
  "5E": "Octavia",
  "1Z": "Octavia",
  "1U": "Octavia",
  NP: "Superb",
  "3V": "Superb",
  "3T": "Superb",
  "3U": "Superb",
  "55": "Kodiaq",
  NS: "Kodiaq",
  NW: "Scala",
  NU: "Karoq",
  NZ: "Karoq",
  "5L": "Yeti",
  "5J": "Rapid",
  NG: "Rapid",
  NH: "Rapid",
  NK: "Rapid",
  NF: "Citigo",
  "0G": "Rapid Spaceback",
  NM: "Enyaq",
  NY: "Enyaq Coupé",
  PS: "Kamiq",
  PX: "Kamiq",
  RV: "Enyaq iV",
};

const SKODA_PREFIX_RULES = compilePrefixRules([
  { prefix: "TMBJP7NX", model: "Octavia", chassis: "NX" },
  { prefix: "TMBJJ7NX", model: "Octavia", chassis: "NX" },
  { prefix: "TMBJW7NP", model: "Superb", chassis: "NP" },
  { prefix: "TMBER7NW", model: "Scala", chassis: "NW" },
  { prefix: "TMBEP6NJ", model: "Fabia", chassis: "NJ" },
  { prefix: "TMBAG6NE", model: "Octavia", chassis: "NE" },
  { prefix: "TMBAC6NX", model: "Octavia", chassis: "NX" },
  { prefix: "TMBLK7NU", model: "Karoq", chassis: "NU" },
  { prefix: "TMBLK7NZ", model: "Karoq", chassis: "NZ" },
  { prefix: "TMBLK6NZ", model: "Karoq", chassis: "NZ" },
  { prefix: "TMBDK6XK", model: "Kodiaq", chassis: "NS" },
  { prefix: "TMBER6NM", model: "Enyaq", chassis: "NM" },
  { prefix: "TMBER6NY", model: "Enyaq Coupé", chassis: "NY" },
  { prefix: "TMBLK7PS", model: "Kamiq", chassis: "PS" },
  { prefix: "TMBLK7PX", model: "Kamiq", chassis: "PX" },
  { prefix: "TMBAG7NW", model: "Scala", chassis: "NW" },
  { prefix: "TMBJG7NS", model: "Kodiaq", chassis: "NS" },
  { prefix: "TMBJK7NS", model: "Kodiaq", chassis: "NS" },
  { prefix: "TMBEC6NF", model: "Citigo", chassis: "NF" },
  { prefix: "TMBJB7NU", model: "Karoq", chassis: "NU" },
]);

function decodeSkodaModel(vin: string): string | null {
  return matchSkodaRule(vin)?.model ?? null;
}

/** Full Skoda rule hit for series/generation. */
export function matchSkodaRule(vin: string): PrefixRule | null {
  if (!vin.startsWith("TMB") && !vin.startsWith("TM8")) return null;
  const prefixHit = matchLongestPrefix(vin, SKODA_PREFIX_RULES);
  if (prefixHit) return prefixHit;
  if (vin.length < 8) return null;
  const code78 = vin.slice(6, 8);
  const model = SKODA_MODEL_78[code78];
  if (!model) return null;
  return { prefix: vin.slice(0, 8), model, chassis: code78 };
}

// ── Renault — longer VDS prefix rules (4-char MODEL_MAP_4 handles WMI + pos 4) ─
// Longest-prefix first via compilePrefixRules. Prefer specific line codes over VF1R → Zoe.
const RENAULT_PREFIX_RULES = compilePrefixRules([
  { prefix: "VF1RFK", model: "Captur" },
  { prefix: "VF1RJK", model: "Captur" },
  { prefix: "VF1RJH", model: "Captur" },
  { prefix: "VF1RJA", model: "Clio" },
  { prefix: "VF1RJF", model: "Duster" },
  { prefix: "VF1RFB", model: "Austral" },
  { prefix: "VF1RFA", model: "Scenic" },
  { prefix: "VF1RFD", model: "Espace" },
  { prefix: "VF1RF", model: "Clio" },
  { prefix: "VF1R5", model: "Clio" },
  { prefix: "VF1RJ", model: "Clio" },
  { prefix: "VF1LB", model: "Megane" },
  { prefix: "VF1LM", model: "Megane" },
  { prefix: "VF1AG", model: "Arkana" },
  { prefix: "VF1BA", model: "Twingo" },
  { prefix: "VF1BB", model: "Twingo" },
  { prefix: "VF1R", model: "Zoe" },
  // Spanish Renault plants reuse the same VDS family letters as VF1.
  { prefix: "VF2RFK", model: "Captur" },
  { prefix: "VF2RJA", model: "Clio" },
  { prefix: "VF2RF", model: "Clio" },
  { prefix: "VF2RJ", model: "Clio" },
  { prefix: "VF2LB", model: "Megane" },
]);

function isRenaultWmi(wmi: string): boolean {
  return (
    wmi.startsWith("VF1")
    || wmi.startsWith("VF2")
    || wmi.startsWith("VF6")
    || wmi.startsWith("VF8")
  );
}

function decodeRenaultModel(vin: string): string | null {
  const wmi = vin.slice(0, 3);
  if (!isRenaultWmi(wmi)) return null;
  return matchLongestPrefix(vin, RENAULT_PREFIX_RULES)?.model ?? null;
}

// ── Fiat — internal platform code at positions 4–6 (indices 3–5) ─────────────
const FIAT_PLATFORM_456: Record<string, string> = {
  "312": "500",
  "169": "Panda",
  "199": "Punto",
  "356": "500X",
  "334": "Tipo",
  "359": "Tipo",
  "250": "Ducato",
  "176": "Punto",
  "225": "Panda",
  "350": "Idea",
  "220": "Scudo",
  "263": "Doblo",
  "270": "Fiorino",
  "280": "Ducato",
  "290": "Ducato",
  "330": "500L",
  "357": "500L",
};

const FIAT_PREFIX_RULES = compilePrefixRules([
  { prefix: "ZFA312", model: "500" },
  { prefix: "ZFA169", model: "Panda" },
  { prefix: "ZFA199", model: "Punto" },
  { prefix: "ZFA356", model: "500X" },
  { prefix: "ZFA334", model: "Tipo" },
  { prefix: "ZFA359", model: "Tipo" },
  { prefix: "ZFA330", model: "500L" },
  { prefix: "ZFA357", model: "500L" },
  { prefix: "ZFA270", model: "Fiorino" },
  { prefix: "ZFA263", model: "Doblo" },
  { prefix: "ZFB312", model: "500" },
  { prefix: "ZFC312", model: "500" },
  { prefix: "ZCG312", model: "500" },
]);

function isFiatWmi(wmi: string): boolean {
  return (
    wmi.startsWith("ZFA")
    || wmi.startsWith("ZFB")
    || wmi.startsWith("ZFC")
    || wmi.startsWith("ZCG")
  );
}

function decodeFiatModel(vin: string): string | null {
  const wmi = vin.slice(0, 3);
  if (!isFiatWmi(wmi)) return null;
  const prefixHit = matchLongestPrefix(vin, FIAT_PREFIX_RULES);
  if (prefixHit) return prefixHit.model;
  if (vin.length < 6) return null;
  return FIAT_PLATFORM_456[vin.slice(3, 6)] ?? null;
}

// ── Peugeot / Citroën — EU ZZZ format, model at position 7 ───────────────────
const PEUGEOT_ZZZ_AT_7: Record<string, string> = {
  A: "208",
  B: "208",
  C: "208",
  D: "308",
  E: "2008",
  F: "308",
  G: "208",
  H: "308",
  J: "308",
  K: "2008",
  L: "508",
  M: "3008",
  N: "5008",
  P: "Partner / Rifter",
  R: "3008",
  S: "508",
  T: "Traveller",
  U: "2008",
  V: "208",
  W: "508",
  X: "408",
  Y: "5008",
};

const CITROEN_ZZZ_AT_7: Record<string, string> = {
  A: "C3",
  B: "C3",
  C: "C3",
  D: "C4",
  E: "C3 Aircross",
  F: "C4",
  G: "C5",
  H: "C4 Cactus",
  J: "C5 Aircross",
  K: "Berlingo",
  L: "C5",
  M: "C5 Aircross",
  N: "C3",
  P: "Berlingo",
  R: "C4",
  S: "C5",
  T: "Spacetourer",
  U: "C4",
  V: "C3",
  W: "C5",
  X: "C4",
  Y: "C5 Aircross",
};

function decodeZzzEuropeanModel(
  vin: string,
  _wmi: string,
  table: Record<string, string>,
): string | null {
  if (vin.length < 7 || vin.slice(3, 6) !== "ZZZ") return null;
  return table[vin[6]] ?? null;
}

function decodeSeatModel(vin: string): string | null {
  return decodeSeatEuModel(vin);
}

function decodePeugeotModel(vin: string): string | null {
  if (!vin.startsWith("VF3")) return null;
  const zzz = decodeZzzEuropeanModel(vin, "VF3", PEUGEOT_ZZZ_AT_7);
  if (zzz) return zzz;
  return null;
}

function decodeCitroenModel(vin: string): string | null {
  if (!vin.startsWith("VF7")) return null;
  return decodeZzzEuropeanModel(vin, "VF7", CITROEN_ZZZ_AT_7);
}

/** Decode model for Škoda, Renault, Fiat, Peugeot, Citroën, and SEAT. */
export function decodeEuropeanBrandModel(vin: string): string | null {
  const upper = vin.toUpperCase().trim();
  if (upper.length !== 17) return null;

  const wmi = upper.slice(0, 3);
  if (wmi === "TMB" || wmi === "TM8") return decodeSkodaModel(upper);
  if (isRenaultWmi(wmi)) return decodeRenaultModel(upper);
  if (isFiatWmi(wmi)) return decodeFiatModel(upper);
  if (wmi === "VF3") return decodePeugeotModel(upper);
  if (wmi === "VF7") return decodeCitroenModel(upper);
  if ((SEAT_EU_WMIS as readonly string[]).includes(wmi)) return decodeSeatModel(upper);
  if (isVolvoVin(upper)) return decodeVolvoModel(upper);
  if (isOpelVauxhallVin(upper)) return decodeOpelVauxhallModel(upper);
  return null;
}
