/**
 * EU type-approval homologation codes (VIN positions 7–9 after ZZZ filler).
 * Sources: Audi Wikibooks VIN codes, NHTSA Audi MY2024 sheet, EU KBA type-approval tables.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

export type EuHomologationHit = { model: string; chassis: string | null };

type CodeRule = { code: string; model: string; chassis?: string };

function rulesForWmi(wmi: string, codes: CodeRule[]): PrefixRule[] {
  return codes.map(({ code, model, chassis }) => ({
    prefix: `${wmi}ZZZ${code}`,
    model: chassis ? `${model} (${chassis})` : model,
  }));
}

/** Audi / TRU / WVG (Bratislava) — same homologation alphabet. */
const AUDI_HOMOLOGATION_CODES: CodeRule[] = [
  // SUVs — most common decoder gaps
  { code: "F7", model: "Q7", chassis: "4M" },
  { code: "FE", model: "Q7", chassis: "4L" },
  { code: "4L", model: "Q7", chassis: "4L" },
  { code: "4M", model: "Q7", chassis: "4M" },
  { code: "FY", model: "Q5", chassis: "GJ/FY" },
  { code: "FP", model: "Q5", chassis: "8R" },
  { code: "8R", model: "Q5", chassis: "8R" },
  { code: "F1", model: "Q8", chassis: "4M" },
  { code: "GE", model: "Q8 e-tron / e-tron" },
  { code: "GF", model: "Q6 e-tron" },
  { code: "FS", model: "Q3", chassis: "8U" },
  { code: "F3", model: "Q3", chassis: "F3" },
  { code: "FJ", model: "Q3", chassis: "FJ" },
  { code: "FZ", model: "Q4 e-tron" },
  { code: "GB", model: "Q4 e-tron" },
  // Legacy 2-char SUV codes (pos 7–8)
  { code: "GY", model: "Q7", chassis: "4M" },
  { code: "GA", model: "Q5", chassis: "8R" },
  { code: "GS", model: "Q3" },
  // Sedans / sport
  { code: "FC", model: "A6 / A7", chassis: "C7 4G" },
  { code: "F2", model: "A6 / A7", chassis: "C8 4K" },
  { code: "FN", model: "A6", chassis: "C9" },
  { code: "FB", model: "A6", chassis: "C6 4F" },
  { code: "F4", model: "A4", chassis: "B9 8W" },
  { code: "FL", model: "A4", chassis: "B8 8K" },
  { code: "F5", model: "A5", chassis: "F5" },
  { code: "FR", model: "A5", chassis: "8T" },
  { code: "FH", model: "A5", chassis: "8F Cabriolet" },
  { code: "FU", model: "A5", chassis: "FU" },
  { code: "FA", model: "A8", chassis: "4E" },
  { code: "FD", model: "A8", chassis: "4H" },
  { code: "F8", model: "A8", chassis: "4N" },
  { code: "FF", model: "A3", chassis: "8V" },
  { code: "FM", model: "A3", chassis: "8P" },
  { code: "8X", model: "A1" },
  { code: "FW", model: "e-tron GT" },
  // GU is e-tron GT (not Q5) — matches WAUZZZGU premium prefix.
  { code: "GU", model: "e-tron GT" },
  { code: "FG", model: "R8", chassis: "42" },
  { code: "FX", model: "R8", chassis: "4S" },
  { code: "FK", model: "TT", chassis: "8J" },
  { code: "FV", model: "TT", chassis: "8S" },
  // C7 platform — granular 4G* (must beat broad 4G)
  { code: "4G5", model: "A7 Sportback", chassis: "C7" },
  { code: "4G8", model: "A7 Sportback", chassis: "C7" },
  { code: "4GA", model: "A7 Sportback", chassis: "C7" },
  { code: "4GF", model: "A7 Sportback", chassis: "C7" },
  { code: "4G2", model: "A6", chassis: "C7" },
  { code: "4GC", model: "A6", chassis: "C7" },
  { code: "4GD", model: "A6 Avant", chassis: "C7" },
  { code: "4G6", model: "A6 / A7", chassis: "C7" },
  { code: "4G", model: "A6 / A7", chassis: "C7" },
  { code: "4F", model: "A6 Avant" },
  { code: "4H", model: "A7 Sportback" },
  { code: "4A", model: "A8" },
  { code: "8V", model: "A3" },
  { code: "8K", model: "A4" },
  { code: "8T", model: "A5" },
  { code: "8U", model: "Q3" },
];

const AUDI_WMIS = ["WAU", "TRU", "WVG"] as const;

const AUDI_EU_RULES = compilePrefixRules(
  AUDI_WMIS.flatMap((wmi) => rulesForWmi(wmi, AUDI_HOMOLOGATION_CODES)),
);

/** True when a WVG (Bratislava) VIN carries an Audi homologation code, not VW. */
export function isAudiHomologationVin(vin: string): boolean {
  const u = vin.toUpperCase();
  if (!u.startsWith("WVG") || u.slice(3, 6) !== "ZZZ" || u.length < 9) return false;
  return decodeAudiEuHomologation(u) != null;
}

export function decodeAudiEuHomologation(vin: string): EuHomologationHit | null {
  const u = vin.toUpperCase();
  if (u.length < 9 || u.slice(3, 6) !== "ZZZ") return null;
  const wmi = u.slice(0, 3);
  if (!wmi.startsWith("WAU") && !wmi.startsWith("TRU") && wmi !== "WVG") return null;
  const hit = matchLongestPrefix(u, AUDI_EU_RULES);
  if (!hit) return null;
  const paren = hit.model.match(/^(.+?) \((.+)\)$/);
  if (paren) return { model: paren[1], chassis: paren[2] };
  return { model: hit.model, chassis: null };
}

/** BMW EU ZZZ — homologation at 7–9; first digit often encodes series. */
const BMW_EU_SERIES: Record<string, string> = {
  "1": "1 Series",
  "2": "2 Series",
  "3": "3 Series",
  "4": "4 Series",
  "5": "5 Series",
  "6": "6 Series",
  "7": "7 Series",
  "8": "8 Series",
};

const BMW_EU_SPECIFIC: CodeRule[] = [
  { code: "310", model: "3 Series" },
  { code: "3A0", model: "3 Series" },
  { code: "3W0", model: "3 Series", chassis: "G20/G21" },
  { code: "5A0", model: "5 Series" },
  { code: "5E0", model: "5 Series", chassis: "G30/G31" },
  { code: "5J0", model: "5 Series", chassis: "F10/F11" },
  { code: "6C0", model: "6 Series", chassis: "F12/F13" },
  { code: "6D0", model: "6 Series", chassis: "F06 Gran Coupé" },
  { code: "6F0", model: "6 Series", chassis: "F12/F13" },
  { code: "7C0", model: "7 Series", chassis: "G11/G12" },
  { code: "7L0", model: "7 Series", chassis: "G70" },
  { code: "4C0", model: "4 Series" },
  { code: "4S0", model: "4 Series", chassis: "G22/G26" },
  { code: "1C0", model: "1 Series", chassis: "F20/F21" },
  { code: "1H0", model: "1 Series", chassis: "F40" },
  { code: "2A0", model: "2 Series", chassis: "F45 Active Tourer" },
  { code: "2T0", model: "2 Series", chassis: "G42 Coupé" },
  { code: "8C0", model: "8 Series", chassis: "G14/G15/G16" },
  { code: "XF3", model: "X3", chassis: "G01" },
  { code: "XF5", model: "X5", chassis: "G05" },
  { code: "XF6", model: "X6", chassis: "G06" },
  { code: "XF7", model: "X7", chassis: "G07" },
];

const BMW_EU_WMIS = ["WBA", "WBS", "WBY"] as const;
const BMW_EU_RULES = compilePrefixRules(
  BMW_EU_WMIS.flatMap((wmi) => rulesForWmi(wmi, BMW_EU_SPECIFIC)),
);

export function decodeBmwEuHomologation(vin: string): EuHomologationHit | null {
  const u = vin.toUpperCase();
  if (u.length < 9 || u.slice(3, 6) !== "ZZZ") return null;
  const wmi = u.slice(0, 3);
  if (!wmi.startsWith("WBA") && !wmi.startsWith("WBS") && !wmi.startsWith("WBY")) return null;

  const specific = matchLongestPrefix(u, BMW_EU_RULES);
  if (specific) {
    const paren = specific.model.match(/^(.+?) \((.+)\)$/);
    if (paren) return { model: paren[1], chassis: paren[2] };
    return { model: specific.model, chassis: null };
  }

  const series = BMW_EU_SERIES[u[6]];
  if (series) return { model: series, chassis: null };
  return null;
}

/** Mercedes EU ZZZ — homologation embeds chassis digits (177, 213, 205, …). */
const MERCEDES_EU_CODES: CodeRule[] = [
  { code: "177", model: "A-Class", chassis: "W177" },
  { code: "176", model: "A-Class", chassis: "W176" },
  { code: "118", model: "CLA", chassis: "C118" },
  { code: "205", model: "C-Class", chassis: "W205" },
  { code: "206", model: "C-Class", chassis: "W206" },
  { code: "204", model: "C-Class", chassis: "W204" },
  { code: "203", model: "C-Class", chassis: "W203" },
  { code: "202", model: "C-Class", chassis: "W202" },
  { code: "213", model: "E-Class", chassis: "W213" },
  { code: "214", model: "E-Class", chassis: "W214" },
  { code: "222", model: "S-Class", chassis: "W222" },
  { code: "223", model: "S-Class", chassis: "W223" },
  { code: "253", model: "GLC", chassis: "X253" },
  { code: "254", model: "GLC", chassis: "X254" },
  { code: "166", model: "GLE", chassis: "W166" },
  { code: "167", model: "GLE / GLS", chassis: "W167/X167" },
  { code: "247", model: "GLA / GLB", chassis: "H247/X247" },
  { code: "246", model: "B-Class", chassis: "W246" },
  { code: "245", model: "B-Class", chassis: "W245" },
  { code: "243", model: "EQA / EQB", chassis: "H243/X243" },
  { code: "463", model: "G-Class", chassis: "W463" },
  { code: "290", model: "EQS", chassis: "V297" },
  { code: "294", model: "EQE", chassis: "V294" },
  { code: "296", model: "EQS SUV", chassis: "X296" },
  { code: "293", model: "EQC", chassis: "N293" },
  { code: "236", model: "CLE", chassis: "C236" },
  { code: "238", model: "E-Class Coupé/Cabrio", chassis: "C238" },
  { code: "257", model: "CLS", chassis: "C257" },
  { code: "192", model: "AMG GT", chassis: "C192" },
  { code: "197", model: "SL", chassis: "R232" },
];

const MERCEDES_WMIS = ["WDD", "WDB", "WDC", "W1K"] as const;
const MERCEDES_EU_RULES = compilePrefixRules(
  MERCEDES_WMIS.flatMap((wmi) => rulesForWmi(wmi, MERCEDES_EU_CODES)),
);

export function decodeMercedesEuHomologation(vin: string): EuHomologationHit | null {
  const u = vin.toUpperCase();
  if (u.length < 9 || u.slice(3, 6) !== "ZZZ") return null;
  const wmi = u.slice(0, 3);
  if (!MERCEDES_WMIS.some((p) => wmi.startsWith(p))) return null;
  const hit = matchLongestPrefix(u, MERCEDES_EU_RULES);
  if (!hit) return null;
  const paren = hit.model.match(/^(.+?) \((.+)\)$/);
  if (paren) return { model: paren[1], chassis: paren[2] };
  return { model: hit.model, chassis: null };
}

export function homologationToDisplay(hit: EuHomologationHit): string {
  if (!hit.chassis) return hit.model;
  if (hit.chassis.startsWith(hit.model)) return hit.chassis;
  return `${hit.model} (${hit.chassis})`;
}
