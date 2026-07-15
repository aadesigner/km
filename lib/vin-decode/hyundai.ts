/**
 * Hyundai VIN model decode — WMI + platform prefixes + year-gated line codes.
 * Prefer omit over inventing a model when position 4 is shared across eras
 * (e.g. J = early Elantra vs Tucson 2005+).
 *
 * Model line (pos. 4) reference: Wikibooks Hyundai VIN codes.
 */

import { compilePrefixRules, matchLongestPrefix, type PrefixRule } from "./prefix-match";

const YEAR_MAP: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
  J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
  T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
  "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005, "6": 2006,
  "7": 2007, "8": 2008, "9": 2009,
};

function hyundaiModelYear(vin: string): number | null {
  const code = vin[9]?.toUpperCase();
  if (!code) return null;
  const base = YEAR_MAP[code];
  if (base == null) return null;
  const candidate = base < 2010 ? base + 30 : base;
  const currentYear = new Date().getFullYear();
  return candidate <= currentYear + 2 ? candidate : base;
}

/** Documented / high-confidence platform prefixes (longest match wins). */
const HYUNDAI_PLATFORM_RULES: PrefixRule[] = compilePrefixRules([
  // Tucson — Korea / EU / US
  { prefix: "KMHK381", model: "Tucson", chassis: "NX4" },
  { prefix: "KMHK481", model: "Tucson", chassis: "TL" },
  { prefix: "KMHNU81", model: "Tucson", chassis: "NX4" },
  { prefix: "KMHNU8", model: "Tucson", chassis: "NX4" },
  { prefix: "KMHN381", model: "Tucson", chassis: "NX4" },
  // Do not map bare KMHS381 → Tucson (that prefix is Santa Fe Sport in our fixtures).
  { prefix: "KMHS281A", model: "Tucson", chassis: "NX4" },
  { prefix: "KMHS481", model: "Tucson", chassis: "TL" },
  { prefix: "KM8J3", model: "Tucson", chassis: "NX4 US" },
  { prefix: "KM8J2", model: "Tucson", chassis: "NX4 US" },
  { prefix: "KM8JC", model: "Tucson", chassis: "NX4 US" },
  { prefix: "KM8JD", model: "Tucson", chassis: "NX4 US" },
  { prefix: "KM8JE", model: "Tucson", chassis: "NX4 US" },
  { prefix: "KM8JF", model: "Tucson", chassis: "NX4 US" },
  { prefix: "KM8JH", model: "Tucson" },
  { prefix: "KM8JN", model: "Tucson" },
  { prefix: "KM8JT", model: "Tucson" },
  { prefix: "KM8JU", model: "Tucson" },
  { prefix: "5NMJB", model: "Tucson", chassis: "NX4 US" },
  { prefix: "5NMJC", model: "Tucson", chassis: "NX4 US" },
  { prefix: "5NMJE", model: "Tucson", chassis: "NX4 US" },
  { prefix: "5NMJF", model: "Tucson", chassis: "NX4 US" },
  { prefix: "5NMJH", model: "Tucson", chassis: "NX4 US" },
  { prefix: "TMAH381", model: "Tucson", chassis: "NX4 EU" },
  { prefix: "TMAJB81", model: "Tucson", chassis: "NX4 EU" },
  { prefix: "TMAJC81", model: "Tucson", chassis: "NX4 EU" },
  { prefix: "TMAJD81", model: "Tucson", chassis: "NX4 EU" },
  { prefix: "TMAJE81", model: "Tucson", chassis: "NX4 EU" },
  { prefix: "TMAB381", model: "Tucson" },
  { prefix: "TMAD381", model: "Tucson" },
  // Santa Fe
  { prefix: "KMHK251", model: "Santa Fe", chassis: "TM" },
  { prefix: "KMHS381", model: "Santa Fe Sport" },
  { prefix: "KMHSW", model: "Santa Fe Sport" },
  { prefix: "KMHS", model: "Santa Fe Sport" },
  { prefix: "KMHR", model: "Santa Fe" },
  { prefix: "KM8S3", model: "Santa Fe", chassis: "TM US" },
  { prefix: "KM8S2", model: "Santa Fe" },
  { prefix: "5NMS2", model: "Santa Fe", chassis: "TM US" },
  { prefix: "5NMS3", model: "Santa Fe", chassis: "MX5 US" },
  { prefix: "5NMSA", model: "Santa Fe" },
  { prefix: "5NMSB", model: "Santa Fe" },
  // Santa Cruz
  { prefix: "KM8R3", model: "Santa Cruz" },
  { prefix: "KM8RC", model: "Santa Cruz" },
  { prefix: "5NTJC", model: "Santa Cruz" },
  // Kona
  { prefix: "KMHR581", model: "Kona", chassis: "OS" },
  { prefix: "KMHR681", model: "Kona", chassis: "SX2" },
  { prefix: "KMHK581", model: "Kona", chassis: "OS" },
  { prefix: "TMAH581", model: "Kona", chassis: "OS EU" },
  { prefix: "TMAJ681", model: "Kona", chassis: "SX2 EU" },
  { prefix: "KMHH281", model: "Kona", chassis: "SX2" },
  // i30 / i20 / i10 / Bayon
  { prefix: "KMHC751", model: "i30", chassis: "PD" },
  { prefix: "KMHC851", model: "i30", chassis: "GD" },
  { prefix: "TMAJ381", model: "i30", chassis: "PD EU" },
  // Bayon / i20 / i10 use pos.4 B (or plant-specific NLH/TMA), not J — J is Tucson/Nexo era.
  { prefix: "TMAJ281", model: "i20", chassis: "BC3 EU" },
  { prefix: "TMAJ481", model: "i10", chassis: "AC3" },
  { prefix: "NLHBR51", model: "i20", chassis: "TR plant" },
  { prefix: "NLHBW51", model: "Bayon" },
  { prefix: "NLHBV51", model: "i20 N" },
  { prefix: "NLHBB51", model: "Bayon" },
  { prefix: "KMHBB51", model: "Bayon" },
  { prefix: "KMHB381", model: "i20", chassis: "BC3" },
  { prefix: "KMHB281", model: "i20", chassis: "GB" },
  { prefix: "KMHA381", model: "i10", chassis: "AC3" },
  // Elantra / Avante
  { prefix: "KMHL341", model: "IONIQ 5" },
  { prefix: "KMHLW4", model: "IONIQ 5" },
  { prefix: "KMHM341", model: "IONIQ 6" },
  { prefix: "KMHN341", model: "IONIQ 5 N" },
  { prefix: "KMHC281", model: "IONIQ" },
  { prefix: "KMHC381", model: "IONIQ" },
  // Elantra — after IONIQ prefixes so KMHL341 is not stolen
  { prefix: "KMHL241", model: "Elantra", chassis: "CN7" },
  { prefix: "KMHD281", model: "Elantra", chassis: "CN7" },
  { prefix: "KMHD641", model: "Elantra", chassis: "AD" },
  { prefix: "5NPD8", model: "Elantra", chassis: "CN7 US" },
  { prefix: "5NPDH", model: "Elantra", chassis: "CN7 US" },
  { prefix: "5NPET", model: "Elantra" },
  // Sonata
  { prefix: "5NPE2", model: "Sonata", chassis: "DN8" },
  { prefix: "5NPE3", model: "Sonata", chassis: "DN8" },
  { prefix: "KMHE3", model: "Sonata" },
  { prefix: "KMHE2", model: "Sonata" },
  // Palisade / Venue / Nexo
  { prefix: "KM8Y3", model: "Palisade" },
  { prefix: "KMHR281", model: "Venue" },
  { prefix: "KMHJ551", model: "Nexo" },
  { prefix: "KMHN551", model: "Nexo" },
  // Staria / commercial light
  { prefix: "KMFWB", model: "Staria" },
  { prefix: "KMFWA", model: "Staria" },
]);

const EV_ENGINE_CHARS = new Set(["L", "N", "S", "T", "W", "Z"]);

export function isHyundaiVin(vin: string): boolean {
  const wmi = vin.slice(0, 3).toUpperCase();
  return (
    wmi.startsWith("KMH")
    || wmi.startsWith("KMF")
    || wmi === "KM8"
    || wmi.startsWith("TMA")
    || wmi.startsWith("TMC")
    || wmi.startsWith("NLH")
    || wmi.startsWith("NLJ")
    || wmi.startsWith("5NM")
    || wmi.startsWith("5NP")
    || wmi.startsWith("5NT")
    || wmi.startsWith("2HM")
    || wmi.startsWith("9BH")
    || wmi.startsWith("MAL")
    || wmi.startsWith("MF3")
    || wmi.startsWith("LBE")
    || wmi.startsWith("LNY")
  );
}

/**
 * Year-aware model-line fallback when platform prefix is unknown.
 * Only emit models when Wikibooks + WMI/year make the mapping reliable.
 */
function decodeHyundaiLineYear(vin: string, year: number | null): PrefixRule | null {
  if (year == null) return null;
  const wmi = vin.slice(0, 3);
  const line = vin[3];
  const engine = vin[7];
  const prefix = vin.slice(0, 4);

  // North-America MPV WMI — pos.4 J is Tucson (Santa Cruz is KM8R*).
  if (wmi === "KM8" || wmi.startsWith("5NM") || wmi.startsWith("5NT")) {
    if (prefix.startsWith("KM8R") && year >= 2022) {
      return { prefix, model: "Santa Cruz" };
    }
    if (line === "J" && year >= 2005) {
      return { prefix, model: "Tucson", chassis: year >= 2021 ? "NX4" : undefined };
    }
    if (line === "S" && year >= 2001) {
      return { prefix, model: "Santa Fe" };
    }
    if (line === "Y" && year >= 2019) {
      return { prefix, model: "Palisade" };
    }
  }

  // Czech plant — Tucson is the dominant J-line SUV export.
  if (wmi.startsWith("TMA") || wmi.startsWith("TMC")) {
    if (line === "J" && year >= 2015) {
      return { prefix, model: "Tucson", chassis: year >= 2021 ? "NX4 EU" : undefined };
    }
  }

  // Korea passenger WMI — Elantra used J only through ~2000; later J is Tucson/Nexo/Santa Cruz.
  if (wmi.startsWith("KMH")) {
    if (line === "J" && year >= 2005) {
      if (year >= 2019 && engine === "6") {
        return { prefix, model: "Nexo" };
      }
      if (year >= 2019 && year <= 2025 && engine && EV_ENGINE_CHARS.has(engine)) {
        // Hydrogen / EV line sharing J — omit unless platform rule hit.
        return null;
      }
      if (year >= 2022 && (vin[4] === "T" || vin.startsWith("KMHS"))) {
        // Prefer platform rules; don't guess Santa Cruz on KMH.
      }
      return { prefix, model: "Tucson", chassis: year >= 2021 ? "NX4" : year >= 2015 ? "TL" : undefined };
    }
    if (line === "S" && year >= 2001 && year <= 2023) {
      return { prefix, model: "Santa Fe" };
    }
    if (line === "K") {
      if (year >= 2021 && engine && EV_ENGINE_CHARS.has(engine)) {
        return { prefix, model: "IONIQ 5" };
      }
      if (year >= 2018 && year <= 2023) {
        return { prefix, model: "Kona", chassis: "OS" };
      }
    }
    if (line === "M" && year >= 2022 && engine && EV_ENGINE_CHARS.has(engine)) {
      return { prefix, model: "IONIQ 6" };
    }
    if (line === "D" && year >= 2001 && year <= 2020) {
      return { prefix, model: "Elantra" };
    }
    if (line === "L" && year >= 2021) {
      return { prefix, model: "Elantra", chassis: "CN7" };
    }
    if (line === "E" && year >= 2006 && year <= 2019) {
      return { prefix, model: "Sonata" };
    }
    if (line === "R" && year >= 2019) {
      // Venue vs Palisade — omit without platform hit.
      return null;
    }
  }

  // Alabama passenger — Elantra / Sonata.
  if (wmi.startsWith("5NP")) {
    if (line === "D" || line === "E" || line === "L") {
      if (line === "E") return { prefix, model: "Sonata" };
      return { prefix, model: "Elantra" };
    }
  }

  return null;
}

export function matchHyundaiRule(vin: string): PrefixRule | null {
  const u = vin.toUpperCase().trim();
  if (u.length < 10 || !isHyundaiVin(u)) return null;

  const platform = matchLongestPrefix(u, HYUNDAI_PLATFORM_RULES);
  if (platform) return platform;

  return decodeHyundaiLineYear(u, hyundaiModelYear(u));
}

export function decodeHyundaiModel(vin: string): string | null {
  return matchHyundaiRule(vin)?.model ?? null;
}

/**
 * Pos.8 engine labels for Hyundai — letter reuse is extreme across eras.
 * Prefer model/year when available; omit when still ambiguous.
 */
export function decodeHyundaiEngine(
  vin: string,
  model: string | null,
  year: number | null,
): string | null {
  const eng = vin[7]?.toUpperCase();
  if (!eng) return null;
  const m = (model ?? "").toLowerCase();

  if (/ioniq|nexo/.test(m)) {
    const ev: Record<string, string> = {
      L: "Electric — 77.4 kWh (Long Range)",
      N: "Electric (EV)",
      S: "Electric — 58 kWh (Standard Range)",
      T: "Electric — 53 kWh (Standard)",
      W: "Electric — 72.6 kWh",
      Z: "Electric (EV)",
      "6": "Hydrogen fuel cell",
    };
    return ev[eng] ?? null;
  }

  // Shared ICE / HEV codes used on Tucson, Santa Fe, Kona, Santa Cruz, etc.
  if (!/tucson|santa fe|santa cruz|kona|palisade|venue/.test(m)) return null;

  if (eng === "L") return "2.4L Theta II GDI I4";

  const ice: Record<string, string> = {
    A: "2.0L I4 (G4NA)",
    B: "2.0L I4 (Beta II / Theta II)",
    C: "2.4L I4 (Theta II)",
    E: "2.5L Smartstream I4",
    F: "2.0L Nu GDI I4",
    G: "2.4L Theta II GDI I4",
    H: "1.6T Hybrid (T-GDi HEV)",
    K: "2.0L Turbo (G4KH)",
    P: "2.5L Turbo I4",
    R: "1.6T Hybrid (T-GDi HEV)",
    V: "2.0L Diesel TCI",
    "1": "1.6T Hybrid (Smartstream)",
    "4": "2.0L Nu GDI I4",
  };
  // Omit D — reused as 2.7 V6 and diesels across eras.
  if (eng === "D") return null;
  if (eng === "2") {
    if (year != null && year >= 2022) return "1.6T Plug-in Hybrid";
    return "1.6L Gamma turbo I4";
  }
  return ice[eng] ?? null;
}
