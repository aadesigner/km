/**
 * Local VIN decoder — no external API required.
 *
 * Extracts make, year, and country from a 17-character VIN using:
 *   - Position 10 (index 9)  → model year
 *   - Positions 1-3 (WMI)    → world manufacturer identifier → make
 *   - Position 1 (index 0)   → country of origin
 */

import { decodeModelEuropean, hasEuZzzTypeApprovalDescriptor } from "./vinDecoder-european";
import { decodePremiumEuropeanModel } from "./european-premium";
import { decodeEuropeanBrandModel } from "./european-brands";
import { decodeGlobalBrand, resolveGlobalBrandMake, type GlobalBrandDecode } from "./global-brands";
import { isVagWmi } from "./vag-wmi";

// ── Model year encoding (position 10) ────────────────────────────────────────
// Letters I, O, Q, U, Z are never used. Digits 0 is never used.
// Cycles: A-Y (skipping I,O,Q,U,Z) = 1980–2009, then 1-9 = 2001–2009 (overlap),
// then repeats from A=2010, 1=2031, etc.

const YEAR_MAP: Record<string, number> = {
  // 1980-2000
  A: 1980, B: 1981, C: 1982, D: 1983, E: 1984,
  F: 1985, G: 1986, H: 1987, J: 1988, K: 1989,
  L: 1990, M: 1991, N: 1992, P: 1993, R: 1994,
  S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000,
  // 2001-2009
  "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005,
  "6": 2006, "7": 2007, "8": 2008, "9": 2009,
  // 2010-2039 (A-Y cycle repeats, skip I/O/Q/U/Z)
  // A=2010 (already mapped above but overriding for latest cycle isn't correct)
  // The correct approach: each letter/digit appears twice (1980s and 2010s cycle)
  // We pick the most recent plausible year (post-2009 vehicles are more common)
};

// The year encoding repeats every 30 years. We prefer the most recent cycle.
function decodeYear(code: string): number | null {
  const upper = code.toUpperCase();
  const base = YEAR_MAP[upper];
  if (!base) return null;
  // If the base year is in the 1980-2009 range, also check if 30 years later is plausible
  const candidate = base < 2010 ? base + 30 : base;
  // Use heuristic: if candidate > current year + 2, fall back to base
  const currentYear = new Date().getFullYear();
  return candidate <= currentYear + 2 ? candidate : base;
}

// ── Country / region from VIN position 1 ────────────────────────────────────

const COUNTRY_MAP: Record<string, string> = {
  // North America
  "1": "United States", "2": "Canada", "3": "Mexico",
  "4": "United States", "5": "United States",
  // Europe
  S: "United Kingdom", T: "Switzerland", U: "Denmark",
  V: "France/Spain", W: "Germany", X: "Russia",
  Y: "Sweden/Finland", Z: "Italy",
  // Africa
  A: "South Africa", B: "Angola", C: "Benin",
  D: "Egypt", E: "Ethiopia", F: "Ghana", G: "Ivory Coast", H: "Kenya",
  // Asia/Oceania
  J: "Japan", K: "South Korea", L: "China",
  M: "India", N: "Turkey", P: "Philippines", R: "Taiwan",
  // South America
  "6": "Australia/New Zealand", "7": "New Zealand",
  "8": "Argentina", "9": "Brazil",
};

export function decodeCountry(vin: string): string | null {
  return COUNTRY_MAP[vin[0].toUpperCase()] ?? null;
}

// ── WMI → Make (positions 1-3) ───────────────────────────────────────────────
// Ordered longest-match first (3-char WMI beats 2-char prefix)

const WMI_MAP: Record<string, string> = {
  // ── USA ──────────────────────────────────────────────────────────────────
  "1C3": "Chrysler", "1C4": "Chrysler", "1C6": "Ram",
  "1FA": "Ford", "1FB": "Ford", "1FC": "Ford", "1FD": "Ford", "1FM": "Ford",
  "1FT": "Ford",
  "1G1": "Chevrolet", "1G2": "Pontiac", "1G3": "Oldsmobile",
  "1G4": "Buick", "1G6": "Cadillac", "1GC": "Chevrolet",
  "1GD": "GMC", "1GE": "Chevrolet", "1GK": "GMC", "1GT": "GMC",
  "1HG": "Honda", "1HJ": "Honda",
  "1J4": "Jeep", "1J8": "Jeep",
  "1L1": "Lincoln", "1LN": "Lincoln",
  "1ME": "Mercury",
  "1N4": "Nissan", "1N6": "Nissan", "1NX": "Toyota",
  "1P3": "Plymouth",
  "1VW": "Volkswagen",
  "1YV": "Mazda",
  "1ZV": "Mustang",
  "2C3": "Chrysler", "2C4": "Chrysler", "2C8": "Chrysler",
  "2D3": "Dodge", "2D4": "Dodge", "2D8": "Dodge",
  "2FA": "Ford", "2FT": "Ford",
  "2G1": "Chevrolet", "2G4": "Pontiac",
  "2T1": "Toyota", "2T2": "Lexus", "2T3": "Toyota",
  "3FA": "Ford", "3FE": "Ford",
  "3N1": "Nissan", "3N6": "Nissan",
  "3VW": "Volkswagen",
  "4S3": "Subaru", "4S4": "Subaru", "4S6": "Subaru",
  "4T1": "Toyota", "4T3": "Toyota", "4T4": "Toyota",
  "4US": "BMW",
  "4F2": "Mazda", "4F4": "Mazda",
  "5FN": "Honda", "5FR": "Honda", "5J6": "Honda", "5J8": "Honda",
  "5L1": "Lincoln",
  "5NM": "Hyundai", "5NP": "Hyundai", "5N1": "Nissan",
  "5TD": "Toyota", "5TE": "Toyota", "5TF": "Toyota",
  "5UX": "BMW",
  "5YJ": "Tesla", "5YF": "Tesla",
  // ── CANADA ────────────────────────────────────────────────────────────────
  "2HH": "Honda", "2HK": "Honda", "2HM": "Hyundai",
  // ── MEXICO ────────────────────────────────────────────────────────────────
  "3HM": "Honda",
  // ── JAPAN ─────────────────────────────────────────────────────────────────
  "JA3": "Mitsubishi", "JA4": "Mitsubishi", "JAB": "Mitsubishi",
  "JF1": "Subaru", "JF2": "Subaru",
  "JH4": "Acura", "JHM": "Honda",
  "JM1": "Mazda", "JM3": "Mazda", "JMB": "Mitsubishi",
  "JN1": "Infiniti", "JN3": "Nissan", "JN8": "Nissan",
  "JT": "Toyota",  // 2-char prefix catch-all for Toyota Japan
  "JS1": "Suzuki", "JS2": "Suzuki", "JS3": "Suzuki", "JS4": "Suzuki",
  "JSA": "Suzuki", "JST": "Suzuki",
  "2S2": "Suzuki", "2S3": "Suzuki",
  "TSM": "Suzuki",
  // ── SOUTH KOREA ───────────────────────────────────────────────────────────
  "KMH": "Hyundai", "KMF": "Hyundai", "KM8": "Hyundai",
  "KNA": "Kia", "KND": "Kia", "KNJ": "Kia",
  "KNC": "Kia", "KNP": "Kia",
  "KNM": "Renault Samsung",
  "KPT": "SsangYong",
  "KPA": "SsangYong",
  // ── GERMANY ───────────────────────────────────────────────────────────────
  "WAU": "Audi", "WAP": "Porsche",
  "WBA": "BMW", "WBS": "BMW M", "WBR": "BMW", "WBY": "BMW",
  "WDB": "Mercedes-Benz", "WDC": "Mercedes-Benz", "WDD": "Mercedes-Benz",
  "WDF": "Mercedes-Benz", "WME": "Smart",
  "WP0": "Porsche", "WP1": "Porsche",
  "WVW": "Volkswagen", "WVG": "Volkswagen", "WV1": "Volkswagen", "WV2": "Volkswagen",
  "W09": "Porsche",
  // ── UK ────────────────────────────────────────────────────────────────────
  "SAJ": "Jaguar", "SAL": "Land Rover", "SAR": "Rover",
  "SCB": "Bentley", "SCC": "Lotus",
  "SDB": "Aston Martin",
  "SFD": "Alexander Dennis",
  "TRU": "Audi UK",
  // ── SWEDEN ────────────────────────────────────────────────────────────────
  "YV1": "Volvo", "YV4": "Volvo",
  "YS2": "Scania",
  // ── FRANCE ────────────────────────────────────────────────────────────────
  "VF1": "Renault", "VF3": "Peugeot", "VF7": "Citroën",
  "VNK": "Toyota France",
  // ── ITALY ─────────────────────────────────────────────────────────────────
  "ZAM": "Maserati", "ZAP": "Piaggio",
  "ZCG": "Fiat",
  "ZFA": "Fiat", "ZFB": "Fiat",
  "ZFF": "Ferrari",
  "ZHW": "Lamborghini",
  "ZLA": "Lancia",
  // ── SPAIN ─────────────────────────────────────────────────────────────────
  "VSS": "SEAT",
  "VSK": "Nissan Spain",
  // ── NETHERLANDS ───────────────────────────────────────────────────────────
  "XLR": "DAF", "XL9": "Spyker",
  // ── RUSSIA ────────────────────────────────────────────────────────────────
  "XTA": "Lada/AvtoVAZ",
  // ── Dacia (Romania) ───────────────────────────────────────────────────────
  "UU1": "Dacia", "UU6": "Dacia",
  // ── DS Automobiles ────────────────────────────────────────────────────────
  "VR1": "DS Automobiles",
  // ── Polestar / VinFast / Tata / Isuzu ─────────────────────────────────────
  "LPS": "Polestar",
  "RLL": "VinFast", "RLN": "VinFast",
  "MAT": "Tata",
  "JAA": "Isuzu", "JAC": "Isuzu", "JAL": "Isuzu",
  "MP1": "Isuzu", "MPA": "Isuzu", "M3G": "Isuzu",
  "4S1": "Isuzu", "4S2": "Isuzu", "J87": "Isuzu",
  // ── CHINA ─────────────────────────────────────────────────────────────────
  "LFV": "Volkswagen China", "LGX": "Buick China",
  "LSG": "General Motors China",
  "LJC": "Chery", "LVR": "Chery", "LVS": "Ford China",
  "LVG": "Volvo China",
  "LFP": "BYD", "LBV": "BYD", "LC0": "BYD",
  "LSJ": "MG", "LE4": "NIO", "LUC": "Neta",
  "L6T": "Geely", "LGW": "Haval / Great Wall",
  "LNB": "Beijing Hyundai", "LNY": "Beijing Hyundai",
  "LTN": "Changan", "LPA": "Changan",
  "LJ1": "JAC", "LHG": "GAC", "LMG": "GAC Trumpchi",
  "LVH": "Dongfeng Honda", "LDN": "Dongfeng Nissan",
  "LDC": "Dongfeng Peugeot-Citroën", "LBE": "Mercedes-Benz China",
  "LZW": "Wuling / Baojun", "LSV": "SAIC Volkswagen",
  "LSA": "Maxus", "LJD": "Dongfeng Kia",
  "LTE": "JMC", "LLV": "Lifan", "LTV": "Foton",
  "LFM": "FAW Toyota", "LWV": "GAC Mitsubishi",
  // ── INDIA ─────────────────────────────────────────────────────────────────
  "MA1": "Mahindra", "MA3": "Suzuki India",
  "MB8": "Honda India",
  "MEE": "Toyota India",
  "MHF": "Toyota India",
  // ── AUSTRALIA ─────────────────────────────────────────────────────────────
  "6FP": "Ford Australia", "6G1": "Chevrolet Australia",
  "6MM": "Mitsubishi Australia",
  // ── BRAZIL ────────────────────────────────────────────────────────────────
  "9BF": "Ford Brazil", "9BW": "Volkswagen Brazil",
  "9BG": "GM Brazil", "93H": "Honda Brazil",
  // ── UK (continued) ────────────────────────────────────────────────────────
  "SCA": "Rolls-Royce",
  "SCF": "Aston Martin",
  // ── GERMANY (continued) ───────────────────────────────────────────────────
  "WMW": "MINI",
  "W0L": "Opel/Vauxhall",
  // ── ITALY (continued) ─────────────────────────────────────────────────────
  "ZAR": "Alfa Romeo",
  "ZDB": "Alfa Romeo",
  // ── JAPAN – Lexus (override JT catch-all) ─────────────────────────────────
  "JTH": "Lexus",
  "JTJ": "Lexus",
  "JTE": "Toyota",
  "JTK": "Toyota",
  // ── JAPAN – Nissan / Infiniti (continued) ─────────────────────────────────
  "JN4": "Nissan",
  "JN6": "Nissan",
  "JNA": "Infiniti",
  "JNK": "Infiniti",
  // ── SOUTH KOREA (Genesis) ─────────────────────────────────────────────────
  "KMT": "Genesis",
  // ── USA (more brands) ─────────────────────────────────────────────────────
  "19U": "Acura",
  "7FC": "Rivian",
  "5LA": "Lucid",
  "7G2": "Tesla",
  "1B3": "Dodge",
  "1D3": "Dodge",
  "1GY": "Cadillac",
  // ── CZECH REPUBLIC (Škoda) ────────────────────────────────────────────────
  "TMB": "Škoda",
  "TM8": "Škoda",
  // ── SPAIN (SEAT, continued) ───────────────────────────────────────────────
  "VS6": "SEAT",
  "VS7": "SEAT",
  // ── FRANCE (Renault, continued) ───────────────────────────────────────────
  "VF6": "Renault",
  "VF8": "Renault",
  // ── BRAZIL (continued) ────────────────────────────────────────────────────
  "9BH": "Hyundai Brazil",
  "8AP": "Volkswagen Argentina",
  // ── GM KOREA / MEXICO (KL*) ───────────────────────────────────────────────
  "KL7": "Chevrolet",    "KL4": "Chevrolet",    "KL8": "Chevrolet",
  // ── Kia EV lineup (KNB*) ─────────────────────────────────────────────────
  "KNB": "Kia",
  // ── Tesla newer builds (7SA*) ─────────────────────────────────────────────
  "7SA": "Tesla",
  // ── Hyundai commercial / bus ─────────────────────────────────────────────
  "KMJ": "Hyundai Commercial",
  // ── Additional Mercedes-Benz WMIs ────────────────────────────────────────
  "WDH": "Mercedes-Benz",
};

function decodeMake(vin: string, wmiMake: string | null, global?: ReturnType<typeof decodeGlobalBrand>): string | null {
  return resolveGlobalBrandMake(vin, wmiMake, global);
}

function lookupWmiMake(vin: string): string | null {
  const upper = vin.toUpperCase();
  return WMI_MAP[upper.slice(0, 3)] ?? WMI_MAP[upper.slice(0, 2)] ?? null;
}

// ── Model series (positions 1-4 = first 4 VIN chars) ─────────────────────────
// Key = first 4 chars of VIN (WMI[0-2] + vehicle-line char[3])
// Covers the most common models worldwide; null means "unknown series"

const MODEL_MAP_4: Record<string, string> = {
  // ── Toyota ────────────────────────────────────────────────────────────────
  "4T1B": "Camry",      "4T1G": "Camry Hybrid",
  "2T1B": "Corolla",    "2T1G": "Corolla",
  "4T3B": "RAV4",
  "5TDB": "Sienna",     "5TDK": "Sienna",     "5TDY": "Sequoia",
  "5TFR": "Tundra",     "5TFT": "Tundra",     "5TFU": "Tacoma",
  "5TFX": "Tacoma",
  "JTMB": "RAV4",       "JTMC": "Highlander", "JTMG": "4Runner",
  "JTMJ": "Highlander", "JTMH": "Venza",      "JTMA": "Yaris",
  "JTDA": "Prius",      "JTDL": "Prius",      "JTDK": "Prius",
  "JTDE": "Prius",
  // ── Honda ─────────────────────────────────────────────────────────────────
  "1HGC": "Accord",     "1HGA": "Accord",     "1HGE": "Accord",
  "1HGF": "Civic",      "1HGB": "Civic",      "1HGD": "Civic",
  "5FNR": "CR-V",       "5J6R": "CR-V",       "5J6T": "CR-V",
  "5J8Y": "Pilot",      "5J8T": "Pilot",
  "1HGS": "Odyssey",    "5FNRL": "Odyssey",
  "2HGF": "Civic",      "2HGE": "Accord",
  "JHMG": "Accord",     "JHMZ": "Jazz/Fit",   "JHMF": "Civic",
  // ── BMW ───────────────────────────────────────────────────────────────────
  // Series-specific codes live in european-premium.ts (longest-prefix match).
  // Do NOT add WBA1/WBA2/WBA3 here — WBA21=X7, WBA31=X3, etc. would mis-decode.
  "WBS3": "M3",         "WBS5": "M5",         "WBS1": "M2",
  "WBY7": "i3",         "WBY8": "i8",
  "5UXK": "X3",         "5UXZ": "X5",         "5UXW": "X1",
  "5UXU": "X5 M",       "5UXY": "X7",         "5UX3": "X3 M",
  "5YM1": "X1",         "5YM3": "X3 M",
  // ── Mercedes-Benz ─────────────────────────────────────────────────────────
  "WDDC": "C-Class",    "WDDE": "E-Class",    "WDDS": "SLK/SLC",
  "WDDL": "GLE-Class",  "WDDG": "G-Class",    "WDDA": "A-Class",
  "WDDB": "B-Class",    "WDDF": "E-Class",    "WDDN": "GLA-Class",
  "WDDP": "CLA-Class",  "WDDR": "GLC-Class",  "WDDW": "S-Class",
  "WDDX": "SL-Class",   "WDC0": "GLC-Class",  "WDCG": "GLE-Class",
  "WDCJ": "GLC-Class",
  // ── Audi ──────────────────────────────────────────────────────────────────
  "WAUC": "A4/A5",      "WAUE": "A6/A7",      "WAUA": "A8",
  "WAUJ": "A3",         "WAUM": "Q8",         "WAUS": "S/RS Series",
  "WA1L": "Q5",         "WA1B": "Q7",         "WA1A": "Q3",
  "WA1C": "Q5",         "WA1F": "Q5 Sportback",
  // ── Volkswagen ────────────────────────────────────────────────────────────
  "WVWZ": "Golf",       "WVWA": "Jetta",      "WVWB": "Polo",
  "WVWH": "Passat",     "1VWB": "Passat",
  "3VWF": "Jetta",      "3VWC": "Jetta",      "3VWS": "Tiguan",
  "3VW4": "Golf",       "3VW1": "Golf",
  // North American VW assembly plant prefixes (1VW*)
  "1VWZ": "Jetta",      "1VWF": "Golf",       "1VWA": "Eos",
  // ── Porsche ───────────────────────────────────────────────────────────────
  "WP0A": "911",        "WP0B": "Boxster/Cayman",
  "WP0C": "Cayenne",    "WP0Z": "Panamera",   "WP0G": "Taycan",
  "WP1A": "Cayenne",    "WP1Z": "Macan",
  // ── Land Rover / Range Rover ──────────────────────────────────────────────
  "SALR": "Range Rover","SALJ": "Range Rover", "SALM": "Discovery",
  "SALE": "Range Rover Evoque",
  "SALV": "Discovery Sport",
  "SALY": "Defender",   "SALA": "Defender",   "SALW": "Freelander",
  "SALP": "Range Rover Sport",
  // ── Jaguar ────────────────────────────────────────────────────────────────
  "SAJW": "F-Type",     "SAJV": "XF",         "SAJA": "XJ",
  "SAJP": "F-Pace",     "SAJE": "E-Pace",
  // ── Hyundai ───────────────────────────────────────────────────────────────
  "KMHS": "Santa Fe Sport", "KMHR": "Santa Fe",   "KMHD": "Elantra",
  "KMHC": "Elantra",    "KMHF": "Elantra",    "KMHG": "Genesis",
  "KMHH": "i30",        "KMHK": "i10",        "KMHN": "Nexo",
  "KMHP": "Ioniq",
  "KM8J": "Tucson",     "KM8S": "Tucson",     "KM8L": "Tucson",
  "KM8R": "Santa Cruz",
  // ── Kia ───────────────────────────────────────────────────────────────────
  "KNAD": "Sportage",   "KNAG": "Stinger",    "KNAH": "K900",
  "KNAE": "Cadenza",    "KNAF": "Carnival",
  "KNDJ": "Soul",       "KNDL": "Telluride",  "KNDM": "Niro",
  "KNDN": "Sorento",    "KNDP": "Sportage",   "KNDR": "Stonic",
  // ── Tesla ─────────────────────────────────────────────────────────────────
  "5YJ3": "Model 3",    "5YJS": "Model S",    "5YJX": "Model X",
  "7SAY": "Model Y",    "7G2A": "Model Y",
  // ── Volvo ─────────────────────────────────────────────────────────────────
  "YV1A": "S40/S60",    "YV1B": "V40/V60",    "YV1C": "XC60/XC90",
  "YV4A": "XC40",       "YV4B": "XC60",       "YV4C": "XC90",
  // ── Ford ──────────────────────────────────────────────────────────────────
  "1FTF": "F-150",      "1FTE": "F-150",      "1FTW": "F-150",
  "1FMC": "Escape",     "1FMS": "Explorer",   "1FMH": "Edge",
  "1FA6": "Mustang",    "3FA6": "Fusion",
  // ── Chevrolet / GMC ───────────────────────────────────────────────────────
  "1G1F": "Camaro",     "2G1F": "Camaro",
  "1GNS": "Tahoe",      "1GKS": "Yukon",
  "1GCH": "Silverado",  "1GCP": "Silverado",  "2GCH": "Silverado",
  "1GTN": "Sierra",     "1GTG": "Sierra",
  // ── Nissan / Infiniti ─────────────────────────────────────────────────────
  "1N4A": "Altima",     "1N4B": "Maxima",     "1N6A": "Titan/Frontier",
  "5N1A": "Pathfinder", "5N1D": "Armada",     "5N1Z": "Murano",
  "JN1A": "Infiniti",
  // ── Mazda ─────────────────────────────────────────────────────────────────
  "JM1B": "Mazda3",     "JM3K": "CX-5",       "JM3T": "CX-9",
  // ── Subaru ────────────────────────────────────────────────────────────────
  "JF1V": "WRX/STI",    "JF2S": "Forester",   "JF2T": "Outback",
  "4S3B": "Impreza",    "4S4B": "Outback",
  // ── Mitsubishi ────────────────────────────────────────────────────────────
  "JA3A": "Eclipse",    "JA4A": "Outlander",  "JA4J": "Eclipse Cross",
  // ── Lexus ─────────────────────────────────────────────────────────────────
  "2T2B": "RX",         "2T2H": "NX",         "JTJG": "LX",
  "JTJB": "GX",         "JTJY": "RX",
  // ── Lexus Japan (JTH* / JTJ*) ────────────────────────────────────────────
  "JTHB": "ES 300h",    "JTHD": "LS 600h",    "JTHG": "IS 300/350",
  "JTHJ": "RX 450h",    "JTHK": "NX 300h",    "JTHL": "CT 200h",
  "JTHM": "GS 450h",    "JTHN": "RZ 450e",    "JTHE": "IS 500",
  // ── Nissan Japan (JN1* / JN8*) ───────────────────────────────────────────
  "JN1B": "Leaf",        "JN1C": "Z / Fairlady Z",
  "JN8A": "X-Trail",     "JN8B": "Patrol",     "JN8D": "Qashqai",
  "JN8E": "Murano",      "JN8G": "Juke",       "JN8J": "Armada",
  // ── Infiniti (JNA* / JNK*) ───────────────────────────────────────────────
  "JNKA": "Q70 / M",     "JNKB": "QX80",       "JNKC": "Q50",
  "JNKD": "QX70 / FX",   "JNKN": "Q60",
  "JNAA": "QX60",        "JNAB": "Q30 / QX30",
  // ── Acura USA (JH4* / 19U*) ──────────────────────────────────────────────
  "JH4D": "Integra",     "JH4K": "MDX",        "JH4T": "TL",
  "JH4V": "RL",          "JH4Y": "NSX",
  "19UY": "RDX",         "19UA": "ILX",        "19UB": "TLX",
  "19UC": "MDX",         "19UF": "ZDX",
  // ── More Mazda ────────────────────────────────────────────────────────────
  "JM1G": "MX-5 Miata",  "JM1N": "Mazda6",     "JM3C": "CX-3",
  "JM3R": "CX-30",       "JM3D": "CX-50",
  // ── More Subaru ───────────────────────────────────────────────────────────
  "JF1S": "Impreza",     "JF1B": "BRZ",        "JF2A": "Crosstrek",
  "JF2Z": "Ascent",      "JF2G": "Legacy",
  // ── More Mitsubishi ───────────────────────────────────────────────────────
  "JA3C": "Galant",      "JA4D": "Pajero Sport","JA4W": "ASX",
  "JMBA": "Outlander PHEV", "JMBZ": "Eclipse Cross PHEV",
  // ── More Nissan USA ───────────────────────────────────────────────────────
  "1N4C": "Altima",      "5N1B": "Rogue",       "5N1R": "Xterra",
  "5N1E": "Murano",      "3N6C": "NV Cargo",
  // ── More Toyota USA ───────────────────────────────────────────────────────
  "2T3J": "RAV4",        "4T1C": "Camry",       "5TDZ": "Sequoia",
  // ── MINI ──────────────────────────────────────────────────────────────────
  "WMWZ": "Cooper",      "WMWX": "Clubman",     "WMW4": "Countryman",
  "WMWS": "Paceman",     "WMW5": "Cooper S",    "WMW6": "John Cooper Works",
  "WMWN": "Convertible", "WMW3": "Cabrio",
  // ── Alfa Romeo (ZAR*) ─────────────────────────────────────────────────────
  "ZARB": "Giulia",      "ZARE": "Stelvio",     "ZARG": "Giulietta",
  "ZARJ": "Tonale",      "ZARR": "Brera",       "ZARS": "Spider",
  // ── Genesis (KMT*) ────────────────────────────────────────────────────────
  "KMTG": "GV80",        "KMTH": "GV70",        "KMTJ": "G90",
  "KMTF": "G70",         "KMTK": "GV60",        "KMTE": "G80",
  // ── Chrysler / Dodge / Jeep / RAM ─────────────────────────────────────────
  "1C3C": "Chrysler 300","2C3C": "Chrysler 300",
  "1C4P": "Jeep Wrangler","1C4R": "Jeep Grand Cherokee",
  "1C4H": "Dodge Durango","1C4B": "Chrysler Pacifica",
  "1C4J": "Jeep Compass", "1C4N": "Jeep Renegade",
  "1C6R": "Ram 1500",     "1C6T": "Ram 2500",   "3C6T": "Ram 2500",
  // ── More Ford USA ─────────────────────────────────────────────────────────
  "1FMJ": "Explorer",    "1FMU": "Escape",      "1FT8": "Super Duty",
  "1FMK": "Edge",        "1FME": "Expedition",  "1FTR": "Ranger",
  // ── Cadillac (1GY*) ───────────────────────────────────────────────────────
  "1GYS": "Escalade",    "1GYA": "ATS",         "1GYB": "CTS",
  "1GYC": "CT6",         "1GYD": "XT5",         "1GYE": "XT6",
  "1GYF": "CT5",
  // ── Lincoln ───────────────────────────────────────────────────────────────
  "1LNH": "Navigator",   "5LMJ": "Navigator",   "5LMF": "MKZ / Zephyr",
  // ── Rivian (7FC*) ─────────────────────────────────────────────────────────
  "7FCA": "R1T",         "7FCC": "R1S",         "7FCB": "EDV 700",
  // ── More Renault (VF1*) ───────────────────────────────────────────────────
  "VF1J": "Clio",        "VF1L": "Megane",      "VF1K": "Captur",
  "VF1R": "Zoe (EV)",    "VF1E": "Kadjar",      "VF1S": "Arkana",
  "VF1B": "Clio",        "VF1M": "Megane",      "VF1H": "Captur",
  // ── More Peugeot (VF3*) ───────────────────────────────────────────────────
  "VF3A": "208",          "VF3D": "308",         "VF3M": "3008",
  "VF3N": "5008",         "VF3E": "2008",
  // ── More Citroën (VF7*) ───────────────────────────────────────────────────
  "VF7A": "C3",           "VF7C": "C5",          "VF7U": "C4",
  "VF7B": "Berlingo",     "VF7R": "C3 Aircross",
  // ── Opel / Vauxhall (W0L*) ────────────────────────────────────────────────
  "W0LS": "Astra",        "W0LB": "Corsa",       "W0LT": "Insignia",
  "W0LM": "Mokka",        "W0LN": "Grandland",
  // ── Škoda (TMB*) — 4-char fallbacks; precise decode in european-brands.ts ───
  "TMBA": "Octavia",      "TMBJ": "Fabia",       "TMBE": "Superb",
  "TMBG": "Kodiaq",       "TMBK": "Kamiq",       "TMBZ": "Karoq",
  "TMBL": "Karoq",        "TMBD": "Kodiaq",      "TMBR": "Scala",
  // ── SEAT (VS6* / VS7*) ────────────────────────────────────────────────────
  "VS6A": "Ibiza",        "VS6K": "Leon",        "VS7A": "Arona",
  "VS7B": "Ateca",        "VS7T": "Tarraco",
  // ── Ferrari (ZFF*) ────────────────────────────────────────────────────────
  "ZFFA": "488 GTB",      "ZFFB": "F8 Tributo",  "ZFFC": "Roma",
  "ZFFD": "SF90 Stradale","ZFFE": "Portofino",   "ZFFG": "296 GTB",
  "ZFFH": "Purosangue",
  // ── Lamborghini (ZHW*) ────────────────────────────────────────────────────
  "ZHWB": "Urus",         "ZHWC": "Huracán",     "ZHWD": "Aventador",
  "ZHWE": "Revuelto",
  // ── Maserati (ZAM*) ───────────────────────────────────────────────────────
  "ZAMA": "Ghibli",       "ZAMB": "Quattroporte","ZAMC": "Levante",
  "ZAMD": "GranTurismo",  "ZAME": "Grecale",
  // ── Rolls-Royce (SCA*) ────────────────────────────────────────────────────
  "SCAA": "Ghost",        "SCAB": "Phantom",     "SCAC": "Cullinan",
  "SCAD": "Wraith",       "SCAF": "Spectre",
  // ── Aston Martin (SCF*) ───────────────────────────────────────────────────
  "SCFB": "DB11",         "SCFC": "Vantage",     "SCFD": "DBS",
  "SCFE": "DBX",          "SCFF": "DB12",
  // ── Bentley (SCB*) ────────────────────────────────────────────────────────
  "SCBB": "Continental GT","SCBC": "Bentayga",   "SCBD": "Flying Spur",
  "SCBE": "Continental GTC",
  // ── Hyundai IONIQ EV series ───────────────────────────────────────────────
  "KMHL": "IONIQ 5",     "KMHM": "IONIQ 6",     "KMHQ": "IONIQ 5 N",
  // ── Kia EV series ─────────────────────────────────────────────────────────
  "KNDC": "EV6",         "KNBC": "EV9",         "KNDE": "Niro EV",
  "KNDF": "Sportage Hybrid",
  // ── Ford: Bronco, Maverick, Mach-E ────────────────────────────────────────
  "1FM5": "Bronco",      "1FMD": "Bronco Sport","3FTT": "Maverick",
  "3FMT": "Mach-E",      "1FMF": "Mach-E",
  // ── Chevrolet Equinox / Trailblazer / Trax (GM Korea) ────────────────────
  "1GNJ": "Equinox",     "2GNA": "Equinox",     "2GNF": "Equinox",
  "KL7J": "Trailblazer", "KL7C": "Trax",        "KL4C": "Trax",
  "KL8J": "Blazer",
  // ── Tesla newer Fremont/Berlin WMIs ──────────────────────────────────────
  "7SA3": "Model 3",     "7SA2": "Model S",
  // ── Toyota bZ4X ───────────────────────────────────────────────────────────
  "JTME": "bZ4X",
  // ── Genesis GV70e / GV60 (EV) ────────────────────────────────────────────
  "KMTN": "GV70e",
  // ── Dacia (4-char fallbacks; precise decode in global-brands.ts) ──────────
  "UU1D": "Duster",     "UU1B": "Sandero",    "UU1H": "Logan",
  "UU1J": "Jogger",     "UU1S": "Spring",
};

// Longer-prefix overrides checked before MODEL_MAP_4 (longest match wins).
// Keys can be 5–7 chars. Add entries here whenever a 4-char prefix is ambiguous.
const MODEL_OVERRIDES: Record<string, string> = {
  // Mercedes-Benz CLS (C218/C257) — pos-5 J disambiguates from WDDL→GLE
  "WDDLJ":   "CLS-Class",
  // Mercedes-Benz chassis codes (positions 4–6, e.g. WDD213 = E-Class W213)
  "WDD213":  "E-Class",
  "WDD205":  "C-Class",
  "WDD222":  "S-Class",
  "WDD223":  "S-Class",
  "WDD166":  "GLE-Class",
  "WDD253":  "GLC-Class",
  "WDD247":  "GLA-Class",
  "WDD463":  "G-Class",
  "WDD167":  "GLS-Class",
  "WDD177":  "A-Class",
  "WDD118":  "CLA-Class",
  // Honda Japan — CM chassis = Accord (7th gen, e.g. JHMCM56557C404453)
  "JHMCM":   "Accord",
  "JHMC":    "Accord",
  "JHME":    "Civic",
  "JHMF":    "Civic",
};

function decodeModel(vin: string, global?: GlobalBrandDecode): string | null {
  const upper = vin.toUpperCase();

  const premium = decodePremiumEuropeanModel(upper);
  if (premium) return premium;

  for (const len of [7, 6, 5]) {
    const hit = MODEL_OVERRIDES[upper.slice(0, len)];
    if (hit) return hit;
  }
  if (global?.model) return global.model;
  if (!global) {
    const discovered = decodeGlobalBrand(upper).model;
    if (discovered) return discovered;
  }
  const euBrand = decodeEuropeanBrandModel(upper);
  if (euBrand) return euBrand;
  // EU VAG/Audi ZZZ-format: model code at position 7 — before generic 4-char map
  if (upper.length >= 7 && upper.slice(3, 6) === "ZZZ") {
    const wmi = upper.slice(0, 3);
    if (isVagWmi(wmi) || wmi.startsWith("WAU") || wmi.startsWith("TRU")) {
      const eu = decodeModelEuropean(upper);
      if (eu) return eu;
    }
  }
  const fromFour = MODEL_MAP_4[upper.slice(0, 4)];
  if (fromFour) return fromFour;
  return null;
}

// ── Engine code (position 8, index 7) — manufacturer-specific ─────────────────
// Key = WMI prefix (3-char or 2-char), value = map of engine-char → description

const ENGINE_CODE_MAP: Record<string, Record<string, string>> = {
  // Toyota Japan (JT* prefix)
  JT: {
    A: "1.5L I4 (1NZ/1ZR)", B: "1.8L I4 (2ZR-FE)", D: "2.0L Diesel (1CD)",
    E: "1.8L I4 Hybrid (1ZZ-HSD)", G: "2.0L I4 (3ZR-FAE)", H: "2.5L I4 Hybrid",
    N: "2.0T I4 Turbo", P: "2.4L I4 (2AZ-FE)", U: "2.5L I4 (A25A-FXS)",
    Z: "Electric (e-TNGA)", R: "3.5L V6 (2GR-FXE)",
  },
  // Honda Japan (JHM*)
  JHM: {
    A: "1.3L I4 (L13A)", B: "1.5L I4 (L15B)", C: "1.5T VTEC Turbo (L15C)",
    D: "2.0L DOHC i-VTEC (K20)", F: "2.4L I4 (K24)", G: "3.0L V6 (J30)",
    K: "2.0T DOHC Turbo (K20C)", L: "3.5L V6 (J35)",
  },
  // BMW Germany (WBA)
  WBA: {
    B: "2.0L I4 TwinPower", C: "3.0L I6 TwinPower", D: "2.0L Diesel (B47)",
    E: "3.0L Diesel (B57)", F: "1.5L I3 Hybrid", N: "4.4L V8 Biturbo (S63)",
    S: "Electric (BEV)", U: "Hybrid (PHEV)",
  },
  // BMW USA (5UX* prefix)
  "5UX": {
    B: "2.0L I4 TwinPower", C: "3.0L I6 TwinPower", D: "2.0L Diesel",
    N: "4.4L V8 Biturbo", J: "4.4L V8 Competition",
  },
  // Mercedes-Benz (WDD*)
  WDD: {
    A: "1.33L I4 Turbo (M282)", C: "2.0L I4 Turbo (M264)",
    D: "1.5L Diesel (OM608)", E: "2.0L Diesel (OM654)",
    G: "3.0L I6 Turbo (M256)", J: "4.0L V8 Biturbo (M177)",
    K: "AMG 4.0L V8 (M177 DE 40)", N: "EQ Electric",
  },
  // Audi (WAU*)
  WAU: {
    A: "1.8T TFSI I4", B: "2.0T TFSI I4", C: "3.0 TFSI V6 Supercharged",
    D: "2.0 TDI Diesel", F: "3.2 FSI V6", G: "2.7T Biturbo V6",
    H: "3.0 TDI Diesel", N: "4.2L FSI V8", S: "EV (e-tron)",
  },
  // Volkswagen Germany (WVW*)
  WVW: {
    A: "1.6L MPI I4", B: "1.8T TSI I4", C: "2.0T TSI I4",
    D: "2.0 TDI Diesel", E: "1.4 TSI I4", H: "3.6L VR6",
    K: "1.0 TSI I3", M: "1.5 eTSI Mild Hybrid",
  },
  // Porsche (WP0*)
  WP0: {
    A: "3.0L Flat-6 Biturbo", B: "2.5L Flat-4 Turbo", C: "3.0L V6 Turbo",
    D: "3.0L Diesel V6", G: "2.9L Biturbo V6", T: "Taycan Electric",
  },
  // Hyundai Korea (KMH*)
  KMH: {
    A: "1.4L I4 (G4LC)", B: "1.6L I4 (G4FG)", C: "2.0L I4 (G4NA/G4NC)",
    D: "2.4L I4 (G4KJ)", E: "1.6L CRDi Diesel", F: "3.3L V6 (G6DP)",
    G: "3.8L V6 Lambda", H: "1.6L I4 Hybrid (G4FJ)", K: "2.0L Turbo (G4KH)",
    L: "Electric — 77.4 kWh (IONIQ 5 / IONIQ 6 Long Range)",
    N: "Electric (EV)", P: "2.5L Turbo I4",
    R: "1.6T I4 Hybrid (T-GDi)",
    S: "Electric — 58 kWh (IONIQ 5 Standard Range)",
    T: "Electric — 53 kWh (IONIQ 6 Standard)",
    W: "Electric — 72.6 kWh (IONIQ 5)",
  },
  // Kia Korea (KNA* / KND*)
  KNA: {
    A: "1.6L I4 (G4FG)", B: "2.0L I4 (G4NA)", C: "2.4L I4 (G4KJ)",
    D: "2.0L Diesel (D4FD)", E: "3.3L V6 (G6DP)", N: "EV",
    P: "1.6T I4 Hybrid", R: "1.6T I4 Turbo",
  },
  KND: {
    A: "1.6L I4 (G4FJ)", B: "2.0L I4 (G4NA)", C: "2.4L I4", D: "1.6L CRDi Diesel",
    E: "3.3L V6 Biturbo (Lambda II TCI)", H: "1.6L I4 Hybrid",
    L: "Electric — 77.4 kWh (EV6 / EV9 Long Range)",
    N: "EV (Niro EV)", P: "1.6T I4 Hybrid",
    R: "Electric — 99.8 kWh (EV9)",
    S: "Electric — 58 kWh (EV6 Standard Range)",
  },
  // Genesis Korea (KMT*)
  KMT: {
    A: "2.5T I4 (G4KJ TCI)", B: "3.5T V6 (Lambda II TCI)",
    C: "3.5L V6 (G6DP)", E: "2.0T I4 (T-GDi)",
    G: "2.2L CRDi Diesel", N: "Electric (GV60 / GV70e)",
    P: "2.5T I4 AWD", R: "3.5T V6 AWD",
  },
  // Honda USA (1HG* / 5FN*)
  "1HG": {
    A: "1.5T VTEC Turbo", B: "2.0L DOHC i-VTEC (K20)", C: "1.5T (L15B7)",
    D: "2.4L I4 (K24)", F: "1.5L I4 (L15B)", R: "3.5L V6 (J35Y)",
  },
  "5FN": {
    A: "1.5T VTEC Turbo", L: "2.0T DOHC (K20C1)", R: "1.5T (L15BE)",
    Y: "3.5L V6 (J35Y5)",
  },
  // Ford USA (1FT* / 1FA*)
  "1FT": {
    E: "2.7L V6 EcoBoost", F: "3.5L V6 EcoBoost", G: "5.0L Coyote V8",
    H: "6.2L V8 (Boss)", W: "3.5L HO EcoBoost", X: "2.3L EcoBoost I4",
    K: "3.0L Powerstroke Diesel V6",
  },
  "1FA": { G: "5.0L Coyote V8", H: "2.3L EcoBoost I4", P: "5.2L Voodoo V8" },
  // Chevrolet (1GC*)
  "1GC": {
    C: "4.3L EcoTec3 V6", E: "5.3L EcoTec3 V8", F: "6.2L EcoTec3 V8",
    H: "6.6L Duramax Diesel V8", K: "2.7T Turbo I4",
  },
  // Tesla (5YJ*)
  "5YJ": { E: "Electric (Long Range)", F: "Electric (Standard Range)", P: "Electric (Performance)" },
  // Volvo Sweden (YV*)
  YV1: { A: "2.0T I4 (Drive-E)", B: "2.0T I4 (Drive-E)", D: "2.0L Diesel", H: "Hybrid (T8 PHEV)" },
  YV4: { A: "2.0T I4 (Drive-E)", B: "2.0T I4", D: "2.0L Diesel", H: "Hybrid (T8 PHEV)" },
  // Land Rover / Range Rover (SAL*)
  SAL: {
    B: "2.0L I4 Ingenium Diesel", C: "3.0L I6 Ingenium", D: "3.0L I6 Diesel (TD6)",
    G: "3.0L I6 Mild Hybrid", L: "5.0L V8 Supercharged", M: "2.0T I4 Ingenium",
  },
  // Jaguar (SAJ*)
  SAJ: {
    A: "2.0L I4 Ingenium", C: "3.0L I6", D: "5.0L V8 Supercharged",
    G: "2.0L I4 Diesel", K: "2.0T I4 Petrol",
  },
  // Nissan Japan (JN1* / JN8*)
  JN1: {
    A: "2.5L V6 (VQ25DE)", B: "3.5L V6 (VQ35DE)", C: "2.0T I4 (MR20DDT)",
    D: "2.0L I4 (MR20DE)", E: "3.7L V6 (VQ37VHR)", H: "Electric (Leaf 40/62 kWh)",
    K: "2.5L I4 (QR25DE)", L: "1.6L I4 Turbo (MR16DDT)", P: "3.0T V6 Biturbo (VR30)",
    R: "2.0T I4 (KR20DDT)", T: "1.5L I4 (HR15)", Z: "Hybrid",
  },
  JN8: {
    A: "3.3L V6 (VQ33DE)", B: "5.6L V8 (VK56VD)", D: "2.5L I4 (QR25DE)",
    E: "3.5L V6 (VQ35DE)", G: "1.6L I4 Turbo (MR16DDT)", J: "3.0T V6 Biturbo",
    Z: "2.0L Diesel (YD20DDT)",
  },
  // Nissan USA (1N4* / 5N1* / 3N1*)
  "1N4": {
    A: "2.5L I4 (QR25DE)", B: "3.5L V6 (VQ35DE)", C: "2.0L I4 (MR20DE)",
    D: "1.6L I4 Turbo (MR16DDT)", L: "2.5L I4 Hybrid (HR25DE)", Z: "Hybrid (e-POWER)",
  },
  "5N1": {
    A: "3.5L V6 (VQ35DE)", B: "5.6L V8 (VK56VD)", D: "3.5L V6 (VQ35)",
    E: "2.5L I4 Hybrid", N: "1.5T I4 (KR15DDT)", Z: "3.5L V6 (VQ35)",
  },
  "3N1": {
    A: "1.6L I4 (HR16DE)", B: "2.0L I4 (MR20DE)", C: "1.6L I4 (GA16DE)",
    D: "1.8L I4 (MR18DE)",
  },
  // Infiniti Japan (JNK* / JNA*)
  JNK: {
    A: "2.5L V6 (VQ25DE)", B: "3.0T V6 Biturbo (VR30DDTT)", C: "3.7L V6 (VQ37VHR)",
    D: "5.0L V8 (VK50VE)", E: "3.5L V6 Hybrid (VQ35)", N: "Electric (Q Inspire)",
    R: "3.5L V6 (VQ35HR)", S: "5.6L V8 (VK56VD)",
  },
  JNA: {
    A: "3.5L V6 (VQ35DE)", B: "2.5L V6 (VQ25DE)", C: "2.5L I4 Hybrid",
    D: "3.7L V6 (VQ37VHR)", N: "Electric", R: "2.0T I4",
  },
  // Toyota USA (4T* / 5TF* / 5TD* / 2T*)
  "4T1": {
    B: "2.5L I4 (A25A-FXS Hybrid)", C: "3.5L V6 (2GR-FXS)", G: "2.5L I4 Hybrid",
    K: "3.5L V6 (2GR-FE)", N: "2.5L I4 Hybrid (A25A-FXS)", R: "2.4T I4 (T24A)",
  },
  "5TF": {
    A: "4.6L V8 (1UR-FE)", E: "5.7L V8 (3UR-FE)", F: "2.7L I4 (1TR-FE)",
    M: "4.0L V6 (1GR-FE)", R: "3.5L V6 (2GR-FE)", S: "2.4T I4 (T24A-FTS)",
  },
  "5TD": {
    A: "3.5L V6 (2GR-FE)", B: "2.7L I4 (2TR-FE)", K: "3.5L V6 Hybrid (2GR-FXE)",
    Y: "3.4L V6 (2GR-FXS)", Z: "3.5L V6 Hybrid",
  },
  "2T1": {
    A: "1.8L I4 (2ZR-FE)", B: "1.8L I4 Hybrid (2ZR-FXE)", R: "2.0L I4 (M20A-FXS)",
  },
  // Mazda Japan (JM1* / JM3*)
  JM1: {
    B: "2.0L I4 Skyactiv-G (PE-VPS)", D: "1.5L I4 Skyactiv-G (P5-VP)",
    F: "2.5L I4 Skyactiv-G (PY-VPTS)", G: "1.3L Rotary (13B-MSP)",
    H: "2.5T I4 Skyactiv-G Turbo (PY-VPTS)", K: "1.5L Skyactiv-D Diesel",
    L: "2.2L Skyactiv-D (SH-VPTS)", M: "2.0L Skyactiv-G",
    N: "2.5L Skyactiv-G", P: "Skyactiv-X / e-Skyactiv Hybrid",
  },
  JM3: {
    B: "2.5L I4 Skyactiv-G (PY-VPTS)", D: "2.0L I4 (PE-VPS)",
    F: "2.5T I4 Skyactiv-G Turbo", L: "2.2L Skyactiv-D Diesel",
    M: "2.5L Skyactiv-G", R: "2.5T I4 Turbo",
  },
  // Subaru Japan/USA (JF* / 4S*)
  JF1: {
    A: "2.5L H4 (EJ253)", B: "2.5T H4 (EJ255/EJ257)",
    D: "2.0L H4 Diesel (EE20)", E: "2.0L H4 (FB20)",
    F: "2.5L H4 (EJ25)", G: "2.5L H4 (FB25)",
    H: "Hybrid / PHEV", K: "1.6L H4 (FB16)", L: "2.0T H4 (FA20F)",
    M: "2.4T H4 (FA24F)",
  },
  JF2: {
    B: "2.5L H4 (FB25)", C: "2.0L H4 Diesel (EE20)", D: "2.0T H4 (FB20DIT)",
    E: "2.5L H4 (EJ253)", F: "3.0L H6 (EZ30)", G: "2.5T H4 (EJ257)",
    H: "2.5L H4 Hybrid", M: "2.5L H4 (EJ25)", S: "3.6L H6 (EZ36)",
    T: "2.5T H4 (EJ257 STI)", X: "2.4T H4 (FA24F)",
  },
  "4S3": { A: "2.5L H4 (EJ253)", B: "2.5T H4 (EJ257)", E: "2.0T H4 (FA20F)", G: "2.5L H4 (FB25)" },
  "4S4": { B: "2.5L H4 (FB25)", T: "3.6L H6 (EZ36D)", X: "2.4T H4 (FA24F)" },
  // Mitsubishi Japan (JA3* / JA4*)
  "JA3": {
    A: "2.0T I4 (4G63 EVO Turbo)", B: "1.5L I4 (4A91)", C: "1.8L I4 (4B10)",
    D: "2.4L I4 (4B12)", E: "3.0L V6 (6G72)", F: "1.6L I4 (4G18)",
    G: "2.0L I4 (4G63)", N: "Electric (i-MiEV)", T: "1.2L I3 (3A92)",
  },
  "JA4": {
    A: "2.4L I4 (4B12)", B: "2.0L I4 PHEV (4B11)", C: "3.0L V6 (6G72)",
    D: "1.5T I4 (4B40)", E: "2.2L Diesel (4N14)", M: "2.4L I4 PHEV (4N14+motor)",
    W: "2.0L I4 (4B11)", X: "2.0T I4 (4G63T)",
  },
  // Acura USA (JH4* / 19U*)
  "JH4": {
    A: "2.0L I4 (K20Z3)", B: "3.2L V6 (J32A3)", C: "3.5L V6 (J35Y)",
    D: "3.7L V6 (J37A4)", K: "3.5L V6 PHEV Sport Hybrid", L: "2.0T I4 PHEV",
    T: "3.2L V6 (J32A2)",
  },
  "19U": {
    A: "1.5T I4 (L15B7)", B: "2.0T I4 (K20C4)", C: "3.5L V6 (J35Y)",
    D: "2.5L V6 Hybrid", E: "3.0T V6 Biturbo (J30A)",
    Y: "2.0T I4 (K20C1)",
  },
  // Lexus Japan (JTH* / JTJ*)
  JTH: {
    A: "3.5L V6 Hybrid (2GR-FXS)", B: "2.5L I4 Hybrid (A25A-FXS)",
    C: "2.5L I4 Hybrid", D: "3.5L V6 (2GR-FKS)", E: "5.0L V8 (2UR-GSE)",
    G: "3.5L V6 Hybrid (2GR-FXS)", H: "3.4L V6 Biturbo (V35A-FTS)",
    K: "Electric (RZ 450e)", L: "3.5L V6 Hybrid",
  },
  JTJ: {
    B: "4.6L V8 (1UR-FE)", C: "5.7L V8 (3UR-FE)", D: "4.5L V8 Diesel (V8D)",
    E: "3.5L V6 (2GR-FKS)", F: "4.0L V8 (1UR-FSE)", G: "3.4L V6 Biturbo (V35A)",
  },
  // MINI (WMW*)
  WMW: {
    A: "1.5L I3 TwinPower Turbo (B38)", B: "2.0L I4 TwinPower (B48)",
    C: "2.0T I4 JCW (B48A)", D: "2.0L Diesel (B47)",
    E: "Electric (BEV)", N: "1.4L I4 (N14)", S: "2.0T JCW (B48)",
  },
  // Alfa Romeo (ZAR*)
  ZAR: {
    A: "1.4T MultiAir (940A2)", B: "2.0T I4 GME (AR55205)",
    C: "2.2L Diesel MultiJet (AR78410)", D: "2.9L V6 Biturbo QV (AR B.00)",
    F: "1.5L I4 MHEV (AR50403)", G: "2.0T I4 PHEV", K: "2.0T I4 Tonale",
    L: "1.3T PHEV (AR1330)",
  },
  // Rolls-Royce (SCA*)
  SCA: {
    A: "6.6L V12 Biturbo (N74B66)", C: "6.75L V8 Biturbo",
    E: "Electric (Spectre BEV)", F: "6.6L V12 Twin-Turbo",
  },
  // Aston Martin (SCF*)
  SCF: {
    B: "4.0L V8 Biturbo (AMG M177)", C: "5.2L V12 Biturbo (AM28)",
    D: "3.0L I6 PHEV (Valhalla)", E: "5.2L V12 Twin-Turbo (AM29)",
  },
  // Fiat Italy (ZFA*)
  ZFA: {
    A: "1.2L I4 (169A4)", B: "1.4L I4 (312A1)", C: "0.9L I2 TwinAir (312A2)",
    D: "1.3L I4 Multijet Diesel (199A2)", E: "1.6L I4 Multijet",
    F: "1.4L I4 Turbo Abarth (312A1.000)",
  },
  // Renault France (VF1*)
  VF1: {
    A: "1.0L I3 TCe 90 (H4D)", B: "1.3L I4 TCe (H5H)", C: "1.5L dCi Diesel (K9K)",
    D: "1.6L I4 (K4M)", E: "1.2L I4 TCe (H5F)", F: "1.8L I4 RS (F4RT)",
    R: "Electric (Zoe Z.E. 50)", S: "2.0L I4 (F4R)",
  },
  // Peugeot France (VF3*)
  VF3: {
    A: "1.2L I3 PureTech (HMZ)", B: "1.6L I4 THP", C: "1.5L BlueHDi Diesel",
    D: "2.0L BlueHDi Diesel (DW10C)", E: "Electric (BEV) e-208/e-2008",
    H: "1.6L THP 200 GTi", M: "1.6L BlueHDi 120",
  },
  // Citroën France (VF7*)
  VF7: {
    A: "1.2L I3 PureTech (HMZ)", B: "1.6L I4 THP",
    C: "1.5L BlueHDi Diesel (DV5)", D: "2.0L BlueHDi (DW10F)",
    E: "Electric (ë-C4 / ë-Berlingo)", U: "1.4L I4 (TU3A)",
  },
};

// ── Plant code (position 11, index 10) — manufacturer-specific ────────────────
// Each entry is { city, country } so they can be reported separately.
export interface PlantInfo { city: string; country: string; }

const PLANT_CODE_MAP: Record<string, Record<string, PlantInfo>> = {
  // Toyota Japan (JT* prefix)
  JT: {
    A: { city: "Aichi",           country: "Japan" },
    B: { city: "Kyushu (Miyata)", country: "Japan" },
    C: { city: "Nagoya",          country: "Japan" },
    E: { city: "Miyagi",          country: "Japan" },
    G: { city: "Tahara, Aichi",   country: "Japan" },
    H: { city: "Hamura",          country: "Japan" },
    K: { city: "Kyushu",          country: "Japan" },
    T: { city: "Tsutsumi",        country: "Japan" },
    Y: { city: "Toyota City",     country: "Japan" },
    Z: { city: "Fujimatsu",       country: "Japan" },
  },
  // Honda Japan (JHM*)
  JHM: {
    A: { city: "Sayama",   country: "Japan" },
    B: { city: "Suzuka",   country: "Japan" },
    S: { city: "Saitama",  country: "Japan" },
  },
  // BMW Germany (WBA*)
  WBA: {
    A: { city: "Munich",        country: "Germany" },
    B: { city: "Munich",        country: "Germany" },
    C: { city: "Regensburg",    country: "Germany" },
    D: { city: "Dingolfing",    country: "Germany" },
    E: { city: "Regensburg",    country: "Germany" },
    G: { city: "Graz",          country: "Austria"  },
    S: { city: "Spartanburg, SC", country: "USA"    },
  },
  "5UX": {
    K: { city: "Spartanburg, SC", country: "USA" },
    L: { city: "Spartanburg, SC", country: "USA" },
  },
  // Mercedes-Benz (WDD*)
  WDD: {
    A: { city: "Kecskemét",      country: "Hungary" },
    B: { city: "Rastatt",        country: "Germany" },
    C: { city: "Sindelfingen",   country: "Germany" },
    D: { city: "Düsseldorf",     country: "Germany" },
    F: { city: "Bremen",         country: "Germany" },
    H: { city: "Hamburg",        country: "Germany" },
    J: { city: "Pune",           country: "India"   },
  },
  WDC: {
    A: { city: "Vance, AL", country: "USA"     },
    C: { city: "Bremen",    country: "Germany" },
    J: { city: "Graz",      country: "Austria" },
  },
  // Audi (WAU*)
  WAU: {
    A: { city: "Ingolstadt",  country: "Germany" },
    B: { city: "Neckarsulm",  country: "Germany" },
    G: { city: "Györ",        country: "Hungary" },
  },
  "WA1": {
    A: { city: "Ingolstadt",  country: "Germany" },
    B: { city: "Neckarsulm",  country: "Germany" },
    G: { city: "Györ",        country: "Hungary" },
  },
  // Volkswagen (WVW*)
  WVW: {
    E: { city: "Emden",             country: "Germany" },
    H: { city: "Hannover",          country: "Germany" },
    K: { city: "Osnabrück",         country: "Germany" },
    M: { city: "Zwickau (Mosel)",   country: "Germany" },
    P: { city: "Puebla",            country: "Mexico"  },
    W: { city: "Wolfsburg",         country: "Germany" },
    Z: { city: "Poznań",            country: "Poland"  },
  },
  // Porsche (WP0* / WP1*)
  WP0: {
    A: { city: "Stuttgart-Zuffenhausen", country: "Germany" },
    C: { city: "Leipzig",                country: "Germany" },
  },
  "WP1": {
    A: { city: "Stuttgart",    country: "Germany"  },
    C: { city: "Leipzig",      country: "Germany"  },
    D: { city: "Bratislava",   country: "Slovakia" },
  },
  // Hyundai Korea (KMH*)
  KMH: {
    A: { city: "Asan",          country: "South Korea" },
    B: { city: "Ulsan Plant 2", country: "South Korea" },
    C: { city: "Ulsan Plant 3", country: "South Korea" },
    D: { city: "Beijing",       country: "China"       },
    E: { city: "Ulsan Plant 4/5", country: "South Korea" },
    M: { city: "Montgomery, AL",  country: "USA"         },
    N: { city: "Nošovice",        country: "Czech Republic" },
  },
  // Kia Korea (KNA* / KND*)
  KNA: {
    A: { city: "Hwaseong",    country: "South Korea" },
    B: { city: "Gwangju",     country: "South Korea" },
    C: { city: "Sohari",      country: "South Korea" },
    H: { city: "Žilina",      country: "Slovakia"    },
    U: { city: "West Point, GA", country: "USA"      },
  },
  KND: {
    A: { city: "Hwaseong",  country: "South Korea" },
    B: { city: "Gwangju",   country: "South Korea" },
    C: { city: "Sohari",    country: "South Korea" },
    E: { city: "Empalme",   country: "Mexico"      },
  },
  // Honda USA (1HG* / 5FN* / 5J8*)
  "1HG": {
    A: { city: "Marysville, OH",   country: "USA"    },
    B: { city: "Lincoln, AL",      country: "USA"    },
    E: { city: "East Liberty, OH", country: "USA"    },
  },
  "5FN": {
    A: { city: "Marysville, OH", country: "USA"    },
    B: { city: "Lincoln, AL",    country: "USA"    },
    C: { city: "Alliston, ON",   country: "Canada" },
  },
  "5J8": {
    Y: { city: "East Liberty, OH", country: "USA" },
    T: { city: "Lincoln, AL",      country: "USA" },
  },
  // Ford USA (1FT* / 1FA*)
  "1FT": {
    E: { city: "Dearborn, MI",    country: "USA"    },
    F: { city: "Kansas City, MO", country: "USA"    },
    K: { city: "Avon Lake, OH",   country: "USA"    },
    R: { city: "Claycomo, MO",    country: "USA"    },
    X: { city: "Cuautitlán",      country: "Mexico" },
  },
  "1FA": {
    G: { city: "Flat Rock, MI",    country: "USA"    },
    H: { city: "Hermosillo",       country: "Mexico" },
  },
  "3FA": { G: { city: "Hermosillo", country: "Mexico" } },
  // Tesla USA (5YJ* / 7SA*)
  "5YJ": { F: { city: "Fremont, CA", country: "USA" } },
  "7SA": { F: { city: "Fremont, CA", country: "USA" } },
  // Volvo Sweden (YV*)
  YV1: {
    A: { city: "Gothenburg", country: "Sweden"  },
    B: { city: "Ghent",      country: "Belgium" },
    D: { city: "Gothenburg", country: "Sweden"  },
  },
  YV4: {
    A: { city: "Gothenburg", country: "Sweden"  },
    B: { city: "Ghent",      country: "Belgium" },
    C: { city: "Chengdu",    country: "China"   },
  },
  // Land Rover / Range Rover (SAL*)
  SAL: {
    A: { city: "Solihull",          country: "UK"      },
    B: { city: "Castle Bromwich",   country: "UK"      },
    M: { city: "Graz",              country: "Austria" },
    P: { city: "Pune",              country: "India"   },
  },
  // Jaguar (SAJ*)
  SAJ: {
    A: { city: "Castle Bromwich", country: "UK"      },
    B: { city: "Solihull",        country: "UK"      },
    C: { city: "Graz",            country: "Austria" },
  },
  // Chevrolet/GMC USA (1GC* / 1GT*)
  "1GC": {
    K: { city: "Fort Wayne, IN", country: "USA"    },
    P: { city: "Pontiac, MI",    country: "USA"    },
    T: { city: "Silao",          country: "Mexico" },
  },
  "1GT": {
    G: { city: "Pontiac, MI",    country: "USA"    },
    K: { city: "Fort Wayne, IN", country: "USA"    },
    T: { city: "Silao",          country: "Mexico" },
  },
  // ── Nissan Japan (JN1* / JN8*) ───────────────────────────────────────────
  JN1: {
    A: { city: "Oppama, Kanagawa",   country: "Japan" },
    B: { city: "Tochigi",            country: "Japan" },
    C: { city: "Yokohama",           country: "Japan" },
    E: { city: "Kyushu (Kanda)",     country: "Japan" },
    K: { city: "Fukuoka",            country: "Japan" },
  },
  JN8: {
    A: { city: "Oppama, Kanagawa",   country: "Japan" },
    B: { city: "Kyushu (Kanda)",     country: "Japan" },
    E: { city: "Fukuoka",            country: "Japan" },
  },
  // ── Nissan USA (1N4* / 5N1* / 3N1*) ─────────────────────────────────────
  "1N4": {
    A: { city: "Smyrna, TN",       country: "USA"    },
    B: { city: "Canyon, TX",       country: "USA"    },
    M: { city: "Canton, MS",       country: "USA"    },
    Z: { city: "Smyrna, TN",       country: "USA"    },
  },
  "5N1": {
    A: { city: "Smyrna, TN",       country: "USA"    },
    B: { city: "Canton, MS",       country: "USA"    },
    E: { city: "Kyushu",           country: "Japan"  },
  },
  "3N1": {
    A: { city: "Aguascalientes",   country: "Mexico" },
    B: { city: "Cuernavaca",       country: "Mexico" },
  },
  // ── Mazda Japan (JM1* / JM3*) ────────────────────────────────────────────
  JM1: {
    A: { city: "Hiroshima No.1",   country: "Japan" },
    B: { city: "Hofu",             country: "Japan" },
    K: { city: "Hiroshima No.1",   country: "Japan" },
    M: { city: "Hofu",             country: "Japan" },
  },
  JM3: {
    A: { city: "Hiroshima",        country: "Japan" },
    B: { city: "Hofu",             country: "Japan" },
    R: { city: "Hiroshima No.3",   country: "Japan" },
  },
  // ── Subaru Japan / USA (JF* / 4S*) ──────────────────────────────────────
  JF1: {
    A: { city: "Ōta, Gunma (Main)",   country: "Japan" },
    B: { city: "Ōta, Gunma (Yajima)", country: "Japan" },
    E: { city: "Ōta, Gunma",          country: "Japan" },
    V: { city: "Ōta, Gunma",          country: "Japan" },
  },
  JF2: {
    A: { city: "Ōta, Gunma",          country: "Japan" },
    B: { city: "Ōta, Gunma (Yajima)", country: "Japan" },
    S: { city: "Ōta, Gunma (Main)",   country: "Japan" },
    T: { city: "Ōta, Gunma",          country: "Japan" },
  },
  "4S3": { B: { city: "Lafayette, IN", country: "USA" } },
  "4S4": { B: { city: "Lafayette, IN", country: "USA" } },
  // ── Mitsubishi Japan (JA3* / JA4*) ───────────────────────────────────────
  "JA3": {
    A: { city: "Nagoya, Aichi",       country: "Japan"       },
    C: { city: "Okazaki, Aichi",      country: "Japan"       },
    N: { city: "Nagoya, Aichi",       country: "Japan"       },
    U: { city: "Born",                country: "Netherlands" },
  },
  "JA4": {
    A: { city: "Okazaki, Aichi",      country: "Japan"       },
    C: { city: "Nagoya, Aichi",       country: "Japan"       },
    E: { city: "Mizushima, Okayama",  country: "Japan"       },
    X: { city: "Born",                country: "Netherlands" },
  },
  // ── Lexus Japan (JTH* / JTJ*) ────────────────────────────────────────────
  JTH: {
    A: { city: "Motomachi, Toyota City", country: "Japan" },
    B: { city: "Tsutsumi, Toyota City",  country: "Japan" },
    C: { city: "Toyota City",            country: "Japan" },
    G: { city: "Tahara, Aichi",          country: "Japan" },
    K: { city: "Motomachi (EV line)",    country: "Japan" },
  },
  JTJ: {
    B: { city: "Tahara, Aichi",          country: "Japan" },
    C: { city: "Tahara, Aichi",          country: "Japan" },
    G: { city: "Toyota City",            country: "Japan" },
  },
  // ── Toyota USA (4T* / 5TF* / 5TD* / 2T*) ────────────────────────────────
  "4T1": {
    B: { city: "Georgetown, KY",       country: "USA"   },
    K: { city: "Georgetown, KY",       country: "USA"   },
    N: { city: "Georgetown, KY",       country: "USA"   },
    P: { city: "Princeton, IN",        country: "USA"   },
    R: { city: "Georgetown, KY",       country: "USA"   },
  },
  "5TF": {
    F: { city: "San Antonio, TX",      country: "USA"   },
    R: { city: "Georgetown, KY",       country: "USA"   },
    S: { city: "Princeton, IN",        country: "USA"   },
  },
  "5TD": {
    A: { city: "Princeton, IN",        country: "USA"   },
    K: { city: "Georgetown, KY",       country: "USA"   },
    Y: { city: "Princeton, IN",        country: "USA"   },
  },
  "2T1": {
    A: { city: "Takaoka, Aichi",       country: "Japan" },
    B: { city: "Blue Springs, MS",     country: "USA"   },
    R: { city: "Ohira, Miyagi",        country: "Japan" },
  },
  // ── Acura USA (JH4* / 19U*) ──────────────────────────────────────────────
  "JH4": {
    A: { city: "Marysville, OH",       country: "USA"   },
    K: { city: "Lincoln, AL",          country: "USA"   },
    T: { city: "Marysville, OH",       country: "USA"   },
  },
  "19U": {
    Y: { city: "East Liberty, OH",     country: "USA"   },
    B: { city: "Marysville, OH",       country: "USA"   },
    C: { city: "Lincoln, AL",          country: "USA"   },
  },
  // ── MINI (WMW*) ───────────────────────────────────────────────────────────
  WMW: {
    A: { city: "Oxford",               country: "UK"          },
    B: { city: "Graz",                 country: "Austria"     },
    C: { city: "Born",                 country: "Netherlands" },
    D: { city: "Leipzig",              country: "Germany"     },
  },
  // ── Rolls-Royce (SCA*) ────────────────────────────────────────────────────
  SCA: {
    A: { city: "Goodwood, West Sussex", country: "UK" },
    B: { city: "Goodwood, West Sussex", country: "UK" },
    C: { city: "Goodwood, West Sussex", country: "UK" },
  },
  // ── Aston Martin (SCF*) ───────────────────────────────────────────────────
  SCF: {
    B: { city: "Gaydon, Warwickshire",  country: "UK" },
    C: { city: "Gaydon, Warwickshire",  country: "UK" },
    D: { city: "Gaydon, Warwickshire",  country: "UK" },
    E: { city: "St Athan, Wales",       country: "UK" },
  },
  // ── Alfa Romeo (ZAR*) ─────────────────────────────────────────────────────
  ZAR: {
    A: { city: "Cassino, Frosinone",    country: "Italy" },
    B: { city: "Cassino, Frosinone",    country: "Italy" },
    E: { city: "Cassino, Frosinone",    country: "Italy" },
    J: { city: "Pomigliano d'Arco",     country: "Italy" },
  },
  // ── Škoda (TMB*) ──────────────────────────────────────────────────────────
  TMB: {
    A: { city: "Mladá Boleslav",        country: "Czech Republic" },
    J: { city: "Kvasiny",               country: "Czech Republic" },
    E: { city: "Vrchlabí",              country: "Czech Republic" },
  },
  // ── SEAT (VS6* / VS7*) ────────────────────────────────────────────────────
  VS6: { A: { city: "Martorell, Barcelona", country: "Spain" } },
  VS7: { A: { city: "Martorell, Barcelona", country: "Spain" } },
  // ── Opel / Vauxhall (W0L*) ────────────────────────────────────────────────
  W0L: {
    A: { city: "Rüsselsheim",           country: "Germany" },
    B: { city: "Zaragoza",              country: "Spain"   },
    S: { city: "Bochum",                country: "Germany" },
    T: { city: "Rüsselsheim",           country: "Germany" },
  },
};

// ── Electric-only WMIs (every vehicle from these manufacturers is battery-electric) ──
const ELECTRIC_ONLY_WMI = new Set([
  "5YJ", "7SA", "7G2",  // Tesla USA / Fremont / Berlin / Shanghai
  "LE4",                 // NIO
  "5LA",                 // Lucid
  "7FC",                 // Rivian
  "LBV",                 // BYD Electric
]);

// ── AWD-standard WMIs (Subaru symmetrical AWD ships on almost every model) ────
const AWD_STANDARD_WMI = new Set(["JF1", "JF2", "4S3", "4S4"]);

// Models whose names strongly imply AWD (matched as substring of decoded model)
const AWD_MODEL_HINTS = [
  "4runner", "land cruiser", "fj cruiser",
  "outback", "forester", "crosstrek", "ascent",
  "defender", "discovery", "range rover",
  "wrangler", "gladiator",
  "cayenne", "macan", "touareg",
  "x-trail", "patrol",
  "gv80", "gv70", "gv60",
  "rav4 awd", "highlander awd",
];

// Models that are primarily rear-wheel drive
const RWD_MODEL_HINTS = [
  "mustang", "camaro", "challenger",
  "m3", "m4", "m5", "m2",
  "911", "boxster", "cayman",
  "corvette",
  "f-type",
];

// ── Fuel type inference from engine decoded string and WMI ────────────────────
export function inferFuelType(engineDecoded: string | null, wmi: string): string | null {
  const wmi3 = wmi.slice(0, 3).toUpperCase();

  // Known all-electric manufacturers
  if (ELECTRIC_ONLY_WMI.has(wmi3)) return "Electric";

  if (!engineDecoded) return null;
  const e = engineDecoded.toLowerCase();

  if (
    e.includes("bev") ||
    e.includes("electric") && !e.includes("electrohydraulic") && !e.includes("turbo-electric")
  ) return "Electric";
  if (e.includes("phev") || e.includes("plug-in hybrid")) return "Plug-in Hybrid";
  if (e.includes("hybrid") || e.includes("e-power")) return "Hybrid";
  if (
    e.includes("diesel")   || e.includes(" cdi")      || e.includes(" dci")  ||
    e.includes(" tdi")     || e.includes(" hdi")       || e.includes("duramax") ||
    e.includes("crdi")     || e.includes("bluehdi")    || e.includes("powerstroke") ||
    e.includes("skyactiv-d") || e.includes("multijet") || e.includes("cdti")
  ) return "Diesel";

  return "Gasoline";
}

// ── Drive type inference from WMI, decoded model name, and engine description ─
export function inferDriveType(
  wmi: string,
  model: string | null,
  engineDecoded: string | null,
): string | null {
  const wmi3 = wmi.slice(0, 3).toUpperCase();

  // Subaru → always AWD
  if (AWD_STANDARD_WMI.has(wmi3)) return "All-Wheel Drive";

  const m = (model ?? "").toLowerCase();
  const e = (engineDecoded ?? "").toLowerCase();

  // Model-name hints
  for (const hint of AWD_MODEL_HINTS) {
    if (m.includes(hint)) return "All-Wheel Drive";
  }
  for (const hint of RWD_MODEL_HINTS) {
    if (m.includes(hint)) return "Rear-Wheel Drive";
  }

  // Engine string hints (manufacturer-appended badges)
  if (
    e.includes("symmetrical awd") || e.includes("e-awd") ||
    e.includes("4matic")          || e.includes("xdrive") ||
    e.includes("quattro")         || e.includes("sh-awd") ||
    e.includes(" htrac")          || e.includes("4wd")
  ) return "All-Wheel Drive";

  return null;
}

// ── Transmission (position 7, index 6) — select manufacturers ────────────────
// Where not VIN-standardised, inferTransmission() falls back to engine hints.
// BMW does not encode transmission in position 7 (NHTSA marks VDS unused) — excluded below.
const TRANSMISSION_CODE_MAP: Record<string, Record<string, string>> = {
  // VW Group position 7 (index 6) for DSG vs Manual:
  WVW: { A: "Manual (5-Speed)", D: "Automatic (DSG/DCT)", M: "Manual (6-Speed)", S: "7-Speed DSG (Dual-Clutch)" },
  WAU: { A: "Manual (6-Speed)", D: "Automatic (S tronic DCT)", M: "Manual", S: "7-Speed S tronic (DCT)" },
  WDD: { A: "Automatic (9G-TRONIC)", D: "Automatic", M: "Manual", S: "AMG SPEEDSHIFT DCT" },
};

// Fallback: infer transmission from the decoded engine description
function inferTransmissionFromEngine(engineDecoded: string | null): string | null {
  if (!engineDecoded) return null;
  const e = engineDecoded.toLowerCase();
  if (e.includes("electric") || e.includes(" ev"))  return "Single-Speed Automatic";
  if (e.includes("hybrid") && e.includes("phev"))   return "Automatic (CVT/AT + Electric)";
  if (e.includes("hybrid"))                          return "Automatic (CVT/AT)";
  if (e.includes("diesel") && e.includes("6.6"))     return "10-Speed Automatic";
  if (e.includes("diesel"))                          return "Automatic or Manual";
  if (e.includes("dsg") || e.includes("dct"))        return "Dual-Clutch (DCT/DSG)";
  if (e.includes("cvt"))                             return "CVT";
  return null;
}

export function decodeTransmission(
  vin: string,
  engineDecoded: string | null,
  model?: string | null,
): string | null {
  const upper = vin.toUpperCase();
  const wmi3 = upper.slice(0, 3);

  // BMW does not encode transmission in position 7 (NHTSA marks VDS positions unused).
  if (wmi3 === "WBA" || wmi3 === "WBS" || wmi3 === "WBY" || wmi3 === "5UX" || wmi3 === "4US") {
    const m = (model ?? decodePremiumEuropeanModel(upper) ?? "").toLowerCase();
    if (/x[1-7]\b|xm\b|\bix\b|i[3478x]|7 series|8 series/.test(m)) return "Automatic";
    const fromEngine = inferTransmissionFromEngine(engineDecoded);
    if (fromEngine) return fromEngine;
    return null;
  }

  if (hasEuZzzTypeApprovalDescriptor(upper)) {
    return inferTransmissionFromEngine(engineDecoded);
  }

  const table = lookupByWmi(upper, TRANSMISSION_CODE_MAP);
  const fromCode = table ? (table[upper[6]] ?? null) : null;
  return fromCode ?? inferTransmissionFromEngine(engineDecoded);
}

// ── Engine spec extraction from decoded string ────────────────────────────────
export interface EngineSpecs { displacement: string | null; cylinders: string | null; }

export function extractEngineSpecs(engineDecoded: string | null): EngineSpecs {
  if (!engineDecoded) return { displacement: null, cylinders: null };
  const dispMatch = engineDecoded.match(/(\d+\.\d+)\s*L/i);
  const cylMatch  = engineDecoded.match(/[IVHFivhf](\d+)/);
  return {
    displacement: dispMatch ? dispMatch[1] : null,
    cylinders:    cylMatch  ? cylMatch[1]  : null,
  };
}

// ── Body style (position 6, index 5) — select manufacturers ──────────────────
// This is NOT universally standardized. Only decode for manufacturers
// where position 6 is known to indicate body type.
const BODY_CODE_MAP: Record<string, Record<string, string>> = {
  // BMW: position 4 (index 3) encodes series already in MODEL_MAP_4.
  // Position 6 (index 5) for BMW encodes body variant:
  WBA: { E: "Sedan", G: "Gran Coupé", H: "Touring (Wagon)", K: "Convertible", N: "Coupé", P: "Gran Turismo" },
  WBY: { E: "Hatchback/BEV" },
  // Audi: position 6 (index 5) body:
  WAU: {
    A: "Convertible/Cabriolet", B: "Coupé", C: "Cabriolet", D: "Sedan",
    E: "Avant (Wagon)", F: "Allroad", G: "Sportback", H: "Hatchback",
    J: "Sedan (Limousine)", K: "Coupé", L: "Limousine",
  },
  // VW: position 6 (index 5):
  WVW: { A: "2-Door Hatchback", B: "4-Door Sedan", C: "Cabriolet", E: "4-Door Hatchback", G: "3-Door Hatchback", R: "4-Door Sedan" },
  // Hyundai: position 6 (index 5):
  KMH: { A: "2-Door", B: "Sedan", C: "SUV/Crossover", D: "Coupé", E: "Hatchback", F: "Wagon", G: "SUV", H: "Crossover" },
  KM8: { A: "SUV", B: "Crossover", C: "SUV", D: "Compact SUV" },
  // Kia:
  KNA: { A: "Sedan", B: "Hatchback", C: "SUV", D: "Wagon" },
  KND: { A: "SUV", B: "Hatchback", C: "Minivan", D: "Crossover SUV", E: "Compact SUV" },
  // Toyota Japan:
  JT: { A: "Sedan", B: "2-Door", D: "Sedan", E: "SUV/4WD", F: "Wagon/Touring", G: "SUV", H: "Hatchback", J: "SUV", T: "Sedan", U: "Minivan", V: "Wagon" },
  // Mercedes:
  WDD: { A: "Coupé", B: "Sedan", C: "Estate (Wagon)", F: "Sedan/Limousine", G: "Convertible", H: "Coupé", J: "Cabriolet", K: "Hatchback" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function lookupByWmi<T>(vin: string, map: Record<string, Record<string, T>>): Record<string, T> | null {
  const w3 = vin.slice(0, 3);
  const wmiKey = isVagWmi(w3) && map.WVW ? "WVW" : w3;
  return map[wmiKey] ?? map[vin.slice(0, 2)] ?? null;
}

export function decodeEngineCode(vin: string): string | null {
  const upper = vin.toUpperCase();
  // EU homologation VINs (ZZZ filler) — never map position 8 to engine; it is part of the type code.
  if (hasEuZzzTypeApprovalDescriptor(upper)) return null;
  const table = lookupByWmi(upper, ENGINE_CODE_MAP);
  if (!table) return null;
  return table[upper[7]] ?? null;   // position 8 (index 7)
}

export function decodePlantInfo(vin: string): PlantInfo | null {
  const upper = vin.toUpperCase();
  const table = lookupByWmi(upper, PLANT_CODE_MAP);
  if (!table) return null;
  return table[upper[10]] ?? null;  // position 11 (index 10)
}

export function decodeBodyStyleLocal(vin: string): string | null {
  const upper = vin.toUpperCase();
  if (hasEuZzzTypeApprovalDescriptor(upper)) return null;
  const table = lookupByWmi(upper, BODY_CODE_MAP);
  if (!table) return null;
  return table[upper[5]] ?? null;   // position 6 (index 5)
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface VinDecodeResult {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  country: string | null;
  wmi: string;
  modelYear: string;
  engineCode: string | null;
  engineDecoded: string | null;
  engineDisplacement: string | null;
  engineCylinders: string | null;
  plantCode: string | null;
  plantCity: string | null;
  plantCountry: string | null;
  bodyStyleDecoded: string | null;
  transmissionDecoded: string | null;
  fuelType: string | null;
  driveType: string | null;
}

export function decodeVin(vin: string): VinDecodeResult {
  const upper = vin.toUpperCase().trim();
  const global = decodeGlobalBrand(upper);
  const wmi = upper.slice(0, 3);
  const wmiMake = lookupWmiMake(upper);
  const make = decodeMake(upper, wmiMake, global);
  const model = decodeModel(upper, global);
  const engineDecoded = decodeEngineCode(upper);
  const specs = extractEngineSpecs(engineDecoded);
  const plant = decodePlantInfo(upper);
  return {
    vin: upper,
    make,
    model,
    year: decodeYear(upper[9]),         // position 10 (0-indexed: 9)
    country: decodeCountry(upper),
    wmi,
    modelYear: upper[9] ?? "",
    engineCode: engineDecoded ? (upper[7] ?? null) : null,
    engineDecoded,
    engineDisplacement: specs.displacement,
    engineCylinders: specs.cylinders,
    plantCode: upper[10] ?? null,       // position 11 (raw char)
    plantCity: plant?.city ?? null,
    plantCountry: plant?.country ?? null,
    bodyStyleDecoded: decodeBodyStyleLocal(upper),
    transmissionDecoded: decodeTransmission(upper, engineDecoded, model),
    fuelType: inferFuelType(engineDecoded, wmi),
    driveType: inferDriveType(wmi, model, engineDecoded),
  };
}
