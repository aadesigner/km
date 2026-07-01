/**
 * Deeper model decode for BMW, Mercedes-Benz, Audi, Porsche, Volkswagen, and MINI VINs.
 * Uses manufacturer-specific VDS prefix tables (positions 4–7+).
 *
 * Note: factory option packages (SA codes) are not encoded in the public VIN;
 * this module covers model line, chassis generation, body style, and engine family.
 */

type PrefixRule = { prefix: string; model: string; chassis?: string };

function matchLongestPrefix(vin: string, rules: PrefixRule[]): PrefixRule | null {
  const sorted = [...rules].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of sorted) {
    if (vin.startsWith(rule.prefix)) return rule;
  }
  return null;
}

// BMW: position 4 alone is NOT the series — 4 Series F32/F36 often uses WBA3V*.
const BMW_RULES: PrefixRule[] = [
  { prefix: "WBA3V7", model: "4 Series", chassis: "F36 Gran Coupé" },
  { prefix: "WBA3V5", model: "4 Series", chassis: "F32 Coupé" },
  { prefix: "WBA3V3", model: "4 Series", chassis: "F33 Convertible" },
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
  { prefix: "WBA1C", model: "1 Series", chassis: "F20/F21" },
  { prefix: "WBA1H", model: "1 Series", chassis: "F40" },
  { prefix: "WBA2A", model: "2 Series", chassis: "Active Tourer (F45)" },
  { prefix: "WBA2T", model: "2 Series", chassis: "G42 Coupé" },
  { prefix: "WBA2X", model: "2 Series", chassis: "F44 Gran Coupé" },
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
  { prefix: "WBA3V", model: "3 Series", chassis: "F30/F31/F34" },
  { prefix: "WBA3", model: "3 Series" },
  { prefix: "WBA4", model: "4 Series" },
  { prefix: "WBA5", model: "5 Series" },
  { prefix: "WBA7", model: "7 Series" },
  { prefix: "5UX3V7", model: "4 Series", chassis: "F36 Gran Coupé (US)" },
  { prefix: "5UX3V5", model: "4 Series", chassis: "F32 Coupé (US)" },
  { prefix: "5UX3V", model: "3 Series", chassis: "F30 (US)" },
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
  { prefix: "WBY8", model: "i8" },
  { prefix: "WBY7", model: "iX" },
];

const MERCEDES_RULES: PrefixRule[] = [
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
];

const AUDI_RULES: PrefixRule[] = [
  { prefix: "WAUZZZ8V", model: "A3" },
  { prefix: "WAUZZZ8X", model: "A3 Sportback" },
  { prefix: "WAUZZZ8K", model: "A4" },
  { prefix: "WAUZZZ8H", model: "A4 / A5" },
  { prefix: "WAUZZZ4G", model: "A6" },
  { prefix: "WAUZZZ4F", model: "A6 Avant" },
  { prefix: "WAUZZZ4H", model: "A7 Sportback" },
  { prefix: "WAUZZZ4A", model: "A8" },
  { prefix: "WAUZZZGY", model: "Q7" },
  { prefix: "WAUZZZGA", model: "Q5" },
  { prefix: "WAUZZZGE", model: "Q8 / e-tron" },
  { prefix: "WAUZZZGS", model: "Q3" },
  { prefix: "WAUZZZGU", model: "e-tron GT" },
  { prefix: "WAUZZZF1", model: "A3", chassis: "8Y" },
  { prefix: "WAUZZZF4", model: "A4", chassis: "B9" },
  { prefix: "WAUZZZF5", model: "A5", chassis: "F5" },
  { prefix: "WAUZZZF6", model: "A6", chassis: "C8" },
  { prefix: "WAUZZZFR", model: "R8" },
  { prefix: "WAUZZZTR", model: "TT" },
];

const PORSCHE_RULES: PrefixRule[] = [
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
];

const VW_RULES: PrefixRule[] = [
  { prefix: "WVWZZZ1K", model: "Golf", chassis: "Mk7/Mk8" },
  { prefix: "WVWZZZ3C", model: "Passat", chassis: "B8" },
  { prefix: "WVWZZZ3D", model: "Arteon", chassis: "3H" },
  { prefix: "WVWZZZ5N", model: "Tiguan", chassis: "AD1/AD2" },
  { prefix: "WVWZZZ7P", model: "Touareg", chassis: "CR" },
  { prefix: "WVWZZZAW", model: "Polo", chassis: "6R/AW" },
  { prefix: "WVWZZZCJ", model: "ID.3" },
  { prefix: "WVWZZZE1", model: "ID.4" },
  { prefix: "WVWZZZE2", model: "ID.5" },
  { prefix: "WVWZZZSY", model: "T-Roc" },
  { prefix: "WVWZZZAU", model: "Golf", chassis: "Mk6" },
  { prefix: "WVWZZZ1J", model: "Jetta", chassis: "Mk6/Mk7" },
  { prefix: "3VWZZZ", model: "Volkswagen", chassis: "US market" },
];

const MINI_RULES: PrefixRule[] = [
  { prefix: "WMWXP7", model: "MINI Cooper", chassis: "F56" },
  { prefix: "WMWXP9", model: "MINI Cooper", chassis: "F55" },
  { prefix: "WMWXS7", model: "MINI Clubman", chassis: "F54" },
  { prefix: "WMWXS1", model: "MINI Countryman", chassis: "F60" },
  { prefix: "WMWZP7", model: "MINI Cooper SE", chassis: "Electric" },
];

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

function decodeFromRules(vin: string, rules: PrefixRule[]): PremiumEuropeanDecode | null {
  const hit = matchLongestPrefix(vin, rules);
  if (!hit) return null;
  return {
    model: hit.model,
    chassis: hit.chassis ?? null,
    displayModel: formatDisplay(hit.model, hit.chassis ?? null),
  };
}

export function decodePremiumEuropean(vin: string): PremiumEuropeanDecode | null {
  const upper = vin.toUpperCase().trim();
  if (upper.length !== 17) return null;

  const wmi = upper.slice(0, 3);
  if (wmi.startsWith("WBA") || wmi.startsWith("WBS") || wmi.startsWith("WBY") || wmi.startsWith("5UX") || wmi.startsWith("4US")) {
    return decodeFromRules(upper, BMW_RULES);
  }
  if (wmi.startsWith("WDD") || wmi.startsWith("WDB") || wmi.startsWith("WDC") || wmi.startsWith("WDF")) {
    return decodeFromRules(upper, MERCEDES_RULES);
  }
  if (wmi.startsWith("WAU") || wmi.startsWith("TRU")) {
    return decodeFromRules(upper, AUDI_RULES);
  }
  if (wmi.startsWith("WP0") || wmi.startsWith("WP1")) {
    return decodeFromRules(upper, PORSCHE_RULES);
  }
  if (wmi.startsWith("WVW") || wmi.startsWith("WV1") || wmi.startsWith("WV2") || upper.startsWith("3VW")) {
    return decodeFromRules(upper, VW_RULES);
  }
  if (wmi.startsWith("WMW")) {
    return decodeFromRules(upper, MINI_RULES);
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
