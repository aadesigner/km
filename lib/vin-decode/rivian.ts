/**
 * Rivian VIN decode — NHTSA MID (49 CFR 565) verified only.
 *
 * WMI 7FC = truck (R1T when pos.4 = T; EDV/RCV when pos.4 = D/E)
 * WMI 7PD = MPV (R1S when pos.4 = S)
 *
 * Sources: Rivian NHTSA VIN decipher submissions for MY2024–2026
 * (vpic.nhtsa.dot.gov MID display files). No invented model lines.
 */

import { compilePrefixRules, matchLongestPrefix } from "./prefix-match";
import type { BrandVinSpec } from "./brand-vin-spec";

export const RIVIAN_WMIS = new Set(["7FC", "7PD"]);

/** Customer R1 deliveries began MY2022 (late 2021 builds still encode MY2022). */
const R1_YEAR_FROM = 2021;

const RIVIAN_PREFIX_RULES = compilePrefixRules([
  // Truck WMI 7FC — pos.4 model line (MID)
  { prefix: "7FCT", model: "R1T", body: "Pickup", yearFrom: R1_YEAR_FROM, yearTo: 2099 },
  { prefix: "7FCD", model: "EDV", body: "Van", yearFrom: 2022, yearTo: 2099 },
  { prefix: "7FCE", model: "EDV", body: "Van", yearFrom: 2022, yearTo: 2099 },
  // MPV WMI 7PD — pos.4 = S → R1S (MID)
  { prefix: "7PDS", model: "R1S", body: "SUV", yearFrom: R1_YEAR_FROM, yearTo: 2099 },
]);

export function isRivianVin(vin: string): boolean {
  return RIVIAN_WMIS.has(vin.slice(0, 3).toUpperCase());
}

export function decodeRivianSpec(vin: string): BrandVinSpec | null {
  const upper = vin.toUpperCase().trim();
  if (!isRivianVin(upper)) return null;

  const hit = matchLongestPrefix(upper, RIVIAN_PREFIX_RULES);
  if (!hit) {
    // Known Rivian WMI but unmapped VDS — make only (never invent a model).
    return null;
  }

  return {
    make: "Rivian",
    model: hit.model,
    bodyStyle: hit.body ?? null,
    fuelType: "Electric",
    driveType: "AWD",
    engineDecoded: null,
    transmissionDecoded: null,
    plantCity: "Normal",
    plantCountry: "United States",
  };
}

export function matchRivianRule(vin: string): { model: string; yearFrom?: number; yearTo?: number } | null {
  const upper = vin.toUpperCase().trim();
  if (!isRivianVin(upper)) return null;
  const hit = matchLongestPrefix(upper, RIVIAN_PREFIX_RULES);
  if (!hit) return null;
  return {
    model: hit.model,
    yearFrom: hit.yearFrom,
    yearTo: hit.yearTo,
  };
}
