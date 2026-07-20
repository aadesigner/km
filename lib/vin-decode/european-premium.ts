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
} from "./eu-zzz-homologation";
import { decodeJlrEu } from "./jlr-eu";
import { isMercedesEuroBaumusterVin } from "./mercedes-baumuster";
import { isVagWmi, normalizeVagVinForPremium } from "./vag-wmi";
import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";
import {
  decodeAudiModern,
  decodePorscheModern,
  decodeVolkswagenModern,
  isAudiVin,
  isPorscheVin,
  isVolkswagenVin,
} from "./vag-modern";

export { isMercedesEuroBaumusterVin } from "./mercedes-baumuster";

type PremiumPrefixRule = PrefixRule & { chassis?: string };

/**
 * Model-year from VIN position 10 (ISO 3779 cycle heuristic).
 * Shared by premium decoders so chassis annotations can be year-gated.
 *
 * Classic European Mercedes Baumuster FINs do not encode year at pos.10
 * (that digit is LHD/RHD) — returns null for those VINs.
 */
export function premiumVinModelYear(vin: string): number | null {
  if (isMercedesEuroBaumusterVin(vin)) return null;
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

/** @deprecated Use premiumVinModelYear */
function bmwVinModelYear(vin: string): number | null {
  return premiumVinModelYear(vin);
}

/**
 * Generation chassis → valid model-year window.
 * If year is outside the window (or year unknown), chassis is stripped — model stays.
 * Platform tokens that are literal in the VIN (e.g. Touareg 7P) are intentionally omitted.
 */
const CHASSIS_YEAR: Record<string, { from: number; to: number }> = {
  // BMW
  "E90/E91": { from: 2005, to: 2012 },
  "E92 Coupé": { from: 2006, to: 2013 },
  "E93 Convertible": { from: 2007, to: 2013 },
  "F30 Sedan": { from: 2012, to: 2019 },
  "F31 Touring": { from: 2012, to: 2019 },
  "F30/F31": { from: 2012, to: 2019 },
  "G20/G21": { from: 2019, to: 2099 },
  "G20 (US)": { from: 2019, to: 2099 },
  "F10/F11": { from: 2010, to: 2017 },
  "F10 (US)": { from: 2010, to: 2017 },
  "G30/G31": { from: 2017, to: 2023 },
  "G30 (US)": { from: 2017, to: 2023 },
  "G60": { from: 2024, to: 2099 },
  "G11/G12": { from: 2015, to: 2022 },
  "G11 LCI": { from: 2019, to: 2022 },
  "G12": { from: 2015, to: 2022 },
  "G70": { from: 2022, to: 2099 },
  "F48/U11": { from: 2015, to: 2099 },
  "F48 US": { from: 2015, to: 2022 },
  "F48": { from: 2015, to: 2022 },
  "U11": { from: 2022, to: 2099 },
  "F39": { from: 2018, to: 2023 },
  "F20/F21": { from: 2011, to: 2019 },
  "F40": { from: 2019, to: 2099 },
  "Active Tourer (F45)": { from: 2014, to: 2021 },
  "G42 Coupé": { from: 2021, to: 2099 },
  "F44 Gran Coupé": { from: 2020, to: 2099 },
  "F06 Gran Coupé": { from: 2012, to: 2019 },
  "F12/F13": { from: 2011, to: 2018 },
  "F12/F13 Convertible": { from: 2011, to: 2018 },
  "G14/G15/G16": { from: 2018, to: 2099 },
  "G22 Coupé": { from: 2020, to: 2099 },
  "G23 Convertible": { from: 2020, to: 2099 },
  "G26 Gran Coupé": { from: 2021, to: 2099 },
  "G22/G26": { from: 2020, to: 2099 },
  "F32 Coupé": { from: 2013, to: 2020 },
  "F33 Convertible": { from: 2014, to: 2020 },
  "F36 Gran Coupé": { from: 2014, to: 2020 },
  "G01": { from: 2017, to: 2099 },
  "G01 (US)": { from: 2017, to: 2099 },
  "G02": { from: 2018, to: 2099 },
  "G02 (US)": { from: 2018, to: 2099 },
  "G05": { from: 2018, to: 2099 },
  "G05 (US)": { from: 2018, to: 2099 },
  "G06": { from: 2019, to: 2099 },
  "G07": { from: 2018, to: 2099 },
  "G07 (US)": { from: 2018, to: 2099 },
  // Mercedes
  "W177": { from: 2018, to: 2099 },
  "C118": { from: 2019, to: 2099 },
  "W205": { from: 2014, to: 2021 },
  "W206": { from: 2021, to: 2099 },
  "W204": { from: 2007, to: 2014 },
  "W203": { from: 2000, to: 2007 },
  "W202": { from: 1993, to: 2000 },
  "W213": { from: 2016, to: 2023 },
  "W214": { from: 2023, to: 2099 },
  "W222": { from: 2013, to: 2020 },
  "W223": { from: 2020, to: 2099 },
  "X253": { from: 2015, to: 2022 },
  "C253": { from: 2016, to: 2023 },
  "X254": { from: 2022, to: 2099 },
  "C254": { from: 2023, to: 2099 },
  "W163": { from: 1997, to: 2005 },
  "W166": { from: 2011, to: 2019 },
  "X166": { from: 2006, to: 2019 },
  "C292": { from: 2015, to: 2019 },
  "W167": { from: 2019, to: 2099 },
  "X167": { from: 2019, to: 2099 },
  "W167/X167": { from: 2019, to: 2099 },
  "X156": { from: 2014, to: 2020 },
  "H247": { from: 2020, to: 2099 },
  "H247/X247": { from: 2019, to: 2099 },
  "X247": { from: 2019, to: 2099 },
  "W246": { from: 2011, to: 2019 },
  "W245": { from: 2005, to: 2011 },
  "W247": { from: 2019, to: 2099 },
  "W251": { from: 2005, to: 2013 },
  "W164": { from: 2005, to: 2011 },
  "X164": { from: 2006, to: 2012 },
  "X204": { from: 2008, to: 2015 },
  "W463/W465": { from: 1990, to: 2099 },
  "W463": { from: 1990, to: 2099 },
  "W465": { from: 2024, to: 2099 },
  "V297": { from: 2021, to: 2099 },
  "V294": { from: 2022, to: 2099 },
  "X294": { from: 2022, to: 2099 },
  "X296": { from: 2022, to: 2099 },
  "X243": { from: 2021, to: 2099 },
  "H243/X243": { from: 2021, to: 2099 },
  "C236": { from: 2023, to: 2099 },
  "N293": { from: 2019, to: 2023 },
  "C238": { from: 2017, to: 2023 },
  "C192": { from: 2023, to: 2099 },
  "R232": { from: 2022, to: 2099 },
  "C257": { from: 2018, to: 2099 },
  // Porsche (generation codes that are NOT unique in VIN alone)
  "992": { from: 2019, to: 2099 },
  "991": { from: 2012, to: 2019 },
  "981/718": { from: 2012, to: 2099 },
  "9YA": { from: 2017, to: 2099 },
  "971": { from: 2016, to: 2099 },
  "J1": { from: 2019, to: 2099 },
  "95B": { from: 2014, to: 2099 },
  "E3": { from: 2017, to: 2099 },
  // VW generation labels (when not literal Typ in VIN)
  "Mk5": { from: 2003, to: 2009 },
  "Mk6": { from: 2008, to: 2013 },
  "Mk7": { from: 2012, to: 2020 },
  "Mk7/Mk8": { from: 2012, to: 2099 },
  "Mk8": { from: 2019, to: 2099 },
  "B6/B7": { from: 2005, to: 2014 },
  "B8": { from: 2014, to: 2023 },
  "B9": { from: 2023, to: 2099 },
  // Audi generation labels
  "C7": { from: 2011, to: 2018 },
  "C8": { from: 2018, to: 2099 },
  "C9": { from: 2025, to: 2099 },
  "B9 8W": { from: 2015, to: 2099 },
  "B8 8K": { from: 2008, to: 2016 },
  "C7 4G": { from: 2011, to: 2018 },
  "C8 4K": { from: 2018, to: 2099 },
  "C6 4F": { from: 2004, to: 2011 },
  // MINI
  "F56": { from: 2014, to: 2099 },
  "F55": { from: 2014, to: 2099 },
  "F54": { from: 2015, to: 2099 },
  "F60": { from: 2016, to: 2099 },
};

/** Chassis codes uniquely encoded as digits in the VIN (Mercedes Baumuster / series). */
function isLiteralMercedesChassis(key: string): boolean {
  return /^[WCXARNVH]\d{3}\b/.test(key);
}

function applyChassisYearGate(chassis: string | null, year: number | null): string | null {
  if (!chassis) return null;
  const key = chassis.replace(/\s*\(US\)\s*$/i, "").trim();
  const bounds = CHASSIS_YEAR[key]
    ?? CHASSIS_YEAR[key.split("/")[0]!]
    ?? (key.includes(" ") ? CHASSIS_YEAR[key.split(" ")[0]!] : undefined);
  if (!bounds) return chassis; // literal VIN platform token (7P, CR, NX, …)
  // Year unknown: keep chassis only when it is uniquely encoded in the VIN
  // (e.g. Mercedes W203). Strip ambiguous year-gated platforms (BMW letter reuse).
  if (year == null) return isLiteralMercedesChassis(key) ? chassis : null;
  if (year < bounds.from || year > bounds.to) return null;
  return chassis;
}

function finalizePremium(
  model: string,
  chassis: string | null,
  year: number | null,
): PremiumEuropeanDecode {
  const gated = applyChassisYearGate(chassis, year);
  return { model, chassis: gated, displayModel: formatDisplay(model, gated) };
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
    const year = bmwVinModelYear(vin);
    return finalizePremium("3 Series", `F30 Sedan${usSuffix}`, year);
  }

  const type45 = vin.slice(3, 5);
  const year = bmwVinModelYear(vin);

  if (type45 === "3V" || type45 === "3T" || type45 === "3U") {
    return finalizePremium("4 Series", `F33 Convertible${usSuffix}`, year);
  }
  if (type45 === "3N" || type45 === "3R" || type45 === "3P" || type45 === "3S") {
    return finalizePremium("4 Series", `F32 Coupé${usSuffix}`, year);
  }

  // F36 Gran Coupé — ETK codes 4A–4F (4C overlaps G26 from ~2021).
  if (type45 === "4A") {
    const chassis = year != null && year >= 2021
      ? `G23 Convertible${usSuffix}`
      : `F36 Gran Coupé${usSuffix}`;
    return finalizePremium("4 Series", chassis, year);
  }
  if (type45 === "4C") {
    const chassis = year != null && year >= 2021
      ? `G26 Gran Coupé${usSuffix}`
      : `F36 Gran Coupé${usSuffix}`;
    return finalizePremium("4 Series", chassis, year);
  }
  if (type45 === "4B" || type45 === "4D" || type45 === "4E" || type45 === "4F") {
    return finalizePremium("4 Series", `F36 Gran Coupé${usSuffix}`, year);
  }

  return null;
}

// BMW: position 4 alone is NOT the series — 4 Series F32/F33/F36 use ETK type codes at 4–5.
// Ambiguous short prefixes (WBA3A/B/C) → model only; E90 reused on F30 VINs without year gate was a real bug.
const BMW_RULES = compilePrefixRules([
  { prefix: "WBA3V1", model: "3 Series", chassis: "F30 Sedan" },
  { prefix: "WBA3VG", model: "3 Series", chassis: "F31 Touring" },
  { prefix: "WBA3W", model: "3 Series", chassis: "G20/G21" },
  // Do NOT attach E90/E92/E93 — those prefixes were reused on later gens.
  { prefix: "WBA3C", model: "3 Series" },
  { prefix: "WBA3B", model: "3 Series" },
  { prefix: "WBA3A", model: "3 Series" },
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
  // X1 — F48 vs U11 share WBA71; leave chassis null (year-ambiguous).
  { prefix: "WBA71", model: "X1" },
  { prefix: "WBA72", model: "X2", chassis: "F39" },
  { prefix: "5YM8", model: "X1", chassis: "F48 US" },
  { prefix: "5YM1", model: "X1" },
  { prefix: "WBA1C", model: "1 Series", chassis: "F20/F21" },
  { prefix: "WBA1H", model: "1 Series", chassis: "F40" },
  { prefix: "WBA2A", model: "2 Series", chassis: "Active Tourer (F45)" },
  { prefix: "WBA2T", model: "2 Series", chassis: "G42 Coupé" },
  { prefix: "WBA2X", model: "2 Series", chassis: "F44 Gran Coupé" },
  { prefix: "WBAJV6", model: "6 Series", chassis: "F12/F13 Convertible" },
  { prefix: "WBA6D", model: "6 Series", chassis: "F06 Gran Coupé" },
  { prefix: "WBA6C", model: "6 Series", chassis: "F12/F13" },
  { prefix: "WBA6F", model: "6 Series", chassis: "F12/F13" },
  { prefix: "WBA6", model: "6 Series" },
  // EU letter type codes (ETK model nos at pos.4–7) — not WBA8* numeric series.
  // XA71/XA72 = 535d F10 N57Z; XA5* = F10 530d/535d family (must beat WBAX3… SUV rules).
  { prefix: "WBAXA71", model: "5 Series", chassis: "F10/F11" },
  { prefix: "WBAXA72", model: "5 Series", chassis: "F10/F11" },
  { prefix: "WBAXA5", model: "5 Series", chassis: "F10/F11" },
  { prefix: "WBAXA", model: "5 Series", chassis: "F10/F11" },
  // DZ21/DZ2C = 840i Convertible G14; GV81 = M850i Gran Coupé G16; GW41 = 840d Gran Coupé G16.
  { prefix: "WBADZ", model: "8 Series", chassis: "G14 Convertible" },
  { prefix: "WBAGV", model: "8 Series", chassis: "G16 Gran Coupé" },
  { prefix: "WBAGW", model: "8 Series", chassis: "G16 Gran Coupé" },
  { prefix: "WBAFY", model: "8 Series", chassis: "G14 Convertible" },
  { prefix: "WBAAE", model: "8 Series", chassis: "G15 Coupé" },
  { prefix: "WBABC", model: "8 Series", chassis: "G15 Coupé" },
  { prefix: "WBA8C", model: "8 Series", chassis: "G14/G15/G16" },
  { prefix: "WBA8", model: "8 Series" },
  // JC31 = 520d G30 (ETK); keep prefix at JC so JC3x/JC5x stay 5 Series.
  { prefix: "WBAJC", model: "5 Series", chassis: "G30/G31" },
  { prefix: "WBAJE", model: "5 Series", chassis: "G30/G31" },
  { prefix: "WBAJS", model: "5 Series", chassis: "G30/G31" },
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
  { prefix: "WBY5", model: "i4", chassis: "G26 Gran Coupé" },
  { prefix: "WBY8", model: "i8" },
  { prefix: "WBY7", model: "iX" },
]);

const MERCEDES_RULES = compilePrefixRules([
  { prefix: "WDD177", model: "A-Class", chassis: "W177" },
  { prefix: "WDD118", model: "CLA", chassis: "C118" },
  { prefix: "WDD205", model: "C-Class", chassis: "W205" },
  { prefix: "WDD206", model: "C-Class", chassis: "W206" },
  { prefix: "WDD204", model: "C-Class", chassis: "W204" },
  { prefix: "WDD203", model: "C-Class", chassis: "W203" },
  { prefix: "WDD202", model: "C-Class", chassis: "W202" },
  { prefix: "WDD213", model: "E-Class", chassis: "W213" },
  { prefix: "WDD214", model: "E-Class", chassis: "W214" },
  { prefix: "WDD222", model: "S-Class", chassis: "W222" },
  { prefix: "WDD223", model: "S-Class", chassis: "W223" },
  { prefix: "WDD253", model: "GLC", chassis: "X253" },
  { prefix: "WDD254", model: "GLC", chassis: "X254" },
  // W166: sold as ML through MY2015, renamed GLE from MY2016 (refined by year below).
  { prefix: "WDD166", model: "GLE", chassis: "W166" },
  // 167 = GLE (W167) and GLS (X167) — do not pick one from chassis digits alone.
  { prefix: "WDD167", model: "GLE / GLS", chassis: "W167/X167" },
  // 247 = GLA (H247) and GLB (X247) — do not pick one from chassis digits alone.
  { prefix: "WDD247", model: "GLA / GLB", chassis: "H247/X247" },
  { prefix: "WDD246", model: "B-Class", chassis: "W246" },
  { prefix: "WDD163", model: "ML-Class", chassis: "W163" },
  { prefix: "WDD164", model: "ML-Class", chassis: "W164" },
  { prefix: "WDD251", model: "GLK", chassis: "X204" },
  { prefix: "WDD463", model: "G-Class", chassis: "W463/W465" },
  { prefix: "WDD290", model: "EQS", chassis: "V297" },
  { prefix: "WDD294", model: "EQE", chassis: "V294" },
  { prefix: "WDD296", model: "EQS SUV", chassis: "X296" },
  // 243 = EQA (H243) and EQB (X243) — do not pick one.
  { prefix: "WDD243", model: "EQA / EQB", chassis: "H243/X243" },
  { prefix: "WDD293", model: "EQC", chassis: "N293" },
  { prefix: "WDD236", model: "CLE", chassis: "C236" },
  { prefix: "WDD245", model: "B-Class", chassis: "W245" },
  { prefix: "WDD238", model: "E-Class Coupé/Cabrio", chassis: "C238" },
  { prefix: "WDD192", model: "AMG GT", chassis: "C192" },
  { prefix: "WDD197", model: "SL", chassis: "R232" },
  { prefix: "WDDLJ", model: "CLS", chassis: "C257" },
]);

/**
 * Mercedes passenger cars — position 4 series letter (North American / letter VDS).
 * Letters were reused across generations (Wikibooks Mercedes VIN Codes); year-band the class.
 * Chassis omitted here — letter alone is not a unique generation.
 */
function mercedesPassengerSeriesAt4(
  letter: string,
  year: number | null,
): { model: string } | null {
  switch (letter) {
    case "H":
      // ≤2000: W202 C-Class; ≥2009: W212 E-Class. Never map modern H → C-Class.
      return year != null && year <= 2000 ? { model: "C-Class" } : { model: "E-Class" };
    case "Z":
      // W213/S213/X213 E-Class
      return { model: "E-Class" };
    case "1":
      // C238/A238 E-Class coupe/cabriolet
      return { model: "E-Class Coupé/Cabrio" };
    case "K":
      // C207/A207 E-Class coupe/cabriolet (~2009–2017)
      if (year == null || (year >= 2009 && year <= 2017)) return { model: "E-Class Coupé/Cabrio" };
      return null;
    case "L":
      // ≥2023: W214 E-Class; ~2011–2020: C218 CLS
      if (year != null && year >= 2023) return { model: "E-Class" };
      if (year != null && year >= 2011 && year <= 2020) return { model: "CLS" };
      return null;
    case "G":
      // ≤2006: W140 S-Class; ~2007+: W204 C-Class
      return year != null && year <= 2006 ? { model: "S-Class" } : { model: "C-Class" };
    case "W":
      // Pre-W205 letter W was R171 SLK; from ~2014: W205 C-Class
      if (year != null && year < 2014) return { model: "SLK/SLC" };
      return { model: "C-Class" };
    case "A":
      // ≥2021: W206 C-Class (earlier eras reused A for unrelated lines)
      if (year == null || year >= 2021) return { model: "C-Class" };
      return null;
    case "R":
      // ≤2007: W203 C-Class; later reused for SLS / AMG GT — do not force C-Class
      if (year != null && year <= 2007) return { model: "C-Class" };
      return null;
    case "U":
      // ≤2009: W211 E-Class; ≥2013: W222 S-Class
      if (year != null && year <= 2009) return { model: "E-Class" };
      if (year != null && year >= 2013 && year <= 2020) return { model: "S-Class" };
      return null;
    case "J":
      // ≤2003: W210 E-Class; ≥2012: R231 SL
      if (year != null && year <= 2003) return { model: "E-Class" };
      if (year != null && year >= 2012) return { model: "SL-Class" };
      return null;
    case "M":
      // ≥2023: C236/A236 CLE; earlier reused for B-Class (Canada)
      if (year != null && year >= 2023) return { model: "CLE" };
      return null;
    case "E":
      // ≥2022: V295 EQE; earlier reused for CL
      if (year != null && year >= 2022) return { model: "EQE" };
      return null;
    case "C":
      // ≥2021: V297 EQS
      if (year != null && year >= 2021) return { model: "EQS" };
      return null;
    default:
      return null;
  }
}

/**
 * Mercedes SUVs (WDC / W1N / 4JG) — North American letter VDS.
 * Position 4 = series/platform; position 5 = body style (disambiguates GLE vs GLS, GLA vs GLB, etc.).
 * Source: Wikibooks Mercedes-Benz VIN Codes (SUV series + body tables).
 */
function mercedesSuvFromLetterVds(
  series: string,
  body: string,
  year: number | null,
): { model: string; chassis?: string } | null {
  switch (series) {
    case "A":
      return { model: "ML-Class", chassis: "W163" };
    case "B":
      // B+F ≈ X164 GL; otherwise W164 M-Class
      if (body === "F") return { model: "GL-Class", chassis: "X164" };
      return { model: "ML-Class", chassis: "W164" };
    case "C":
      // Series C = R-Class (W251). G-Class uses Y/W (and older body R/C).
      if (body === "C" || body === "R" || body === "H") {
        return { model: "G-Class", chassis: year != null && year >= 2024 ? "W465" : "W463" };
      }
      return { model: "R-Class", chassis: "W251" };
    case "D":
      // D+M (2022+) = EQS SUV; D+F = X166 GL/GLS; D+D/E = GLE Coupe; D+A = W166 ML/GLE
      if (body === "M" && (year == null || year >= 2022)) {
        return { model: "EQS SUV", chassis: "X296" };
      }
      if (body === "F") {
        if (year != null && year >= 2017) return { model: "GLS", chassis: "X166" };
        return { model: "GL-Class", chassis: "X166" };
      }
      if (body === "D" || body === "E") return { model: "GLE Coupe", chassis: "C292" };
      if (year != null && year < 2016) return { model: "ML-Class", chassis: "W166" };
      return { model: "GLE", chassis: "W166" };
    case "E":
      return { model: "GLE Coupe", chassis: "C292" };
    case "F":
      // F+F = X167 GLS; F+B/A = W167/C167 GLE
      if (body === "F") return { model: "GLS", chassis: "X167" };
      if (body === "B" || body === "A") return { model: "GLE", chassis: "W167" };
      return { model: "GLE / GLS", chassis: "W167/X167" };
    case "G":
      // Series G = GLK (X204) or EQE SUV (X294). Mid years are ambiguous.
      if (year != null && year >= 2022) return { model: "EQE SUV", chassis: "X294" };
      if (year != null && year <= 2015) return { model: "GLK", chassis: "X204" };
      if (year == null) return { model: "GLK / EQE SUV" };
      return null;
    case "0":
      if (body === "J") return { model: "GLC Coupe", chassis: "C253" };
      return { model: "GLC", chassis: "X253" };
    case "K":
      if (body === "J") return { model: "GLC Coupe", chassis: "C254" };
      return { model: "GLC", chassis: "X254" };
    case "J":
      // Letter J as series ≈ GLC Coupe (C253); also covered via 0+J / K+J.
      return { model: "GLC Coupe", chassis: year != null && year >= 2023 ? "C254" : "C253" };
    case "T":
      return { model: "GLA", chassis: "X156" };
    case "Y":
      return { model: "G-Class", chassis: "W463" };
    case "W":
      return { model: "G-Class", chassis: "W465" };
    case "R":
      return { model: "G-Class", chassis: "W463" };
    case "4":
      // 4+M = GLB; 4+N/G = GLA (H247)
      if (body === "M") return { model: "GLB", chassis: "X247" };
      if (body === "N" || body === "G") return { model: "GLA", chassis: "H247" };
      return { model: "GLA / GLB", chassis: "H247/X247" };
    case "9":
      return { model: "EQB", chassis: "X243" };
    case "N":
      // Body N is GLA (H247); rare as series — treat as GLA when present on SUV WMI.
      return { model: "GLA", chassis: "H247" };
    default:
      return null;
  }
}

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
  { prefix: "WAUZZZ8X", model: "A1" },
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
  { prefix: "WAUZZZGU", model: "Q5 / SQ5", chassis: "GU" },
  { prefix: "WAUZZZGH", model: "A6 e-tron / S6 e-tron", chassis: "PPE" },
  { prefix: "WAUZZZGF", model: "Q6 e-tron / SQ6 e-tron", chassis: "PPE" },
  { prefix: "WAUZZZFW", model: "e-tron GT", chassis: "J1" },
  { prefix: "WAUZZZGB", model: "Q4 e-tron" },
  { prefix: "WAUZZZFG", model: "R8", chassis: "42" },
  { prefix: "WAUZZZFX", model: "R8", chassis: "4S" },
  { prefix: "WAUZZZTR", model: "TT" },
]);

const PORSCHE_RULES = compilePrefixRules([
  // "99" is the long-running 911 family code — do NOT hardcode 992.
  { prefix: "WP0ZZZ99", model: "911" },
  { prefix: "WP0ZZZ97", model: "Panamera", chassis: "970/971" },
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

/** Bratislava (WVG) also builds these VW platforms — prefer over Audi homologation. */
const VW_PLATFORM_CODES_ON_WVG = new Set([
  "7P", "7L", "CR", "AA", "1T", "1K", "1Z", "1J", "2H", "2D", "2E", "2F", "2K",
  "3C", "3D", "5N", "5M", "5Z", "6R", "6J", "6C", "7H", "7N", "7E", "9N", "9Z",
  "AU", "AW", "AX", "AZ", "CJ", "E1", "E2", "SH", "SY", "SK", "ST", "CD", "BP", "DF",
  "SF", "SG", "7J",
]);

const VW_RULES = compilePrefixRules([
  // Typ 1K = Golf Mk5 (not Mk7/8). Keep model only — Typ→Mk mapping was wrong.
  { prefix: "WVWZZZ1K", model: "Golf", chassis: "Mk5" },
  { prefix: "WVWZZZ1Z", model: "Golf" },
  // Typ 3C = Passat B6/B7 (not B8).
  { prefix: "WVWZZZ3C", model: "Passat", chassis: "B6/B7" },
  { prefix: "WVWZZZ3D", model: "Arteon", chassis: "3H" },
  { prefix: "WVWZZZ5N", model: "Tiguan", chassis: "AD1/AD2" },
  { prefix: "WVWZZZ5M", model: "T-Roc" },
  { prefix: "WVWZZZ7P", model: "Touareg", chassis: "7P" },
  { prefix: "WVWZZZ7L", model: "Touareg", chassis: "7L" },
  { prefix: "WVWZZZCR", model: "Touareg", chassis: "CR" },
  { prefix: "WVWZZZAW", model: "Polo", chassis: "6R/AW" },
  { prefix: "WVWZZZE1", model: "ID.3", chassis: "E1 (MEB)" },
  { prefix: "WVWZZZE2", model: "ID.4", chassis: "E2 (MEB)" },
  { prefix: "WVWZZZE3", model: "ID.5", chassis: "E3 (MEB)" },
  { prefix: "WVWZZZE4", model: "ID.7", chassis: "E4 (MEB)" },
  { prefix: "WVGZZZEB", model: "ID. Buzz", chassis: "EB (MEB)" },
  { prefix: "WVWZZZCJ", model: "Passat Variant", chassis: "B9/CJ" },
  { prefix: "WVWZZZCT", model: "Tiguan", chassis: "CT1" },
  { prefix: "WVWZZZR4", model: "Tayron", chassis: "R4" },
  { prefix: "WVWZZZSY", model: "T-Roc" },
  // Typ AU = Golf Mk7 (not Mk6).
  { prefix: "WVWZZZAU", model: "Golf", chassis: "Mk7" },
  { prefix: "WVWZZZ1J", model: "Jetta" },
  { prefix: "WVWZZZAA", model: "Up!" },
  { prefix: "WVWZZZ2K", model: "Golf", chassis: "Mk7" },
  { prefix: "WVWZZZ1T", model: "Touran", chassis: "1T" },
  { prefix: "WVWZZZ5T", model: "Touran", chassis: "5T" },
  { prefix: "WVWZZZ9N", model: "Polo", chassis: "9N" },
  { prefix: "WVGZZZ1T", model: "Touran", chassis: "1T" },
  { prefix: "WVGZZZ5T", model: "Touran", chassis: "5T" },
  { prefix: "WVGZZZ7P", model: "Touareg", chassis: "7P" },
  { prefix: "WVGZZZ7L", model: "Touareg", chassis: "7L" },
  { prefix: "WVGZZZCR", model: "Touareg", chassis: "CR" },
  { prefix: "WVGZZZAA", model: "Up!" },
  { prefix: "WVWZZZSH", model: "T-Roc" },
  { prefix: "WVWZZZCD", model: "Golf Variant", chassis: "Mk8" },
  { prefix: "WVWZZZBP", model: "Arteon Shooting Brake" },
  { prefix: "WVWZZZ2H", model: "Amarok" },
  { prefix: "WVWZZZ7H", model: "Tiguan", chassis: "AD1" },
  { prefix: "WVWZZZ6R", model: "T-Cross" },
  { prefix: "WVWZZZ6J", model: "Taigo" },
  { prefix: "WVWZZZDF", model: "Sharan" },
  { prefix: "WVWZZZ7N", model: "Sharan" },
  { prefix: "WVWZZZ2D", model: "Caddy", chassis: "C5" },
  { prefix: "WVWZZZ2E", model: "Caddy", chassis: "C5" },
  { prefix: "WVWZZZ7E", model: "Caddy", chassis: "C4" },
  { prefix: "WVWZZZ2F", model: "Caddy Maxi" },
  { prefix: "WVWZZZSK", model: "Caddy", chassis: "SK" },
  { prefix: "WVWZZZ6C", model: "Polo", chassis: "6C" },
  { prefix: "WV2ZZZSF", model: "Multivan", chassis: "T7" },
  { prefix: "WV2ZZZSG", model: "California", chassis: "T6.1/T7" },
  { prefix: "WV2ZZZ7H", model: "Multivan", chassis: "T6/T6.1" },
  { prefix: "WV2ZZZ7J", model: "Multivan", chassis: "T6" },
  { prefix: "WV1ZZZ7H", model: "Transporter", chassis: "T6" },
  { prefix: "WV1ZZZ7J", model: "Transporter", chassis: "T6" },
  { prefix: "WV2ZZZ2K", model: "Caddy", chassis: "C5" },
  { prefix: "WV2ZZZ2E", model: "Caddy", chassis: "C5" },
  { prefix: "WVGZZZ2D", model: "Caddy", chassis: "C5" },
  { prefix: "WVGZZZ2E", model: "Caddy", chassis: "C5" },
  { prefix: "3VWZZZ", model: "Volkswagen" },
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

/** W1K / WDB / WDC / WDF / W1N / 4JG share VDS chassis codes with WDD — alias for rule matching only. */
function mercedesRuleVin(vin: string): string {
  if (vin.startsWith("W1K") || vin.startsWith("W1N") || vin.startsWith("4JG")) {
    return `WDD${vin.slice(3)}`;
  }
  if (vin.startsWith("WDB") || vin.startsWith("WDC") || vin.startsWith("WDF")) {
    return `WDD${vin.slice(3)}`;
  }
  return vin;
}

function isMercedesPassengerWmi(wmi: string): boolean {
  return wmi.startsWith("WDD") || wmi.startsWith("W1K") || wmi.startsWith("WDB") || wmi.startsWith("WDF");
}

function isMercedesSuvWmi(wmi: string): boolean {
  return wmi.startsWith("WDC") || wmi === "W1N" || wmi.startsWith("4JG");
}

function mercedesHasChassisDigits(vin: string): boolean {
  return /^\d{3}$/.test(mercedesRuleVin(vin).slice(3, 6));
}

/** W166 mid-cycle rename: sold as ML through MY2015, GLE from MY2016. */
function finalizeW166(year: number | null): PremiumEuropeanDecode {
  if (year != null && year < 2016) return finalizePremium("ML-Class", "W166", year);
  if (year != null && year >= 2016) return finalizePremium("GLE", "W166", year);
  return finalizePremium("ML / GLE", "W166", year);
}

function isMercedes166Hit(hit: PremiumEuropeanDecode, ruleVin: string): boolean {
  return hit.chassis === "W166" || ruleVin.slice(3, 6) === "166";
}

function decodeMercedesPremium(upper: string): PremiumEuropeanDecode | null {
  const wmi = upper.slice(0, 3);
  const ruleVin = mercedesRuleVin(upper);
  const year = premiumVinModelYear(upper);

  if (mercedesHasChassisDigits(upper)) {
    const chassisHit = decodeFromRules(ruleVin, MERCEDES_RULES);
    if (chassisHit) {
      if (isMercedes166Hit(chassisHit, ruleVin)) return finalizeW166(year);
      return chassisHit;
    }
  }

  const longHit = decodeFromRules(ruleVin, MERCEDES_RULES);
  if (longHit) {
    if (isMercedes166Hit(longHit, ruleVin)) return finalizeW166(year);
    return longHit;
  }

  if (isMercedesSuvWmi(wmi)) {
    const suv = mercedesSuvFromLetterVds(upper[3]!, upper[4]!, year);
    if (suv) {
      if (suv.chassis === "W166" || (suv.model === "GLE" && suv.chassis === "W166")) {
        return finalizeW166(year);
      }
      if (suv.model === "ML-Class" && suv.chassis === "W166") return finalizeW166(year);
      return finalizePremium(suv.model, suv.chassis ?? null, year);
    }
  }

  if (isMercedesPassengerWmi(wmi)) {
    const series = mercedesPassengerSeriesAt4(ruleVin[3]!, year);
    if (series) return finalizePremium(series.model, null, year);
  }

  return null;
}

function decodeFromRules(vin: string, rules: readonly PremiumPrefixRule[]): PremiumEuropeanDecode | null {
  const hit = matchLongestPrefix(vin, rules) as PremiumPrefixRule | null;
  if (!hit) return null;
  return finalizePremium(hit.model, hit.chassis ?? null, premiumVinModelYear(vin));
}

function fromHomologation(
  hit: ReturnType<typeof decodeAudiEuHomologation>,
  vin: string,
): PremiumEuropeanDecode | null {
  if (!hit) return null;
  return finalizePremium(hit.model, hit.chassis, premiumVinModelYear(vin));
}

export function decodePremiumEuropean(vin: string): PremiumEuropeanDecode | null {
  const raw = vin.trim().toUpperCase();
  if (raw.length !== 17) return null;

  // Bratislava (WVG): Touareg/Up! share the plant with Audi SUVs.
  // Prefer known VW platform codes before Audi homologation.
  if (raw.startsWith("WVG") && raw.slice(3, 6) === "ZZZ") {
    const modernVw = decodeVolkswagenModern(raw);
    if (modernVw) {
      return finalizePremium(modernVw.model, modernVw.chassis, premiumVinModelYear(raw));
    }
    const platform78 = raw.slice(6, 8);
    const isVwPlatform =
      VW_PLATFORM_CODES_ON_WVG.has(platform78) ||
      raw.slice(6, 9).startsWith("CR") ||
      platform78 === "7P" ||
      platform78 === "7L";
    if (isVwPlatform) {
      const vwHit = decodeFromRules(normalizeVagVinForPremium(raw), VW_RULES)
        ?? decodeFromRules(raw, VW_RULES);
      if (vwHit) return vwHit;
    }
    const audiHit = fromHomologation(decodeAudiEuHomologation(raw), raw);
    if (audiHit) return audiHit;
  }

  const upper = normalizeVagVinForPremium(raw);
  const wmi = upper.slice(0, 3);

  if (wmi.startsWith("WBA") || wmi.startsWith("WBS") || wmi.startsWith("WBY") || wmi.startsWith("5UX") || wmi.startsWith("4US") || wmi.startsWith("5YM")) {
    if (raw.slice(3, 6) === "ZZZ") {
      const euHit = fromHomologation(decodeBmwEuHomologation(raw), raw);
      if (euHit) return euHit;
    }
    const f4Body = resolveBmwFourSeriesBody(upper);
    if (f4Body) return f4Body;
    return decodeFromRules(upper, BMW_RULES);
  }
  if (isMercedesPassengerWmi(wmi) || isMercedesSuvWmi(wmi)) {
    if (raw.slice(3, 6) === "ZZZ") {
      const euHit = fromHomologation(decodeMercedesEuHomologation(raw), raw);
      if (euHit) {
        // Homologation embeds chassis digits at pos. 7–9 (e.g. WDDZZZ166…).
        if (euHit.chassis === "W166" || raw.slice(6, 9) === "166") {
          return finalizeW166(premiumVinModelYear(raw));
        }
        return euHit;
      }
    }
    return decodeMercedesPremium(upper);
  }
  if (isAudiVin(raw)) {
    if (raw.slice(3, 6) === "ZZZ") {
      const euHit = fromHomologation(decodeAudiEuHomologation(raw), raw);
      if (euHit) return euHit;
    }
    const modernAudi = decodeAudiModern(raw);
    if (modernAudi) {
      return finalizePremium(modernAudi.model, modernAudi.chassis, premiumVinModelYear(raw));
    }
    if (wmi.startsWith("WA1")) return decodeFromRules(upper, AUDI_US_RULES);
    return decodeFromRules(upper, AUDI_RULES);
  }
  if (isPorscheVin(raw)) {
    const modernPorsche = decodePorscheModern(raw);
    if (modernPorsche) {
      return finalizePremium(modernPorsche.model, modernPorsche.chassis, premiumVinModelYear(raw));
    }
    return decodeFromRules(upper, PORSCHE_RULES);
  }
  if (isVolkswagenVin(raw)) {
    const modernVw = decodeVolkswagenModern(raw);
    if (modernVw) {
      return finalizePremium(modernVw.model, modernVw.chassis, premiumVinModelYear(raw));
    }
  }
  if (isVagWmi(wmi) || upper.startsWith("3VW")) {
    return decodeFromRules(upper, VW_RULES);
  }
  if (wmi.startsWith("WMW")) {
    return decodeFromRules(upper, MINI_RULES);
  }
  if (wmi.startsWith("SAL") || wmi.startsWith("SAJ") || wmi.startsWith("SAD")) {
    const jlr = decodeJlrEu(raw);
    if (jlr) {
      return {
        model: jlr.model,
        chassis: jlr.chassis,
        displayModel: jlr.displayModel,
      };
    }
  }
  return null;
}

export function decodePremiumEuropeanModel(vin: string): string | null {
  return decodePremiumEuropean(vin)?.displayModel ?? null;
}

/** Platform / chassis / generation (Series field). */
export function decodePremiumEuropeanSeries(vin: string): string | null {
  return decodePremiumEuropean(vin)?.chassis ?? null;
}

/**
 * @deprecated Equipment trim is rarely in the VIN — use decodeLocalTrim / NHTSA.
 * Kept as alias of chassis for older call sites; prefer decodePremiumEuropeanSeries.
 */
export function decodePremiumEuropeanTrim(vin: string): string | null {
  return decodePremiumEuropeanSeries(vin);
}

export function isPremiumEuropeanVin(vin: string): boolean {
  return decodePremiumEuropean(vin) != null;
}
