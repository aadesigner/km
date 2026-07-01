/**
 * European VIN model decoding (VAG Group + Audi).
 * EU-format VINs use ZZZ filler at positions 4–6; model platform at position 7 (index 6).
 */

/** Volkswagen Group — position 7 after WV*ZZZ / WVWZZZ */
const VAG_MODEL_AT_7: Record<string, string> = {
  "1": "Golf",
  "2": "Passat",
  "3": "Arteon / Passat",
  "5": "Jetta",
  "6": "Eos",
  "7": "Tiguan",
  "8": "Touareg / Atlas",
  "9": "Touran",
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
  T: "Scirocco / Polo GTI",
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
  return prefix.startsWith("WVW") || prefix.startsWith("WV1") || prefix.startsWith("WV2")
    || prefix.startsWith("3VW");
}

function isAudiEuPrefix(prefix: string): boolean {
  return prefix.startsWith("WAU") || prefix.startsWith("TRU");
}

function hasZzzFiller(vin: string): boolean {
  return vin.slice(3, 6) === "ZZZ";
}

/** Decode model from EU VAG/Audi ZZZ-format VINs. */
export function decodeModelEuropean(vin: string): string | null {
  const u = vin.toUpperCase();
  if (u.length < 8 || !hasZzzFiller(u)) return null;

  const pos7 = u[6];
  const wmi = u.slice(0, 3);

  if (isVagPrefix(wmi)) return VAG_MODEL_AT_7[pos7] ?? null;
  if (isAudiEuPrefix(wmi)) return AUDI_MODEL_AT_7[pos7] ?? null;

  return null;
}
