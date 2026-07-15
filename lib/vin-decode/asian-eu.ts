/**
 * Hyundai, Toyota, and related EU/regional plant decoders.
 * Complements MODEL_MAP_4 with longer prefix rules.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";
import { decodeHyundaiModel, isHyundaiVin, matchHyundaiRule } from "./hyundai";

const TOYOTA_RULES: PrefixRule[] = compilePrefixRules([
  { prefix: "JTDKB3", model: "Prius", chassis: "XW50" },
  { prefix: "JTDKN3", model: "Prius", chassis: "XW30" },
  { prefix: "JTDKB2", model: "Prius", chassis: "XW20" },
  { prefix: "JTMB1R", model: "RAV4", chassis: "XA50" },
  { prefix: "JTMBF3", model: "RAV4", chassis: "XA40" },
  { prefix: "JTMC1R", model: "Highlander", chassis: "XU70" },
  { prefix: "JTMCF3", model: "Highlander", chassis: "XU50" },
  { prefix: "JTMAB3", model: "Yaris", chassis: "XP210" },
  { prefix: "JTMAF3", model: "Yaris", chassis: "XP130" },
  { prefix: "JTME1R", model: "bZ4X" },
  { prefix: "JTMW1R", model: "Corolla Cross", chassis: "XG10" },
  { prefix: "JTMDH3", model: "Corolla Cross", chassis: "XG10" },
  { prefix: "JTMDA3", model: "Corolla", chassis: "E210" },
  { prefix: "JTMDF3", model: "Corolla", chassis: "E170" },
  { prefix: "JTJBG1", model: "Land Cruiser", chassis: "J300" },
  { prefix: "JTJBT9", model: "Land Cruiser", chassis: "J200" },
  { prefix: "SB1KB3", model: "Corolla", chassis: "E210 UK" },
  { prefix: "SB1K93", model: "Corolla Touring Sports" },
  { prefix: "SB1B93", model: "C-HR", chassis: "AX10" },
  { prefix: "SB1B83", model: "C-HR", chassis: "AX20" },
  { prefix: "SB1Y93", model: "Yaris", chassis: "XP210 UK" },
  { prefix: "SB1F93", model: "RAV4", chassis: "XA50 UK" },
  { prefix: "SB1J93", model: "Aygo X" },
  { prefix: "SB1ZR", model: "Yaris Cross", chassis: "XP210 UK" },
  { prefix: "JTDAGN", model: "Aygo", chassis: "AB40" },
  { prefix: "JTDAGC", model: "Aygo", chassis: "AB10" },
  { prefix: "YARKA3", model: "Yaris", chassis: "XP210 FR" },
  { prefix: "VF1BT9", model: "Toyota Proace" },
  { prefix: "VF1BT8", model: "Toyota Proace City" },
  // Toyota USA Mississippi (5YF* — Corolla sedan/hatch)
  { prefix: "5YFS4", model: "Corolla", chassis: "E210 2.0L" },
  { prefix: "5YFT4", model: "Corolla", chassis: "E210" },
  { prefix: "5YFB4", model: "Corolla", chassis: "E210" },
  { prefix: "5YFP4", model: "Corolla", chassis: "E210" },
  { prefix: "5YFBU", model: "Corolla", chassis: "E170" },
  { prefix: "5YFB", model: "Corolla" },
  { prefix: "5YFS", model: "Corolla" },
  { prefix: "5YFT", model: "Corolla" },
  // Toyota USA Kentucky / Indiana plants
  { prefix: "4T1B11", model: "Camry", chassis: "XV70" },
  { prefix: "4T1K61", model: "Camry", chassis: "XV70 Hybrid" },
  { prefix: "5TDZAR", model: "Sienna", chassis: "XL30" },
  { prefix: "5TDBK3", model: "Highlander", chassis: "XU50" },
  { prefix: "5TDDZ3", model: "Highlander", chassis: "XU70" },
]);

// Honda EU / UK Swindon (SHH) — plant closed 2021; Type R era still common in EU VINs.
const HONDA_EU_RULES: PrefixRule[] = compilePrefixRules([
  { prefix: "SHHFK", model: "Civic", chassis: "EP3" },
  { prefix: "SHHFN", model: "Civic", chassis: "FN2" },
  { prefix: "SHHFR", model: "Civic", chassis: "FK2/FK8" },
  { prefix: "SHHCR", model: "CR-V" },
]);

function isToyotaExtendedVin(vin: string): boolean {
  return (
    vin.startsWith("JT")
    || vin.startsWith("SB1")
    || vin.startsWith("JTD")
    || vin.startsWith("YAR")
    || vin.startsWith("VF1BT")
    || vin.startsWith("5YF")
    || vin.startsWith("4T1")
    || vin.startsWith("5TD")
    || vin.startsWith("2T1")
    || vin.startsWith("2T3")
  );
}

function isHondaEuVin(vin: string): boolean {
  return vin.startsWith("SHH");
}

export function isHyundaiToyotaVin(vin: string): boolean {
  const u = vin.toUpperCase();
  return isHyundaiVin(u) || isToyotaExtendedVin(u) || isHondaEuVin(u);
}

/** Full rule hit (model + optional chassis) for series/generation. */
export function matchHyundaiToyotaRule(vin: string): PrefixRule | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 9) return null;

  if (isHondaEuVin(u)) {
    const hondaEu = matchLongestPrefix(u, HONDA_EU_RULES);
    if (hondaEu) return hondaEu;
  }
  if (isHyundaiVin(u)) {
    const hyundai = matchHyundaiRule(u);
    if (hyundai) return hyundai;
  }
  if (isToyotaExtendedVin(u)) {
    const toyota = matchLongestPrefix(u, TOYOTA_RULES);
    if (toyota) return toyota;
  }

  return null;
}

export function decodeHyundaiToyotaModel(vin: string): string | null {
  const u = vin.toUpperCase().trim();
  if (isHyundaiVin(u)) return decodeHyundaiModel(u);
  return matchHyundaiToyotaRule(vin)?.model ?? null;
}

export { isHyundaiVin, matchHyundaiRule, decodeHyundaiModel, decodeHyundaiEngine } from "./hyundai";

