/**
 * Lightweight US VDS prefix → model (+ optional generation) for common
 * Ford / GM / Stellantis / Honda / Toyota North America VINs.
 * Complements coarse MODEL_MAP_4; NHTSA still enriches trim when available.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

const US_VDS_RULES = compilePrefixRules([
  // Ford
  { prefix: "1FTFW1", model: "F-150", chassis: "P702" },
  { prefix: "1FTEW1", model: "F-150", chassis: "P702" },
  { prefix: "1FTFW2", model: "F-150", chassis: "P702" },
  { prefix: "1FTMF1", model: "F-150", chassis: "P415" },
  { prefix: "1FMCU0", model: "Escape", chassis: "CX482" },
  { prefix: "1FMCU9", model: "Escape" },
  { prefix: "1FM5K8", model: "Explorer", chassis: "U625" },
  { prefix: "1FMSK8", model: "Explorer", chassis: "U625" },
  { prefix: "1FMHK7", model: "Edge" },
  { prefix: "1FA6P8", model: "Mustang", chassis: "S550" },
  { prefix: "1FA6P5", model: "Mustang", chassis: "S650" },
  { prefix: "3FMTK1", model: "Mustang Mach-E" },
  { prefix: "3FTTW8", model: "Maverick" },
  { prefix: "1FMDE5", model: "Bronco Sport" },
  { prefix: "1FMEE5", model: "Bronco" },
  { prefix: "1FTYR2", model: "Transit" },
  { prefix: "1FTBW2", model: "Transit" },
  { prefix: "1FADP3", model: "Focus", chassis: "Mk3 US" },
  { prefix: "3FA6P0", model: "Fusion" },
  // GM — Chevrolet / GMC / Cadillac
  { prefix: "1GCUY", model: "Silverado 1500" },
  { prefix: "1GCUC", model: "Silverado 1500" },
  { prefix: "1GTU9", model: "Sierra 1500" },
  { prefix: "1GNSK", model: "Tahoe" },
  { prefix: "1GNER", model: "Traverse" },
  { prefix: "1G1FB", model: "Camaro" },
  { prefix: "1G1ZE", model: "Malibu" },
  { prefix: "2GNAX", model: "Equinox" },
  { prefix: "3GNAX", model: "Equinox" },
  { prefix: "1GYKN", model: "XT5" },
  { prefix: "1GYS4", model: "Escalade" },
  // Stellantis — Jeep / Ram / Dodge / Chrysler
  { prefix: "1C4RJ", model: "Grand Cherokee" },
  { prefix: "1C4HJ", model: "Wrangler" },
  { prefix: "1C4BJ", model: "Wrangler" },
  { prefix: "1C4NJ", model: "Compass" },
  { prefix: "1C4PJ", model: "Cherokee" },
  { prefix: "1C6SR", model: "Ram 1500" },
  { prefix: "1C6RR", model: "Ram 1500" },
  { prefix: "2C3CD", model: "Charger" },
  { prefix: "2C3CM", model: "Challenger" },
  { prefix: "3C4PD", model: "Pacifica" },
  { prefix: "3C6UR", model: "Ram 2500/3500" },
  // Honda / Acura US
  { prefix: "1HGCV1", model: "Accord", chassis: "10th gen" },
  { prefix: "1HGCV2", model: "Accord", chassis: "10th gen" },
  { prefix: "1HGCY", model: "Accord", chassis: "11th gen" },
  { prefix: "1HGCV3", model: "Accord", chassis: "11th gen Hybrid" },
  { prefix: "2HGFC2", model: "Civic", chassis: "10th gen" },
  { prefix: "2HGFE2", model: "Civic", chassis: "11th gen" },
  { prefix: "2HGFC1", model: "Civic", chassis: "10th gen" },
  { prefix: "19XFC2", model: "Civic" },
  { prefix: "19XFL2", model: "Civic", chassis: "11th gen" },
  { prefix: "5J6RM4", model: "CR-V", chassis: "5th gen" },
  { prefix: "5J6RW2", model: "CR-V", chassis: "6th gen" },
  { prefix: "5J6RT", model: "CR-V", chassis: "5th gen Hybrid" },
  { prefix: "2HKRS4", model: "CR-V", chassis: "5th gen CA" },
  { prefix: "3CZRU5", model: "HR-V", chassis: "3rd gen" },
  { prefix: "3CZRU6", model: "HR-V" },
  { prefix: "5FNRL6", model: "Odyssey" },
  { prefix: "5J8YD", model: "Pilot" },
  { prefix: "5FNYF8", model: "Pilot" },
  { prefix: "5FNYF6", model: "Passport" },
  { prefix: "5FNYF5", model: "Ridgeline" },
  { prefix: "19UUB", model: "Acura TLX" },
  { prefix: "5J8TB", model: "Acura MDX" },
  { prefix: "JHMFD", model: "Fit", chassis: "3rd gen" },
  { prefix: "JHMGE", model: "Fit", chassis: "2nd gen" },
  { prefix: "JHMZF", model: "Insight" },
  // Toyota / Lexus USA / Canada
  { prefix: "4T1B11", model: "Camry", chassis: "XV70" },
  { prefix: "4T1K61", model: "Camry", chassis: "XV70 Hybrid" },
  { prefix: "4T1G11", model: "Camry", chassis: "XV70" },
  { prefix: "4T1C11", model: "Camry", chassis: "XV40" },
  { prefix: "4T1BF1", model: "Camry", chassis: "XV50" },
  { prefix: "2T1BUR", model: "Corolla", chassis: "E170" },
  { prefix: "2T3BF1", model: "RAV4", chassis: "XA40" },
  { prefix: "2T3P1R", model: "RAV4", chassis: "XA50" },
  { prefix: "5TDZA3", model: "Sienna", chassis: "XL30" },
  { prefix: "5TDYZ3", model: "Sienna", chassis: "XL40" },
  { prefix: "5TFDY5", model: "Tundra", chassis: "XK50" },
  { prefix: "5TFJA5", model: "Tundra", chassis: "XK70" },
  { prefix: "5TFAX5", model: "Tacoma", chassis: "N300" },
  { prefix: "5TFLA5", model: "Tacoma", chassis: "N300" },
  { prefix: "5TDBK3", model: "Highlander", chassis: "XU50" },
  { prefix: "5TDDZ3", model: "Highlander", chassis: "XU70" },
  { prefix: "5TDBR3", model: "Sequoia", chassis: "XK60" },
  { prefix: "2T2BZM", model: "Lexus RX" },
  { prefix: "2T2AUD", model: "Lexus NX" },
  { prefix: "JTJBAR", model: "Lexus NX", chassis: "AZ20" },
]);

export function matchUsVdsRule(vin: string): PrefixRule | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 8) return null;
  return matchLongestPrefix(u, US_VDS_RULES);
}

export function decodeUsVdsModel(vin: string): string | null {
  return matchUsVdsRule(vin)?.model ?? null;
}

/** Stellantis 1C4 WMI is shared; badge Jeep when VDS maps to a Jeep line. */
const JEEP_VDS_MODELS = new Set([
  "Wrangler",
  "Grand Cherokee",
  "Compass",
  "Cherokee",
  "Renegade",
  "Gladiator",
  "Wagoneer",
  "Grand Wagoneer",
]);

export function resolveUsVdsMake(vin: string): string | null {
  const hit = matchUsVdsRule(vin);
  if (!hit) return null;
  if (JEEP_VDS_MODELS.has(hit.model)) return "Jeep";
  return null;
}
