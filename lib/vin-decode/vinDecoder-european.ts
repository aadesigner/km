import { isVagWmi } from "./vag-wmi";
import { decodeAudiEuHomologation, homologationToDisplay, isAudiHomologationVin } from "./eu-zzz-homologation";
import { decodeFordEuModel, isFordEuWmi } from "./ford-eu";
import { decodeJlrEuModel } from "./jlr-eu";

/**
 * European VIN model decoding (VAG Group + Audi).
 * EU-format VINs use ZZZ filler at positions 4–6; model platform at position 7 (index 6).
 */

/** Volkswagen Group — position 7–8 (preferred) and position 7 fallback */
const VAG_MODEL_AT_78: Record<string, string> = {
  "1K": "Golf",
  "1T": "Touran",
  "1J": "Jetta",
  "3C": "Passat",
  "3D": "Arteon",
  "5N": "Tiguan",
  "5M": "Golf Plus",
  "5T": "Touran",
  "5Z": "Fox",
  "6R": "Polo",
  "6N": "Polo",
  "6J": "Taigo",
  "6C": "Polo",
  "7P": "Touareg",
  "7L": "Touareg",
  "7H": "Tiguan",
  "7N": "Sharan",
  "7E": "Caddy",
  "7J": "Multivan",
  // Typ 9N = Polo Mk4 (NOT Touran — Touran is 1T / 5T)
  "9N": "Polo",
  "9C": "New Beetle",
  // Gen 3 Touareg (CR platform) — common Bratislava (WVG) encoding
  CR: "Touareg",
  AU: "Golf",
  AW: "Polo",
  AX: "Golf",
  CJ: "ID.3",
  E1: "ID.4",
  E2: "ID.5",
  SH: "T-Roc",
  SY: "T-Roc",
  SF: "Multivan",
  SG: "California",
  SK: "ID. Buzz",
  ST: "ID. Buzz Cargo",
  "2H": "Amarok",
  "2D": "Caddy",
  "2E": "Caddy",
  "2K": "Golf",
  "2F": "Caddy Maxi",
  DF: "Sharan",
  CD: "Golf Variant",
  BP: "Arteon",
  AA: "Up!",
};

/** Volkswagen Group — position 7 after WV*ZZZ / WVWZZZ */
const VAG_MODEL_AT_7: Record<string, string> = {
  "1": "Golf",
  "2": "Passat",
  "3": "Arteon / Passat",
  "5": "Jetta",
  "6": "Eos",
  "7": "Tiguan",
  "8": "Touareg / Atlas",
  "9": "Polo",
  A: "New Beetle",
  B: "Golf Plus / Sportsvan",
  D: "Passat CC",
  E: "Scirocco",
  G: "Golf Variant",
  H: "Golf Cabriolet",
  J: "Jetta",
  K: "Beetle Convertible",
  L: "Up! / Lupo",
  M: "Polo",
  N: "Transporter / Multivan",
  P: "Polo Sedan / Vento",
  R: "Phaeton",
  T: "Touran",
  U: "Caddy",
  V: "Golf / Rabbit",
  W: "Golf Sportsvan",
  X: "Passat Variant",
  Y: "Crafter",
};

/** Audi — position 7 after WAUZZZ / TRUZZZ */
const AUDI_MODEL_AT_7: Record<string, string> = {
  "8": "A4 / A5",
  "9": "TT",
  A: "A6",
  B: "A4 Cabriolet",
  C: "A6 Avant",
  D: "A8",
  E: "A4 allroad",
  F: "A6 allroad",
  G: "Q7",
  H: "A4 / A5 (B9)",
  J: "A8 (D5)",
  K: "Q5",
  L: "Q7",
  M: "Q8",
  N: "e-tron",
  P: "RS / RS Q8",
  R: "R8",
  S: "Q3",
  T: "Q5 Sportback",
  U: "e-tron GT",
  V: "A3",
  W: "A3 Sportback",
  X: "A1",
  Y: "Q2",
  Z: "Q4 e-tron",
};

function isVagPrefix(prefix: string): boolean {
  return isVagWmi(prefix) || prefix.startsWith("3VW");
}

function isAudiEuPrefix(prefix: string): boolean {
  return prefix.startsWith("WAU") || prefix.startsWith("TRU");
}

function hasZzzFiller(vin: string): boolean {
  return vin.slice(3, 6) === "ZZZ";
}

/**
 * EU type-approval VINs use ZZZ at positions 4–6; positions 7–9 are the homologation code
 * (e.g. Audi 4G6), not US-style engine/transmission letters at position 8.
 * Applies to BMW, Mercedes, Audi, Porsche, VW, JLR, Peugeot, etc.
 */
export function hasEuZzzTypeApprovalDescriptor(vin: string): boolean {
  return vin.toUpperCase().length >= 9 && hasZzzFiller(vin);
}

/** @deprecated Use hasEuZzzTypeApprovalDescriptor — kept as alias for clarity at call sites. */
export function isEuZzzTypeApprovalVin(vin: string): boolean {
  return hasEuZzzTypeApprovalDescriptor(vin);
}

/** Decode model from EU VAG/Audi ZZZ-format VINs. */
export function decodeModelEuropean(vin: string): string | null {
  const u = vin.toUpperCase();
  if (u.length < 8 || !hasZzzFiller(u)) return null;

  const wmi = u.slice(0, 3);
  const pos7 = u[6];
  const code78 = u.length >= 8 ? u.slice(6, 8) : "";

  // VW passenger/commercial first — Bratislava (WVG) builds Touareg/Up! alongside Audi SUVs.
  // Prefer platform codes (7P/7L/CR/…) before Audi homologation so Touareg is not missed.
  if (isVagPrefix(wmi)) {
    const from78 = VAG_MODEL_AT_78[code78];
    if (from78) return from78;
    // 3-char type codes e.g. CR7 (Touareg III)
    if (u.length >= 9) {
      const code79 = u.slice(6, 9);
      if (code79.startsWith("CR")) return "Touareg";
      if (code79.startsWith("7P") || code79.startsWith("7L")) return "Touareg";
    }
  }

  // Audi homologation (WAU/TRU, or WVG when Audi SUV type code)
  if (isAudiEuPrefix(wmi) || (wmi === "WVG" && isAudiHomologationVin(u))) {
    const audi = decodeAudiEuHomologation(u);
    if (audi) return homologationToDisplay(audi);
  }

  if (isVagPrefix(wmi)) {
    return VAG_MODEL_AT_7[pos7] ?? null;
  }
  if (isAudiEuPrefix(wmi)) return AUDI_MODEL_AT_7[pos7] ?? null;

  if (wmi.startsWith("SAL") || wmi.startsWith("SAJ")) {
    return decodeJlrEuModel(u);
  }
  if (isFordEuWmi(wmi)) {
    return decodeFordEuModel(u);
  }

  return null;
}
