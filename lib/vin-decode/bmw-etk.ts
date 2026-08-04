/**
 * Classic European BMW Group FINs — ETK type codes at positions 4–7.
 *
 * Layout (e.g. WBANC71020B644072):
 *   WMI (3) + type code NC71 (4) + filler (1) + check (1) + pos.10 + plant + serial
 *
 * Position 10 is often "0" (not an ISO model-year digit) on these FINs —
 * never invent a year from it. Engine at pos.8 is not reliable either.
 *
 * Accuracy contract: longest type-code match + optional production window;
 * ambiguous → null; no engine/fuel/drive inventing.
 *
 * Verified regression: NC71 → 5 Series (E60) 530d EUR.
 */

import { compilePrefixRules, type PrefixRule } from "./prefix-match";

export type BmwEtkDecode = {
  model: string;
  chassis: string | null;
  displayModel: string;
};

type EtkRule = PrefixRule & {
  yearFrom?: number;
  yearTo?: number;
};

const BMW_ETK_WMI = /^(WBA|WBS|WBY|WBX)/;

/** Type code at pos. 4–7: two letters + two alphanumerics (e.g. NC71, DN63, XA71). */
const ETK_TYPE_RE = /^[A-HJ-NPR-Z]{2}[A-HJ-NPR-Z0-9]{2}$/;

/**
 * High-confidence ETK type → model/chassis clusters (not a full RealOEM dump).
 * Prefixes are WMI + 4-char type; compilePrefixRules sorts longest-first.
 */
const ETK_CODES: Array<{ code: string; model: string; chassis?: string; yearFrom?: number; yearTo?: number }> = [
  // ── E60 / E61 5 Series (2003–2010) — NC71 = 530d EUR ─────────────────────
  { code: "NC71", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NC72", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NC73", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NC91", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NC92", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NB51", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NB52", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NA01", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NA51", model: "5 Series", chassis: "E61", yearFrom: 2004, yearTo: 2010 },
  { code: "NA61", model: "5 Series", chassis: "E61", yearFrom: 2004, yearTo: 2010 },
  { code: "NE31", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },
  { code: "NF31", model: "5 Series", chassis: "E60", yearFrom: 2003, yearTo: 2010 },

  // ── E39 5 Series ─────────────────────────────────────────────────────────
  { code: "DT41", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "DT51", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "DT53", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "DN63", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "DN64", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "DM63", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "DE63", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },
  { code: "BJ61", model: "5 Series", chassis: "E39", yearFrom: 1995, yearTo: 2004 },

  // ── E38 7 Series ─────────────────────────────────────────────────────────
  { code: "GC41", model: "7 Series", chassis: "E38", yearFrom: 1994, yearTo: 2001 },
  { code: "GC43", model: "7 Series", chassis: "E38", yearFrom: 1994, yearTo: 2001 },
  { code: "GH41", model: "7 Series", chassis: "E38", yearFrom: 1994, yearTo: 2001 },

  // ── E65 / E66 7 Series ───────────────────────────────────────────────────
  { code: "GN61", model: "7 Series", chassis: "E65", yearFrom: 2001, yearTo: 2008 },
  { code: "GN62", model: "7 Series", chassis: "E65", yearFrom: 2001, yearTo: 2008 },
  { code: "HL61", model: "7 Series", chassis: "E66", yearFrom: 2001, yearTo: 2008 },

  // ── E46 3 Series ─────────────────────────────────────────────────────────
  // AV11 = EUR 320i sedan M54 (RealOEM / BMW parts catalog); not a generic 3 Series guess.
  { code: "AV11", model: "320i", chassis: "E46", yearFrom: 1999, yearTo: 2001 },
  { code: "AV12", model: "320i", chassis: "E46", yearFrom: 2000, yearTo: 2001 },
  { code: "AM53", model: "3 Series", chassis: "E46", yearFrom: 1998, yearTo: 2006 },
  { code: "AM33", model: "3 Series", chassis: "E46", yearFrom: 1998, yearTo: 2006 },
  { code: "AV53", model: "3 Series", chassis: "E46", yearFrom: 1998, yearTo: 2006 },
  { code: "AX53", model: "3 Series", chassis: "E46", yearFrom: 1998, yearTo: 2006 },
  { code: "BL53", model: "3 Series", chassis: "E46", yearFrom: 1998, yearTo: 2006 },

  // ── E90 / E91 / E92 / E93 3 Series ───────────────────────────────────────
  { code: "VA31", model: "3 Series", chassis: "E90/E91", yearFrom: 2005, yearTo: 2012 },
  { code: "VA51", model: "3 Series", chassis: "E90/E91", yearFrom: 2005, yearTo: 2012 },
  { code: "VB31", model: "3 Series", chassis: "E90/E91", yearFrom: 2005, yearTo: 2012 },
  { code: "PX31", model: "3 Series", chassis: "E92 Coupé", yearFrom: 2006, yearTo: 2013 },
  { code: "PX53", model: "3 Series", chassis: "E92 Coupé", yearFrom: 2006, yearTo: 2013 },

  // ── E83 X3 (Magna / WBX common) ──────────────────────────────────────────
  { code: "PC71", model: "X3", chassis: "E83", yearFrom: 2003, yearTo: 2010 },
  { code: "PC91", model: "X3", chassis: "E83", yearFrom: 2003, yearTo: 2010 },
  { code: "PA91", model: "X3", chassis: "E83", yearFrom: 2003, yearTo: 2010 },

  // ── E53 / E70 X5 ─────────────────────────────────────────────────────────
  { code: "FB53", model: "X5", chassis: "E53", yearFrom: 1999, yearTo: 2006 },
  { code: "FG01", model: "X5", chassis: "E70", yearFrom: 2006, yearTo: 2013 },
  { code: "FG31", model: "X5", chassis: "E70", yearFrom: 2006, yearTo: 2013 },

  // ── F10 / F11 (letter type codes overlapping modern XA* rules) ───────────
  { code: "XA71", model: "5 Series", chassis: "F10/F11", yearFrom: 2010, yearTo: 2017 },
  { code: "XA72", model: "5 Series", chassis: "F10/F11", yearFrom: 2010, yearTo: 2017 },
  { code: "XA51", model: "5 Series", chassis: "F10/F11", yearFrom: 2010, yearTo: 2017 },
  { code: "FZ01", model: "5 Series", chassis: "F10/F11", yearFrom: 2010, yearTo: 2017 },

  // ── F30 / F31 ────────────────────────────────────────────────────────────
  { code: "3V01", model: "3 Series", chassis: "F30 Sedan", yearFrom: 2012, yearTo: 2019 },
  { code: "3A91", model: "3 Series", chassis: "F30 Sedan", yearFrom: 2012, yearTo: 2019 },
];

const WMIS = ["WBA", "WBS", "WBY", "WBX"] as const;

const ETK_RULES = compilePrefixRules(
  WMIS.flatMap((wmi) =>
    ETK_CODES.map(({ code, model, chassis, yearFrom, yearTo }) => ({
      prefix: `${wmi}${code}`,
      model,
      chassis,
      yearFrom,
      yearTo,
    })),
  ),
) as EtkRule[];

/** True when VIN looks like a classic European BMW ETK FIN (type code at 4–7). */
export function isBmwEuroEtkVin(vin: string): boolean {
  const u = vin.toUpperCase().trim();
  if (u.length < 11) return false;
  if (!BMW_ETK_WMI.test(u)) return false;
  if (u.slice(3, 6) === "ZZZ") return false;
  const type = u.slice(3, 7);
  if (!ETK_TYPE_RE.test(type)) return false;
  // Digit-led modern series (WBA3V1, WBA5J…) are not classic ETK letter pairs.
  if (/^\d/.test(type[0]!)) return false;
  return true;
}

/**
 * Classic EU BMW FINs often put "0" (or another non-year char) at position 10.
 * ISO year charset excludes I,O,Q,U,Z and digit 0.
 */
export function bmwEtkOmitsIsoYear(vin: string): boolean {
  if (!isBmwEuroEtkVin(vin)) return false;
  const y = vin.toUpperCase()[9];
  if (!y) return true;
  if (y === "0") return true;
  // Valid ISO year chars: A–Y skip I,O,Q,U,Z; digits 1–9
  return !/^[A-HJ-NPR-TV-Y1-9]$/.test(y);
}

function hitToDecode(rule: EtkRule): BmwEtkDecode {
  const chassis = rule.chassis ?? null;
  return {
    model: rule.model,
    chassis,
    displayModel: chassis ? `${rule.model} (${chassis})` : rule.model,
  };
}

/**
 * Decode classic ETK type code. Callers should try modern BMW_RULES first
 * so longer modern prefixes (WBAXA71, WBA3V1) win when both could apply.
 */
export function decodeBmwEtk(vin: string): BmwEtkDecode | null {
  const u = vin.toUpperCase().trim();
  if (!isBmwEuroEtkVin(u)) return null;

  for (const rule of ETK_RULES) {
    if (!u.startsWith(rule.prefix)) continue;
    return hitToDecode(rule);
  }
  return null;
}
