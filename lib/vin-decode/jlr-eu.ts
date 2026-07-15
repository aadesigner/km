/**
 * Jaguar Land Rover decoding — EU ZZZ homologation + non-ZZZ UK/US VDS prefixes.
 * SAL* = Land Rover / Range Rover family; SAJ* / SAD* = Jaguar.
 * Prefix-only (no fuzzy guesses). Sources: EU KBA codes, NHTSA / plant sheets.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

export type JlrDecode = { model: string; chassis: string | null; displayModel: string };

type CodeRule = { code: string; model: string; chassis?: string };

function rulesForWmi(wmi: string, codes: CodeRule[]): PrefixRule[] {
  return codes.map(({ code, model, chassis }) => ({
    prefix: `${wmi}ZZZ${code}`,
    model: chassis ? `${model} (${chassis})` : model,
  }));
}

/** EU type-approval codes at positions 7–9 after ZZZ. */
const LAND_ROVER_CODES: CodeRule[] = [
  { code: "BG", model: "Range Rover Sport", chassis: "L494" },
  { code: "BN", model: "Range Rover", chassis: "L405/L460" },
  { code: "BP", model: "Range Rover", chassis: "L460" },
  { code: "KV", model: "Discovery", chassis: "L462" },
  { code: "JA", model: "Discovery Sport", chassis: "L550" },
  { code: "FG", model: "Range Rover Evoque", chassis: "L538" },
  { code: "KJ", model: "Range Rover Velar", chassis: "L560" },
  { code: "LM", model: "Defender", chassis: "L663" },
  { code: "LD", model: "Defender", chassis: "L663" },
  { code: "AN", model: "Defender", chassis: "L316" },
  { code: "AA", model: "Defender", chassis: "L316" },
  { code: "FE", model: "Freelander", chassis: "L359" },
  { code: "EV", model: "Range Rover Evoque", chassis: "L551" },
  { code: "KG", model: "Discovery", chassis: "L319" },
  { code: "KZ", model: "Discovery", chassis: "L462" },
  { code: "BH", model: "Range Rover Sport", chassis: "L320" },
  { code: "BJ", model: "Range Rover", chassis: "L322" },
  { code: "BK", model: "Range Rover", chassis: "L405" },
  { code: "BL", model: "Range Rover Sport", chassis: "L494" },
  { code: "BM", model: "Range Rover Velar", chassis: "L560" },
  { code: "GA", model: "Range Rover Evoque", chassis: "L538" },
  { code: "GB", model: "Range Rover Sport", chassis: "L461" },
  { code: "GC", model: "Range Rover", chassis: "L460" },
  { code: "GD", model: "Discovery Sport", chassis: "L550" },
  { code: "GE", model: "Discovery", chassis: "L462" },
  { code: "GF", model: "Defender", chassis: "L663" },
  { code: "LA", model: "Defender", chassis: "L663" },
  { code: "LB", model: "Defender", chassis: "L663" },
];

const JAGUAR_CODES: CodeRule[] = [
  { code: "BN", model: "XF", chassis: "X260" },
  { code: "BG", model: "F-Pace", chassis: "X761" },
  { code: "JA", model: "E-Pace", chassis: "X540" },
  { code: "CF", model: "F-Type", chassis: "X152" },
  { code: "BK", model: "XE", chassis: "X760" },
  { code: "BP", model: "XJ", chassis: "X351" },
  { code: "BM", model: "I-Pace", chassis: "X590" },
  { code: "GA", model: "F-Pace", chassis: "X761" },
  { code: "GB", model: "XE", chassis: "X760" },
  { code: "GC", model: "XF", chassis: "X260" },
  { code: "GD", model: "F-Type", chassis: "X152" },
  { code: "GE", model: "E-Pace", chassis: "X540" },
  { code: "GF", model: "I-Pace", chassis: "X590" },
  { code: "AA", model: "XJ", chassis: "X351" },
  { code: "AB", model: "XK", chassis: "X150" },
  { code: "AC", model: "S-Type", chassis: "X200" },
  { code: "AD", model: "X-Type", chassis: "X400" },
];

const LAND_ROVER_ZZZ = compilePrefixRules(rulesForWmi("SAL", LAND_ROVER_CODES));
const JAGUAR_ZZZ = compilePrefixRules(rulesForWmi("SAJ", JAGUAR_CODES));

/**
 * Non-ZZZ UK / US VDS prefixes (positions 1–6+).
 * SALE alone is ambiguous (Evoque vs Defender) — only longer Defender-safe codes.
 */
const LAND_ROVER_PREFIX = compilePrefixRules([
  // Classic UK SALL* (Solihull era)
  { prefix: "SALLDH", model: "Defender", chassis: "L316" },
  { prefix: "SALLDK", model: "Defender", chassis: "L316" },
  { prefix: "SALLDM", model: "Defender", chassis: "L316" },
  { prefix: "SALLSA", model: "Discovery", chassis: "L319" },
  { prefix: "SALLSB", model: "Discovery", chassis: "L319" },
  { prefix: "SALLMH", model: "Range Rover", chassis: "L322" },
  { prefix: "SALLNA", model: "Freelander", chassis: "L314" },
  { prefix: "SALLNB", model: "Freelander", chassis: "L359" },
  // Modern Defender L663 — NHTSA / US VDS (SALE*)
  { prefix: "SALEX", model: "Defender", chassis: "L663" },
  { prefix: "SALE1", model: "Defender", chassis: "L663" },
  { prefix: "SALEY", model: "Defender", chassis: "L663" },
  { prefix: "SALEJ", model: "Defender", chassis: "L663" },
  { prefix: "SALEK", model: "Defender", chassis: "L663" },
  { prefix: "SALEW", model: "Defender", chassis: "L663" },
  { prefix: "SALEB", model: "Defender", chassis: "L663" },
  { prefix: "SALEP", model: "Defender", chassis: "L663" },
  { prefix: "SALEE", model: "Defender", chassis: "L663" },
  { prefix: "SALEV", model: "Defender", chassis: "L663" },
  // Velar US
  { prefix: "SALGS", model: "Range Rover Velar", chassis: "L560" },
  { prefix: "SALGV", model: "Range Rover Velar", chassis: "L560" },
  { prefix: "SALME", model: "Range Rover Velar", chassis: "L560" },
  // Discovery / Sport US
  { prefix: "SALRT", model: "Discovery", chassis: "L462" },
  { prefix: "SALRG", model: "Discovery", chassis: "L462" },
  { prefix: "SALCP", model: "Discovery Sport", chassis: "L550" },
  { prefix: "SALCA", model: "Discovery Sport", chassis: "L550" },
  // Range Rover / Sport US (L460 / L461 era)
  { prefix: "SALKP", model: "Range Rover", chassis: "L460" },
  { prefix: "SALZA", model: "Range Rover", chassis: "L460" },
  { prefix: "SALZL", model: "Range Rover", chassis: "L460" },
  { prefix: "SAL1P", model: "Range Rover Sport", chassis: "L461" },
  { prefix: "SAL1L", model: "Range Rover Sport", chassis: "L461" },
  // Evoque US — avoid bare SALE*
  { prefix: "SALFA", model: "Range Rover Evoque", chassis: "L551" },
  { prefix: "SALFB", model: "Range Rover Evoque", chassis: "L551" },
  { prefix: "SALZA2", model: "Range Rover Evoque", chassis: "L551" },
]);

const JAGUAR_PREFIX = compilePrefixRules([
  { prefix: "SAJXA", model: "F-Pace", chassis: "X761" },
  { prefix: "SAJXB", model: "F-Pace", chassis: "X761" },
  { prefix: "SAJWA", model: "F-Type", chassis: "X152" },
  { prefix: "SAJWB", model: "F-Type", chassis: "X152" },
  { prefix: "SAJVA", model: "XF", chassis: "X260" },
  { prefix: "SAJVB", model: "XF", chassis: "X260" },
  { prefix: "SAJAA", model: "XE", chassis: "X760" },
  { prefix: "SAJAB", model: "XE", chassis: "X760" },
  { prefix: "SAJEA", model: "E-Pace", chassis: "X540" },
  { prefix: "SAJEB", model: "E-Pace", chassis: "X540" },
  { prefix: "SAJCA", model: "I-Pace", chassis: "X590" },
  { prefix: "SAJCM", model: "I-Pace", chassis: "X590" },
  { prefix: "SADFP", model: "I-Pace", chassis: "X590" },
  { prefix: "SADFE", model: "I-Pace", chassis: "X590" },
  { prefix: "SADFM", model: "I-Pace", chassis: "X590" },
]);

function hitToDecode(hit: PrefixRule | null): JlrDecode | null {
  if (!hit) return null;
  const paren = hit.model.match(/^(.+?) \((.+)\)$/);
  if (paren) {
    return { model: paren[1], chassis: paren[2], displayModel: hit.model };
  }
  return {
    model: hit.model,
    chassis: hit.chassis ?? null,
    displayModel: hit.chassis ? `${hit.model} (${hit.chassis})` : hit.model,
  };
}

export function isJlrVin(vin: string): boolean {
  const wmi = vin.toUpperCase().slice(0, 3);
  return wmi === "SAL" || wmi === "SAJ" || wmi === "SAD";
}

export function decodeJlrEuModel(vin: string): string | null {
  return decodeJlr(vin)?.displayModel ?? null;
}

/**
 * Full JLR decode: EU ZZZ homologation first, then non-ZZZ UK/US prefixes.
 */
export function decodeJlr(vin: string): JlrDecode | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 9) return null;
  if (!isJlrVin(u)) return null;

  if (u.slice(3, 6) === "ZZZ") {
    if (u.startsWith("SAL")) return hitToDecode(matchLongestPrefix(u, LAND_ROVER_ZZZ));
    if (u.startsWith("SAJ")) return hitToDecode(matchLongestPrefix(u, JAGUAR_ZZZ));
    return null;
  }

  if (u.startsWith("SAL")) return hitToDecode(matchLongestPrefix(u, LAND_ROVER_PREFIX));
  if (u.startsWith("SAJ") || u.startsWith("SAD")) {
    return hitToDecode(matchLongestPrefix(u, JAGUAR_PREFIX));
  }
  return null;
}

/** @deprecated Use decodeJlr — kept for existing call sites. */
export function decodeJlrEu(vin: string): JlrDecode | null {
  return decodeJlr(vin);
}
