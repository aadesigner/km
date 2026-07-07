/**
 * Model + make resolution for popular global brands outside premium EU / US core tables.
 * WMI-gated, prefix-only (no fuzzy guesses) — one pass returns model + make override.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

// ── Dacia — position 4 model family (UU1 / UU6, Romania) ─────────────────────
const DACIA_MODEL_AT_4: Record<string, string> = {
  B: "Sandero",
  D: "Duster",
  H: "Logan",
  J: "Jogger",
  S: "Spring",
  L: "Lodgy",
  M: "Dokker",
};

const DACIA_PREFIX_RULES = compilePrefixRules([
  { prefix: "UU1DJF", model: "Duster" },
  { prefix: "UU1HDR", model: "Logan" },
  { prefix: "UU1BFB", model: "Sandero" },
  { prefix: "UU1JDJ", model: "Jogger" },
  { prefix: "UU1SDJ", model: "Spring" },
]);

function isDaciaVin(vin: string): boolean {
  return vin.startsWith("UU1") || vin.startsWith("UU6");
}

function decodeDaciaModel(vin: string): string | null {
  const prefixHit = matchLongestPrefix(vin, DACIA_PREFIX_RULES);
  if (prefixHit) return prefixHit.model;
  return DACIA_MODEL_AT_4[vin[3]] ?? null;
}

// ── Suzuki ───────────────────────────────────────────────────────────────────
const SUZUKI_PREFIX_RULES = compilePrefixRules([
  { prefix: "JS2ZC", model: "Swift" },
  { prefix: "JS2YB", model: "Baleno" },
  { prefix: "JS3JB", model: "Jimny" },
  { prefix: "JS3TE", model: "Vitara" },
  { prefix: "JS3TD", model: "Vitara" },
  { prefix: "TSMLY", model: "Vitara" },
  { prefix: "TSMNZ", model: "S-Cross" },
  { prefix: "TSMKY", model: "SX4 S-Cross" },
  { prefix: "TSMJB", model: "Jimny" },
  { prefix: "MA3E", model: "Swift" },
  { prefix: "MA3C", model: "Dzire" },
  { prefix: "MA3F", model: "Brezza" },
  { prefix: "2S3TC", model: "Vitara" },
]);

function isSuzukiWmi(wmi: string): boolean {
  return (
    wmi.startsWith("JS2")
    || wmi.startsWith("JS3")
    || wmi.startsWith("JS4")
    || wmi.startsWith("TSM")
    || wmi.startsWith("2S2")
    || wmi.startsWith("2S3")
    || wmi === "MA3"
    || wmi.startsWith("JSA")
    || wmi.startsWith("JST")
  );
}

// ── MG / BYD / Haval ─────────────────────────────────────────────────────────
const MG_PREFIX_RULES = compilePrefixRules([
  { prefix: "LSJWP", model: "ZS" },
  { prefix: "LSJWH", model: "HS" },
  { prefix: "LSJW5", model: "MG4" },
  { prefix: "LSJWR", model: "MG5" },
  { prefix: "LSJWE", model: "Marvel R" },
  { prefix: "LSJWF", model: "Cyberster" },
]);

const BYD_PREFIX_RULES = compilePrefixRules([
  { prefix: "LFPAA", model: "Atto 3" },
  { prefix: "LFPBB", model: "Han" },
  { prefix: "LFPBC", model: "Tang" },
  { prefix: "LC0CE", model: "Dolphin" },
  { prefix: "LC0DE", model: "Seal" },
  { prefix: "LC0CF", model: "Seagull" },
  { prefix: "LBVYA", model: "Song Plus" },
]);

const HAVAL_PREFIX_RULES = compilePrefixRules([
  { prefix: "LGWFF", model: "H6" },
  { prefix: "LGWEF", model: "Jolion" },
  { prefix: "LGWDA", model: "Dargo" },
  { prefix: "LGWDB", model: "F7" },
]);

// ── Polestar / VinFast / Lucid ───────────────────────────────────────────────
const POLESTAR_PREFIX_RULES = compilePrefixRules([
  { prefix: "LPSVSE", model: "Polestar 2" },
  { prefix: "LPSVS", model: "Polestar 2" },
  { prefix: "LPSVY", model: "Polestar 4" },
  { prefix: "LYVSE", model: "Polestar 2" },
  { prefix: "YSMRH", model: "Polestar 1" },
]);

const VINFAST_PREFIX_RULES = compilePrefixRules([
  { prefix: "RLLVC", model: "VF8" },
  { prefix: "RLLVD", model: "VF9" },
  { prefix: "RLNVF", model: "VF e34" },
  { prefix: "RLNV8", model: "VF8" },
]);

const LUCID_PREFIX_RULES = compilePrefixRules([
  { prefix: "5LABP", model: "Air" },
  { prefix: "5LAA1", model: "Air" },
  { prefix: "5LAC1", model: "Air" },
]);

// ── Isuzu / Tata / KGM ───────────────────────────────────────────────────────
const ISUZU_PREFIX_RULES = compilePrefixRules([
  { prefix: "MPATF", model: "D-Max" },
  { prefix: "MPAU0", model: "MU-X" },
  { prefix: "JACST", model: "MU-X" },
  { prefix: "JAADS", model: "D-Max" },
  { prefix: "M3GTF", model: "D-Max" },
  { prefix: "4S2CK", model: "Rodeo" },
  { prefix: "4S1CK", model: "H-Series" },
]);

const TATA_PREFIX_RULES = compilePrefixRules([
  { prefix: "MAT612", model: "Nexon" },
  { prefix: "MAT813", model: "Harrier" },
  { prefix: "MAT823", model: "Safari" },
  { prefix: "MAT31", model: "Punch" },
  { prefix: "MAT61", model: "Nexon" },
]);

const KGM_PREFIX_RULES = compilePrefixRules([
  { prefix: "KPT20", model: "Rexton" },
  { prefix: "KPTB0", model: "Torres" },
  { prefix: "KPTB2", model: "Torres" },
  { prefix: "KPTG0", model: "Tivoli" },
  { prefix: "KPTG2", model: "Tivoli" },
  { prefix: "KPAJ0", model: "Musso" },
  { prefix: "KPAJ2", model: "Musso" },
]);

// ── Cupra / DS — prefix rules only (avoid SEAT/Citroën ZZZ overlap) ───────────
const CUPRA_PREFIX_RULES = compilePrefixRules([
  { prefix: "VSSZZZKM", model: "Formentor" },
  { prefix: "VSSZZZK1", model: "Born" },
  { prefix: "VSSZZZKP", model: "Born" },
  { prefix: "VSSZZZKN", model: "Leon" },
  { prefix: "VS7ZZZKM", model: "Terramar" },
  { prefix: "VS7ZZZKN", model: "Leon" },
]);

const DS_VR1_RULES = compilePrefixRules([
  { prefix: "VR1RHR", model: "DS 7" },
  { prefix: "VR1JAL", model: "DS 3" },
  { prefix: "VR1JCL", model: "DS 4" },
  { prefix: "VR1JCH", model: "DS 4" },
]);

const DS_VF7_RULES = compilePrefixRules([
  { prefix: "VF7RHR", model: "DS 7" },
  { prefix: "VF7SAJ", model: "DS 3" },
  { prefix: "VF7SCL", model: "DS 4" },
]);

// ── Smart / Lancia / Mahindra / Lada ─────────────────────────────────────────
const SMART_PREFIX_RULES = compilePrefixRules([
  { prefix: "WME451", model: "fortwo" },
  { prefix: "WME453", model: "forfour" },
  { prefix: "WME454", model: "#1" },
]);

const LANCIA_PREFIX_RULES = compilePrefixRules([
  { prefix: "ZLA334", model: "Ypsilon" },
  { prefix: "ZLA312", model: "Ypsilon" },
]);

const MAHINDRA_PREFIX_RULES = compilePrefixRules([
  { prefix: "MA1FC", model: "XUV700" },
  { prefix: "MA1XA", model: "Scorpio" },
  { prefix: "MA1TA", model: "Thar" },
]);

const LADA_PREFIX_RULES = compilePrefixRules([
  { prefix: "XTA219", model: "Granta" },
  { prefix: "XTA217", model: "Vesta" },
  { prefix: "XTA212", model: "Niva" },
]);

function isVinFastVin(vin: string): boolean {
  const wmi = vin.slice(0, 3);
  return wmi === "RLL" || wmi === "RLN";
}

function isIsuzuWmi(wmi: string): boolean {
  return (
    wmi === "JAA"
    || wmi === "JAC"
    || wmi === "JAL"
    || wmi === "MP1"
    || wmi === "MPA"
    || wmi === "M3G"
    || wmi === "4S1"
    || wmi === "4S2"
    || wmi === "J87"
    || wmi === "J8Z"
  );
}

export type GlobalBrandDecode = {
  model: string | null;
  makeOverride: string | null;
};

const EMPTY_GLOBAL: GlobalBrandDecode = { model: null, makeOverride: null };

/**
 * Single WMI-gated pass — only runs decoders relevant to the VIN prefix.
 * Returns null model when no confident prefix match (no guessing).
 */
export function decodeGlobalBrand(vin: string): GlobalBrandDecode {
  const upper = vin.toUpperCase().trim();
  if (upper.length !== 17) return EMPTY_GLOBAL;

  const wmi = upper.slice(0, 3);

  if (isDaciaVin(upper)) {
    return { model: decodeDaciaModel(upper), makeOverride: "Dacia" };
  }

  if (upper.startsWith("VSS") || upper.startsWith("VS7")) {
    const hit = matchLongestPrefix(upper, CUPRA_PREFIX_RULES);
    if (hit) return { model: hit.model, makeOverride: "Cupra" };
    return EMPTY_GLOBAL;
  }

  if (upper.startsWith("VR1")) {
    const hit = matchLongestPrefix(upper, DS_VR1_RULES);
    return hit
      ? { model: hit.model, makeOverride: "DS Automobiles" }
      : EMPTY_GLOBAL;
  }

  if (upper.startsWith("VF7")) {
    const hit = matchLongestPrefix(upper, DS_VF7_RULES);
    return hit
      ? { model: hit.model, makeOverride: "DS Automobiles" }
      : EMPTY_GLOBAL;
  }

  if (wmi === "LPS" || wmi.startsWith("YSM")) {
    const hit = matchLongestPrefix(upper, POLESTAR_PREFIX_RULES);
    return {
      model: hit?.model ?? null,
      makeOverride: "Polestar",
    };
  }

  if (wmi === "LYV") {
    const hit = matchLongestPrefix(upper, POLESTAR_PREFIX_RULES);
    return hit
      ? { model: hit.model, makeOverride: "Polestar" }
      : EMPTY_GLOBAL;
  }

  if (isVinFastVin(upper)) {
    const hit = matchLongestPrefix(upper, VINFAST_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: "VinFast" };
  }

  if (wmi === "MAT") {
    const hit = matchLongestPrefix(upper, TATA_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: "Tata" };
  }

  if (isIsuzuWmi(wmi)) {
    const hit = matchLongestPrefix(upper, ISUZU_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: "Isuzu" };
  }

  if (wmi === "KPT" || wmi === "KPA") {
    const hit = matchLongestPrefix(upper, KGM_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi.startsWith("LSJ")) {
    const hit = matchLongestPrefix(upper, MG_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi === "LFP" || wmi === "LC0" || wmi === "LBV" || wmi === "LGX") {
    const hit = matchLongestPrefix(upper, BYD_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi.startsWith("LGW")) {
    const hit = matchLongestPrefix(upper, HAVAL_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (isSuzukiWmi(wmi)) {
    const hit = matchLongestPrefix(upper, SUZUKI_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (upper.startsWith("5LA")) {
    const hit = matchLongestPrefix(upper, LUCID_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi.startsWith("WME")) {
    const hit = matchLongestPrefix(upper, SMART_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi.startsWith("ZLA")) {
    const hit = matchLongestPrefix(upper, LANCIA_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi.startsWith("MA1")) {
    const hit = matchLongestPrefix(upper, MAHINDRA_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  if (wmi.startsWith("XTA")) {
    const hit = matchLongestPrefix(upper, LADA_PREFIX_RULES);
    return { model: hit?.model ?? null, makeOverride: null };
  }

  return EMPTY_GLOBAL;
}

/** @deprecated Use decodeGlobalBrand — kept for callers that only need model. */
export function decodeGlobalBrandModel(vin: string): string | null {
  return decodeGlobalBrand(vin).model;
}

/** Apply make override from global brand tables after WMI lookup. */
export function resolveGlobalBrandMake(
  vin: string,
  wmiMake: string | null,
  global?: GlobalBrandDecode,
): string | null {
  const decoded = global ?? decodeGlobalBrand(vin);
  return decoded.makeOverride ?? wmiMake;
}

export {
  isDaciaVin,
  isVinFastVin,
  isIsuzuWmi,
  isSuzukiWmi,
  decodeDaciaModel,
  matchLongestPrefix,
  CUPRA_PREFIX_RULES,
};
