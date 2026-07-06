/**
 * Model decoding for popular EU brands outside the premium (BMW/MB/Audi/Porsche) tables.
 * Škoda, Renault, Fiat, Peugeot/Citroën (ZZZ), and SEAT.
 */

type PrefixRule = { prefix: string; model: string };

function matchLongestPrefix(vin: string, rules: PrefixRule[]): PrefixRule | null {
  const sorted = [...rules].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of sorted) {
    if (vin.startsWith(rule.prefix)) return rule;
  }
  return null;
}

// ── Škoda — model/type code at positions 7–8 (indices 6–7) ───────────────────
const SKODA_MODEL_78: Record<string, string> = {
  NJ: "Fabia",
  "6H": "Fabia",
  "6Y": "Fabia",
  NX: "Octavia",
  NE: "Octavia",
  "5E": "Octavia",
  "1Z": "Octavia",
  "1U": "Octavia",
  NP: "Superb",
  "3V": "Superb",
  "3T": "Superb",
  "3U": "Superb",
  "55": "Kodiaq",
  NS: "Kodiaq",
  NW: "Scala",
  NU: "Karoq",
  NZ: "Karoq",
  "5L": "Yeti",
  "5J": "Rapid",
  NG: "Rapid",
  NH: "Rapid",
  NK: "Rapid",
  NF: "Citigo",
  "0G": "Rapid Spaceback",
};

const SKODA_PREFIX_RULES: PrefixRule[] = [
  { prefix: "TMBJP7NX", model: "Octavia" },
  { prefix: "TMBJJ7NX", model: "Octavia" },
  { prefix: "TMBJW7NP", model: "Superb" },
  { prefix: "TMBER7NW", model: "Scala" },
  { prefix: "TMBEP6NJ", model: "Fabia" },
  { prefix: "TMBAG6NE", model: "Octavia" },
  { prefix: "TMBAC6NX", model: "Octavia" },
  { prefix: "TMBLK7NU", model: "Karoq" },
  { prefix: "TMBLK7NZ", model: "Karoq" },
  { prefix: "TMBLK6NZ", model: "Karoq" },
  { prefix: "TMBDK6XK", model: "Kodiaq" },
];

function decodeSkodaModel(vin: string): string | null {
  if (!vin.startsWith("TMB")) return null;
  const prefixHit = matchLongestPrefix(vin, SKODA_PREFIX_RULES);
  if (prefixHit) return prefixHit.model;
  if (vin.length < 8) return null;
  const code78 = vin.slice(6, 8);
  return SKODA_MODEL_78[code78] ?? null;
}

// ── Renault — longer VDS prefix rules (4-char MODEL_MAP_4 handles WMI + pos 4) ─
const RENAULT_PREFIX_RULES: PrefixRule[] = [
  { prefix: "VF1RFK", model: "Captur" },
  { prefix: "VF1RJK", model: "Captur" },
  { prefix: "VF1RJH", model: "Captur" },
  { prefix: "VF1RF", model: "Clio" },
  { prefix: "VF1R5", model: "Clio" },
  { prefix: "VF1RJ", model: "Clio" },
  { prefix: "VF1RJA", model: "Clio" },
  { prefix: "VF1LB", model: "Megane" },
  { prefix: "VF1LM", model: "Megane" },
  { prefix: "VF1AG", model: "Arkana" },
];

function isRenaultWmi(wmi: string): boolean {
  return wmi.startsWith("VF1") || wmi.startsWith("VF2") || wmi.startsWith("GA1");
}

function decodeRenaultModel(vin: string): string | null {
  const wmi = vin.slice(0, 3);
  if (!isRenaultWmi(wmi)) return null;
  return matchLongestPrefix(vin, RENAULT_PREFIX_RULES)?.model ?? null;
}

// ── Fiat — internal platform code at positions 4–6 (indices 3–5) ─────────────
const FIAT_PLATFORM_456: Record<string, string> = {
  "312": "500",
  "169": "Panda",
  "199": "Punto",
  "356": "500X",
  "334": "Tipo",
  "359": "Tipo",
  "250": "Ducato",
  "176": "Punto",
  "225": "Panda",
  "350": "Idea",
  "220": "Scudo",
  "263": "Doblo",
  "280": "Ducato",
  "290": "Ducato",
};

const FIAT_PREFIX_RULES: PrefixRule[] = [
  { prefix: "ZFA312", model: "500" },
  { prefix: "ZFA169", model: "Panda" },
  { prefix: "ZFA199", model: "Punto" },
  { prefix: "ZFA356", model: "500X" },
  { prefix: "ZFA334", model: "Tipo" },
  { prefix: "ZFA359", model: "Tipo" },
  { prefix: "ZFB312", model: "500" },
];

function isFiatWmi(wmi: string): boolean {
  return wmi.startsWith("ZFA") || wmi.startsWith("ZFB") || wmi.startsWith("ZFC");
}

function decodeFiatModel(vin: string): string | null {
  const wmi = vin.slice(0, 3);
  if (!isFiatWmi(wmi)) return null;
  const prefixHit = matchLongestPrefix(vin, FIAT_PREFIX_RULES);
  if (prefixHit) return prefixHit.model;
  if (vin.length < 6) return null;
  return FIAT_PLATFORM_456[vin.slice(3, 6)] ?? null;
}

// ── Peugeot / Citroën — EU ZZZ format, model at position 7 ───────────────────
const PEUGEOT_ZZZ_AT_7: Record<string, string> = {
  A: "208",
  B: "208",
  C: "208",
  D: "308",
  E: "2008",
  F: "308",
  G: "208",
  H: "308",
  J: "308",
  K: "2008",
  L: "508",
  M: "3008",
  N: "5008",
  P: "Partner / Rifter",
  R: "3008",
  S: "508",
  T: "Traveller",
  U: "2008",
  V: "208",
  W: "508",
  X: "408",
  Y: "5008",
};

const CITROEN_ZZZ_AT_7: Record<string, string> = {
  A: "C3",
  B: "C3",
  C: "C3",
  D: "C4",
  E: "C3 Aircross",
  F: "C4",
  G: "C5",
  H: "C4 Cactus",
  J: "C5 Aircross",
  K: "Berlingo",
  L: "C5",
  M: "C5 Aircross",
  N: "C3",
  P: "Berlingo",
  R: "C4",
  S: "C5",
  T: "Spacetourer",
  U: "C4",
  V: "C3",
  W: "C5",
  X: "C4",
  Y: "C5 Aircross",
};

// ── SEAT — EU ZZZ format (VW Group) ──────────────────────────────────────────
const SEAT_ZZZ_AT_7: Record<string, string> = {
  "1": "Ibiza",
  "2": "León",
  "3": "Toledo",
  "5": "Altea",
  "6": "Alhambra",
  "7": "Ateca",
  A: "Ibiza",
  B: "León",
  C: "León",
  D: "Toledo",
  E: "Arona",
  F: "Ateca",
  G: "Tarraco",
  H: "León",
  K: "Ibiza",
  L: "León",
  M: "Mii",
  N: "Arona",
  P: "Ateca",
  S: "Ibiza",
  T: "Tarraco",
  U: "Arona",
  V: "Ibiza",
  W: "León",
  X: "Ateca",
  Y: "Tarraco",
};

function decodeZzzEuropeanModel(
  vin: string,
  wmi: string,
  table: Record<string, string>,
): string | null {
  if (vin.length < 7 || vin.slice(3, 6) !== "ZZZ") return null;
  return table[vin[6]] ?? null;
}

function decodeSeatModel(vin: string): string | null {
  if (!vin.startsWith("VSS")) return null;
  return decodeZzzEuropeanModel(vin, "VSS", SEAT_ZZZ_AT_7);
}

function decodePeugeotModel(vin: string): string | null {
  if (!vin.startsWith("VF3")) return null;
  const zzz = decodeZzzEuropeanModel(vin, "VF3", PEUGEOT_ZZZ_AT_7);
  if (zzz) return zzz;
  return null;
}

function decodeCitroenModel(vin: string): string | null {
  if (!vin.startsWith("VF7")) return null;
  return decodeZzzEuropeanModel(vin, "VF7", CITROEN_ZZZ_AT_7);
}

/** Decode model for Škoda, Renault, Fiat, Peugeot, Citroën, and SEAT. */
export function decodeEuropeanBrandModel(vin: string): string | null {
  const upper = vin.toUpperCase().trim();
  if (upper.length !== 17) return null;

  return (
    decodeSkodaModel(upper)
    ?? decodeRenaultModel(upper)
    ?? decodeFiatModel(upper)
    ?? decodePeugeotModel(upper)
    ?? decodeCitroenModel(upper)
    ?? decodeSeatModel(upper)
  );
}
