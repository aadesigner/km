/**
 * Jaguar Land Rover EU type-approval decoding (SALZZZ* / SAJZZZ*).
 * Positions 7–9 after ZZZ carry KBA homologation codes.
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
  { code: "AA", model: "XJ", chassis: "X351" },
  { code: "AB", model: "XK", chassis: "X150" },
  { code: "AC", model: "S-Type", chassis: "X200" },
  { code: "AD", model: "X-Type", chassis: "X400" },
];

const LAND_ROVER_RULES = compilePrefixRules(rulesForWmi("SAL", LAND_ROVER_CODES));
const JAGUAR_RULES = compilePrefixRules(rulesForWmi("SAJ", JAGUAR_CODES));

function hitToDecode(hit: PrefixRule | null): JlrDecode | null {
  if (!hit) return null;
  const paren = hit.model.match(/^(.+?) \((.+)\)$/);
  if (paren) {
    return { model: paren[1], chassis: paren[2], displayModel: hit.model };
  }
  return { model: hit.model, chassis: null, displayModel: hit.model };
}

export function decodeJlrEuModel(vin: string): string | null {
  return decodeJlrEu(vin)?.displayModel ?? null;
}

export function decodeJlrEu(vin: string): JlrDecode | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 9 || u.slice(3, 6) !== "ZZZ") return null;

  if (u.startsWith("SAL")) return hitToDecode(matchLongestPrefix(u, LAND_ROVER_RULES));
  if (u.startsWith("SAJ")) return hitToDecode(matchLongestPrefix(u, JAGUAR_RULES));
  return null;
}
