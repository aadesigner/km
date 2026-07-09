/**
 * Deeper model decode for BMW, Mercedes-Benz, Audi, Porsche, Volkswagen, and MINI VINs.
 * Uses manufacturer-specific VDS prefix tables (positions 4–7+).
 *
 * Note: factory option packages (SA codes) are not encoded in the public VIN;
 * this module covers model line, chassis generation, body style, and engine family.
 */

import {
  decodeAudiEuHomologation,
  decodeBmwEuHomologation,
  decodeMercedesEuHomologation,
  homologationToDisplay,
} from "./eu-zzz-homologation";
import { decodeJlrEu } from "./jlr-eu";
import { isVagWmi, normalizeVagVinForPremium } from "./vag-wmi";
import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

type PremiumPrefixRule = PrefixRule & { chassis?: string };

/** BMW model-year char (position 10) — duplicated here to avoid circular import from vinDecoder. */
function bmwVinModelYear(vin: string): number | null {
  const YEAR_MAP: Record<string, number> = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
    T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
    "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005, "6": 2006,
    "7": 2007, "8": 2008, "9": 2009,
  };
  const code = vin[9]?.toUpperCase();
  if (!code) return null;
  const base = YEAR_MAP[code];
  if (base == null) return null;
  const candidate = base < 2010 ? base + 30 : base;
  const currentYear = new Date().getFullYear();
  return candidate <= currentYear + 2 ? candidate : base;
}

/**
 * BMW F32/F33/F36 use ETK type codes at VDS positions 4–5 (VIN indices 3–4).
 * e.g. 3V71 = F33 428i Convertible (N26) — not F36 despite the trailing "7".
 */
function resolveBmwFourSeriesBody(vin: string): PremiumEuropeanDecode | null {
  const wmi = vin.slice(0, 3);
  if (!wmi.startsWith("WBA") && !wmi.startsWith("5UX") && !wmi.startsWith("4US")) return null;

  const usSuffix = wmi.startsWith("WBA") ? "" : " (US)";

  // F30 sedans that share a 3V1… prefix (must beat the 3V → F33 rule below).
  if (vin.startsWith("WBA3V1") || vin.startsWith("5UX3V1")) {
    return {
      model: "3 Series",
      chassis: `F30 Sedan${usSuffix}`,
      displayModel: `3 Series (F30 Sedan${usSuffix})`,
    };
  }

  const type45 = vin.slice(3, 5);
  const year = bmwVinModelYear(vin);

  if (type45 === "3V" || type45 === "3T" || type45 === "3U") {
    const chassis = `F33 Convertible${usSuffix}`;
    return { model: "4 Series", chassis, displayModel: `4 Series (${chassis})` };
  }
  if (type45 === "3N" || type45 === "3R" || type45 === "3P" || type45 === "3S") {
    const chassis = `F32 Coupé${usSuffix}`;
    return { model: "4 Series", chassis, displayModel: `4 Series (${chassis})` };
  }

  // F36 Gran Coupé — ETK codes 4A–4F (4C overlaps G26 from ~2021).
  if (type45 === "4A") {
    const chassis = year != null && year >= 2021
      ? `G23 Convertible${usSuffix}`
      : `F36 Gran Coupé${usSuffix}`;
    return { model: "4 Series", chassis, displayModel: `4 Series (${chassis})` };
  }
  if (type45 === "4C") {
    const chassis = year != null && year >= 2021
      ? `G26 Gran Coupé${usSuffix}`
      : `F36 Gran Coupé${usSuffix}`;
    return { model: "4 Series", chassis, displayModel: `4 Series (${chassis})` };
  }
  if (type45 === "4B" || type45 === "4D" || type45 === "4E" || type45 === "4F") {
    const chassis = `F36 Gran Coupé${usSuffix}`;
    return { model: "4 Series", chassis, displayModel: `4 Series (${chassis})` };
  }

  return null;
}

// BMW: position 4 alone is NOT the series — 4 Series F32/F33/F36 use ETK type codes at 4–5.
const BMW_RULES = compilePrefixRules([
  { prefix: "WBA3V1", model: "3 Series", chassis: "F30 Sedan" },
  { prefix: "WBA3VG", model: "3 Series", chassis: "F31 Touring" },
  { prefix: "WBA3W", model: "3 Series", chassis: "G20/G21" },
  { prefix: "WBA3C", model: "3 Series", chassis: "E92 Coupé" },
  { prefix: "WBA3B", model: "3 Series", chassis: "E93 Convertible" },
  { prefix: "WBA3A", model: "3 Series", chassis: "E90/E91" },
  { prefix: "WBA4S", model: "4 Series", chassis: "G22 Coupé" },
  { prefix: "WBA4C", model: "4 Series", chassis: "G26 Gran Coupé" },
  { prefix: "WBA4A", model: "4 Series", chassis: "G23 Convertible" },
  { prefix: "WBA4W", model: "4 Series", chassis: "G22/G26" },
  { prefix: "WBA5E", model: "5 Series", chassis: "G30/G31" },
  { prefix: "WBA5J", model: "5 Series", chassis: "F10/F11" },
  { prefix: "WBA5U", model: "5 Series", chassis: "G60" },
  { prefix: "WBA7C", model: "7 Series", chassis: "G11/G12" },
  { prefix: "WBA7L", model: "7 Series", chassis: "G70" },
  { prefix: "WBA7G", model: "7 Series", chassis: "G11 LCI" },
  { prefix: "WBA7H", model: "7 Series", chassis: "G70" },
  { prefix: "WBA7U", model: "7 Series", chassis: "G12" },
  // X1/X2 — must beat WBA7* (WBA71 starts with WBA7)
  { prefix: "WBA71", model: "X1", chassis: "F48/U11" },
  { prefix: "WBA72", model: "X2", chassis: "F39" },
  { prefix: "5YM8", model: "X1", chassis: "F48 US" },
  { prefix: "5YM1", model: "X1" },
  { prefix: "WBA1C", model: "1 Series", chassis: "F20/F21" },
  { prefix: "WBA1H", model: "1 Series", chassis: "F40" },
  { prefix: "WBA2A", model: "2 Series", chassis: "Active Tourer (F45)" },
  { prefix: "WBA2T", model: "2 Series", chassis: "G42 Coupé" },
  { prefix: "WBA2X", model: "2 Series", chassis: "F44 Gran Coupé" },
  // 6 Series — F06/F12/F13 (US VDS and EU); missing rules caused blank model
  { prefix: "WBAJV6", model: "6 Series", chassis: "F12/F13 Convertible" },
  { prefix: "WBA6D", model: "6 Series", chassis: "F06 Gran Coupé" },
  { prefix: "WBA6C", model: "6 Series", chassis: "F12/F13" },
  { prefix: "WBA6F", model: "6 Series", chassis: "F12/F13" },
  { prefix: "WBA6", model: "6 Series" },
  { prefix: "WBA8C", model: "8 Series", chassis: "G14/G15/G16" },
  { prefix: "WBA8", model: "8 Series" },
  // Spartanburg / US G-generation SUVs — WBA21 is X7, NOT 2 Series
  { prefix: "WBA21E", model: "X7", chassis: "G07" },
  { prefix: "WBA21C", model: "X7", chassis: "G07" },
  { prefix: "WBA21B", model: "X7", chassis: "G07" },
  { prefix: "WBA21", model: "X7", chassis: "G07" },
  { prefix: "WBA53A", model: "X5", chassis: "G05" },
  { prefix: "WBA53B", model: "X5", chassis: "G05" },
  { prefix: "WBA53", model: "X5", chassis: "G05" },
  { prefix: "WBA31A", model: "X3", chassis: "G01" },
  { prefix: "WBA31B", model: "X3", chassis: "G01" },
  { prefix: "WBA31", model: "X3", chassis: "G01" },
  { prefix: "WBA13A", model: "X4", chassis: "G02" },
  { prefix: "WBA13", model: "X4", chassis: "G02" },
  { prefix: "WBA11A", model: "X6", chassis: "G06" },
  { prefix: "WBA11", model: "X6", chassis: "G06" },
  { prefix: "WBA8C", model: "8 Series", chassis: "G14/G15/G16" },
  { prefix: "WBAX3", model: "X3", chassis: "G01" },
  { prefix: "WBAX4", model: "X4", chassis: "G02" },
  { prefix: "WBAX5", model: "X5", chassis: "G05" },
  { prefix: "WBAX6", model: "X6", chassis: "G06" },
  { prefix: "WBAX7", model: "X7", chassis: "G07" },
  { prefix: "WBA3", model: "3 Series" },
  { prefix: "WBA4", model: "4 Series" },
  { prefix: "WBA5", model: "5 Series" },
  { prefix: "WBA7", model: "7 Series" },
  { prefix: "5UX3W", model: "3 Series", chassis: "G20 (US)" },
  { prefix: "5UX5J", model: "5 Series", chassis: "F10 (US)" },
  { prefix: "5UX5E", model: "5 Series", chassis: "G30 (US)" },
  { prefix: "5UXWX", model: "X3", chassis: "G01 (US)" },
  { prefix: "5UXKR", model: "X5", chassis: "G05 (US)" },
  { prefix: "5UXKS", model: "X5", chassis: "G05 (US)" },
  { prefix: "5UXCW", model: "X7", chassis: "G07 (US)" },
  { prefix: "5UXCR", model: "X7", chassis: "G07 (US)" },
  { prefix: "5UX53", model: "X7", chassis: "G07 (US)" },
  { prefix: "5UXXW", model: "X3", chassis: "G01 (US)" },
  { prefix: "5UX43", model: "X4", chassis: "G02 (US)" },
  { prefix: "WBS3", model: "M3" },
  { prefix: "WBS4", model: "M4" },
  { prefix: "WBS5", model: "M5" },
  { prefix: "WBY1", model: "i3" },
  { prefix: "WBY2", model: "i7" },
  { prefix: "WBY5", model: "i4", chassis: "G26" },
  { prefix: "WBY8", model: "i8" },
  { prefix: "WBY7", model: "iX" },
]);

const MERCEDES_RULES = compilePrefixRules([
  { prefix: "WDD177", model: "A-Class", chassis: "W177" },
  { prefix: "WDD118", model: "CLA", chassis: "C118" },
  { prefix: "WDD205", model: "C-Class", chassis: "W205" },
  { prefix: "WDD206", model: "C-Class", chassis: "W206" },
  { prefix: "WDD213", model: "E-Class", chassis: "W213" },
  { prefix: "WDD214", model: "E-Class", chassis: "W214" },
  { prefix: "WDD222", model: "S-Class", chassis: "W222" },
  { prefix: "WDD223", model: "S-Class", chassis: "W223" },
  { prefix: "WDD253", model: "GLC", chassis: "X253" },
  { prefix: "WDD254", model: "GLC", chassis: "X254" },
  { prefix: "WDD166", model: "GLE", chassis: "W166" },
  { prefix: "WDD167", model: "GLS", chassis: "X167" },
  { prefix: "WDD247", model: "GLA", chassis: "H247" },
  { prefix: "WDD246", model: "B-Class", chassis: "W246" },
  { prefix: "WDD164", model: "ML-Class", chassis: "W164" },
  { prefix: "WDD251", model: "GLK", chassis: "X204" },
  { prefix: "WDD463", model: "G-Class", chassis: "W463/W465" },
  { prefix: "WDD290", model: "EQS", chassis: "V297" },
  { prefix: "WDD294", model: "EQE", chassis: "V294" },
  { prefix: "WDD296", model: "EQE SUV", chassis: "X294" },
  { prefix: "WDD243", model: "B-Class", chassis: "W246" },
  { prefix: "WDD245", model: "B-Class", chassis: "W247" },
  { prefix: "WDD238", model: "E-Class Coupé/Cabrio", chassis: "C238" },
  { prefix: "WDD192", model: "AMG GT", chassis: "C192" },
  { prefix: "WDD197", model: "SL", chassis: "R232" },
  { prefix: "WDDLJ", model: "CLS", chassis: "C257" },
  { prefix: "WDDG", model: "G-Class" },
  { prefix: "WDC0", model: "GLC" },
]);

const AUDI_US_RULES = compilePrefixRules([
  { prefix: "WA1L", model: "Q5" },
  { prefix: "WA1C", model: "Q5" },
  { prefix: "WA1F", model: "Q5 Sportback" },
  { prefix: "WA1A", model: "Q3" },
  { prefix: "WA1B", model: "Q7" },
  { prefix: "WA1M", model: "Q8" },
]);

const AUDI_RULES = compilePrefixRules([
  { prefix: "WAUZZZ8V", model: "A3" },
  { prefix: "WAUZZZ8X", model: "A3 Sportback" },
  { prefix: "WAUZZZ8K", model: "A4" },
  { prefix: "WAUZZZ8H", model: "A4 / A5" },
  // C7 (Typ 4G) — positions 7–9 are EU type-approval; A6 and A7 share the 4G platform.
  { prefix: "WAUZZZ4G8", model: "A7 Sportback", chassis: "C7" },
  { prefix: "WAUZZZ4GA", model: "A7 Sportback", chassis: "C7" },
  { prefix: "WAUZZZ4GF", model: "A7 Sportback", chassis: "C7" },
  { prefix: "WAUZZZ4G5", model: "A7 Sportback", chassis: "C7" },
  { prefix: "WAUZZZ4GD", model: "A6 Avant", chassis: "C7" },
  { prefix: "WAUZZZ4G2", model: "A6", chassis: "C7" },
  { prefix: "WAUZZZ4GC", model: "A6", chassis: "C7" },
  { prefix: "WAUZZZ4G6", model: "A6 / A7", chassis: "C7" },
  { prefix: "WAUZZZ4G", model: "A6 / A7", chassis: "C7" },
  { prefix: "WAUZZZ4F", model: "A6 Avant" },
  { prefix: "WAUZZZ4H", model: "A7 Sportback" },
  { prefix: "WAUZZZ4A", model: "A8" },
  { prefix: "WAUZZZGY", model: "Q7" },
  { prefix: "WAUZZZGA", model: "Q5" },
  { prefix: "WAUZZZGE", model: "Q8 / e-tron" },
  { prefix: "WAUZZZGS", model: "Q3" },
  { prefix: "WAUZZZGU", model: "e-tron GT" },
  { prefix: "WAUZZZGB", model: "Q4 e-tron" },
  { prefix: "WAUZZZFR", model: "R8" },
  { prefix: "WAUZZZTR", model: "TT" },
]);

const PORSCHE_RULES = compilePrefixRules([
  { prefix: "WP0ZZZ99", model: "911", chassis: "992" },
  { prefix: "WP0ZZZ97", model: "911", chassis: "991" },
  { prefix: "WP0ZZZ98", model: "Boxster/Cayman", chassis: "981/718" },
  { prefix: "WP0ZZZ92", model: "Cayenne", chassis: "9YA" },
  { prefix: "WP0ZZZ95", model: "Panamera", chassis: "971" },
  { prefix: "WP0ZZZ9Y", model: "Taycan", chassis: "J1" },
  { prefix: "WP1ZZZ9Z", model: "Macan", chassis: "95B" },
  { prefix: "WP1ZZZ92", model: "Cayenne", chassis: "E3" },
  { prefix: "WP0AA", model: "911" },
  { prefix: "WP0AB", model: "Boxster/Cayman" },
  { prefix: "WP0AC", model: "Cayenne" },
  { prefix: "WP0AZ", model: "Panamera" },
  { prefix: "WP0AG", model: "Taycan" },
  { prefix: "WP1AA", model: "Cayenne" },
  { prefix: "WP1AZ", model: "Macan" },
]);

const VW_RULES = compilePrefixRules([
  { prefix: "WVWZZZ1K", model: "Golf", chassis: "Mk7/Mk8" },
  { prefix: "WVWZZZ1Z", model: "Golf", chassis: "Mk7" },
  { prefix: "WVWZZZ3C", model: "Passat", chassis: "B8" },
  { prefix: "WVWZZZ3D", model: "Arteon", chassis: "3H" },
  { prefix: "WVWZZZ5N", model: "Tiguan", chassis: "AD1/AD2" },
  { prefix: "WVWZZZ5M", model: "T-Roc" },
  { prefix: "WVWZZZ7P", model: "Touareg", chassis: "CR" },
  { prefix: "WVWZZZAW", model: "Polo", chassis: "6R/AW" },
  { prefix: "WVWZZZCJ", model: "ID.3" },
  { prefix: "WVWZZZE1", model: "ID.4" },
  { prefix: "WVWZZZE2", model: "ID.5" },
  { prefix: "WVWZZZSY", model: "T-Roc" },
  { prefix: "WVWZZZAU", model: "Golf", chassis: "Mk6" },
  { prefix: "WVWZZZ1J", model: "Jetta", chassis: "Mk6/Mk7" },
  { prefix: "WVWZZZAA", model: "Up!" },
  { prefix: "WVWZZZ2K", model: "Golf", chassis: "Mk7" },
  { prefix: "WVWZZZ1T", model: "Touran", chassis: "1T" },
  { prefix: "WVWZZZ9N", model: "Touran", chassis: "5T" },
  { prefix: "WVWZZZ9Z", model: "Touran", chassis: "5T" },
  { prefix: "WVWZZZAZ", model: "Touran", chassis: "5T" },
  { prefix: "WVGZZZ9N", model: "Touran", chassis: "5T" },
  { prefix: "WVGZZZ1T", model: "Touran", chassis: "1T" },
  { prefix: "WVWZZZSH", model: "T-Roc" },
  { prefix: "WVWZZZCD", model: "Golf Variant", chassis: "Mk8" },
  { prefix: "WVWZZZBP", model: "Arteon Shooting Brake" },
  { prefix: "WVWZZZ2H", model: "Amarok" },
  { prefix: "WVWZZZ7H", model: "Tiguan", chassis: "AD1" },
  { prefix: "WVWZZZ7L", model: "Tiguan Allspace" },
  { prefix: "WVWZZZ6R", model: "T-Cross" },
  { prefix: "WVWZZZ6J", model: "Taigo" },
  { prefix: "WVWZZZDF", model: "Sharan" },
  { prefix: "WVWZZZ7N", model: "Sharan" },
  { prefix: "WVWZZZ2D", model: "Caddy", chassis: "C5" },
  { prefix: "WVWZZZ2E", model: "Caddy", chassis: "C5" },
  { prefix: "WVWZZZ7E", model: "Caddy", chassis: "C4" },
  { prefix: "WVWZZZ2F", model: "Caddy Maxi" },
  { prefix: "WVWZZZSK", model: "ID. Buzz" },
  { prefix: "WVWZZZST", model: "ID. Buzz Cargo" },
  { prefix: "WVWZZZ6C", model: "Passat", chassis: "B9" },
  { prefix: "3VWZZZ", model: "Volkswagen", chassis: "US market" },
]);

const MINI_RULES = compilePrefixRules([
  { prefix: "WMWXP7", model: "MINI Cooper", chassis: "F56" },
  { prefix: "WMWXP9", model: "MINI Cooper", chassis: "F55" },
  { prefix: "WMWXS7", model: "MINI Clubman", chassis: "F54" },
  { prefix: "WMWXS1", model: "MINI Countryman", chassis: "F60" },
  { prefix: "WMWZP7", model: "MINI Cooper SE", chassis: "Electric" },
]);

export type PremiumEuropeanDecode = {
  model: string;
  chassis: string | null;
  displayModel: string;
};

function formatDisplay(model: string, chassis: string | null): string {
  if (!chassis) return model;
  if (chassis.startsWith(model)) return chassis;
  return `${model} (${chassis})`;
}

/** W1K uses the same VDS chassis codes as WDD — alias for rule matching only. */
function mercedesRuleVin(vin: string): string {
  return vin.startsWith("W1K") ? `WDD${vin.slice(3)}` : vin;
}

function decodeFromRules(vin: string, rules: readonly PremiumPrefixRule[]): PremiumEuropeanDecode | null {
  const hit = matchLongestPrefix(vin, rules) as PremiumPrefixRule | null;
  if (!hit) return null;
  return {
    model: hit.model,
    chassis: hit.chassis ?? null,
    displayModel: formatDisplay(hit.model, hit.chassis ?? null),
  };
}

function fromHomologation(hit: ReturnType<typeof decodeAudiEuHomologation>): PremiumEuropeanDecode | null {
  if (!hit) return null;
  return {
    model: hit.model,
    chassis: hit.chassis,
    displayModel: homologationToDisplay(hit),
  };
}

export function decodePremiumEuropean(vin: string): PremiumEuropeanDecode | null {
  const raw = vin.trim().toUpperCase();
  if (raw.length !== 17) return null;

  // Bratislava (WVG): Audi SUVs share plant WMI with VW — homologation decides brand/model.
  if (raw.startsWith("WVG") && raw.slice(3, 6) === "ZZZ") {
    const audiHit = fromHomologation(decodeAudiEuHomologation(raw));
    if (audiHit) return audiHit;
  }

  const upper = normalizeVagVinForPremium(raw);
  const wmi = upper.slice(0, 3);

  if (wmi.startsWith("WBA") || wmi.startsWith("WBS") || wmi.startsWith("WBY") || wmi.startsWith("5UX") || wmi.startsWith("4US") || wmi.startsWith("5YM")) {
    if (raw.slice(3, 6) === "ZZZ") {
      const euHit = fromHomologation(decodeBmwEuHomologation(raw));
      if (euHit) return euHit;
    }
    const f4Body = resolveBmwFourSeriesBody(upper);
    if (f4Body) return f4Body;
    return decodeFromRules(upper, BMW_RULES);
  }
  if (wmi.startsWith("WDD") || wmi.startsWith("WDB") || wmi.startsWith("WDC") || wmi.startsWith("WDF") || wmi.startsWith("W1K")) {
    if (raw.slice(3, 6) === "ZZZ") {
      const euHit = fromHomologation(decodeMercedesEuHomologation(raw));
      if (euHit) return euHit;
    }
    return decodeFromRules(mercedesRuleVin(upper), MERCEDES_RULES);
  }
  if (wmi.startsWith("WA1")) {
    return decodeFromRules(upper, AUDI_US_RULES);
  }
  if (wmi.startsWith("WAU") || wmi.startsWith("TRU")) {
    if (raw.slice(3, 6) === "ZZZ") {
      const euHit = fromHomologation(decodeAudiEuHomologation(raw));
      if (euHit) return euHit;
    }
    return decodeFromRules(upper, AUDI_RULES);
  }
  if (wmi.startsWith("WP0") || wmi.startsWith("WP1")) {
    return decodeFromRules(upper, PORSCHE_RULES);
  }
  if (isVagWmi(wmi) || upper.startsWith("3VW")) {
    return decodeFromRules(upper, VW_RULES);
  }
  if (wmi.startsWith("WMW")) {
    return decodeFromRules(upper, MINI_RULES);
  }
  if (wmi.startsWith("SAL") || wmi.startsWith("SAJ")) {
    if (raw.slice(3, 6) === "ZZZ") {
      const jlr = decodeJlrEu(raw);
      if (jlr) {
        return {
          model: jlr.model,
          chassis: jlr.chassis,
          displayModel: jlr.displayModel,
        };
      }
    }
  }
  return null;
}

export function decodePremiumEuropeanModel(vin: string): string | null {
  return decodePremiumEuropean(vin)?.displayModel ?? null;
}

export function decodePremiumEuropeanTrim(vin: string): string | null {
  const hit = decodePremiumEuropean(vin);
  if (!hit?.chassis) return null;
  return hit.chassis;
}

export function isPremiumEuropeanVin(vin: string): boolean {
  return decodePremiumEuropean(vin) != null;
}
