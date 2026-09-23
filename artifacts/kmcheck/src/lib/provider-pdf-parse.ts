/**
 * Parse Carfax / AutoCheck PDF text into pending VIN form fields.
 * Miles → km. Does not touch photos (handled by apply helper).
 */

import {
  EMPTY_ACCIDENT,
  EMPTY_MILEAGE,
  EMPTY_OWNER,
  EMPTY_SERVICE,
  EMPTY_MARKET_DATA,
  type CatalogAccidentForm,
  type CatalogMileageForm,
  type CatalogOwnerForm,
  type CatalogServiceForm,
} from "@/components/admin/vin-catalog-history-editors";
import type { VinCatalogFormState } from "@/components/admin/vin-catalog-data-form";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import {
  parseOdometerNumber,
  readingToKm,
  unitHintFromSnippet,
} from "@/lib/provider-pdf-miles";

export type ProviderPdfKind = "carfax" | "autocheck" | "unknown";

export type ProviderPdfParseOk = {
  ok: true;
  provider: ProviderPdfKind;
  vinFound: string | null;
  form: Omit<VinCatalogFormState, "photos">;
  summary: string[];
};

export type ProviderPdfParseErr = {
  ok: false;
  error: string;
};

export type ProviderPdfParseResult = ProviderPdfParseOk | ProviderPdfParseErr;

const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/gi;
const DATE_TOKEN =
  "(?:0?[1-9]|1[0-2])[\\/\\-.](?:0?[1-9]|[12]\\d|3[01])[\\/\\-.](?:19|20)\\d{2}";
const DATE_RE = new RegExp(`\\b(${DATE_TOKEN})\\b`, "i");

const CURRENT_YEAR = new Date().getFullYear();
const MIN_MODEL_YEAR = 1981;
const MAX_MODEL_YEAR = CURRENT_YEAR + 1;

const NEXT_SPEC_LABEL =
  "VIN|Year|Make|Model|Trim|Style|Series|Engine|Transmission|Trans|Fuel|Body|Drive|Drivetrain|Title|Odometer|Owners?|Cylinders?|Horsepower|HP\\b";

const KNOWN_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick", "Cadillac",
  "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda",
  "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus",
  "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "Mercedes", "Mercury",
  "Mini", "Mitsubishi", "Nissan", "Porsche", "Ram", "Rolls-Royce", "Subaru", "Suzuki",
  "Tesla", "Toyota", "Volkswagen", "Volvo", "Polestar", "Rivian", "Lucid",
].sort((a, b) => b.length - a.length);

function normalizeWs(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Prefer vehicle header / summary — avoid matching years inside history rows. */
function vehicleHeader(text: string): string {
  const cut =
    text.search(
      /\b(?:accident|damage|odometer|owner|service|title)\s+history\b|\bdetailed\s+vehicle\s+history\b/i,
    );
  if (cut > 200) return text.slice(0, cut);
  return text.slice(0, Math.min(3500, text.length));
}

export function detectProviderPdfKind(text: string): ProviderPdfKind {
  const t = text.toUpperCase();
  if (/\bCARFAX\b/.test(t)) return "carfax";
  if (/\bAUTOCHECK\b/.test(t) || /\bEXPERIAN\s+AUTOCHECK\b/.test(t)) return "autocheck";
  return "unknown";
}

export function extractVinsFromText(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(VIN_RE)) {
    const v = (m[1] ?? "").toUpperCase();
    if (v.length === 17) found.add(v);
  }
  return [...found];
}

function toIsoDate(raw: string): string {
  const s = raw.trim().replace(/[.\-]/g, "/");
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return `${m[3]}-${m[1]!.padStart(2, "0")}-${m[2]!.padStart(2, "0")}`;
  }
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
  }
  return raw.trim();
}

function isPlausibleModelYear(y: number): boolean {
  return Number.isFinite(y) && y >= MIN_MODEL_YEAR && y <= MAX_MODEL_YEAR;
}

function cleanSpecValue(raw: string): string {
  let v = raw.replace(/\s{2,}/g, " ").trim();
  const cutRe = new RegExp(`\\s+(?=${NEXT_SPEC_LABEL})`, "i");
  const parts = v.split(cutRe);
  v = (parts[0] ?? v).trim().replace(/[,;:|#]+$/g, "").trim();
  // Drop trailing junk like "- vehicle", "reported", etc.
  v = v.replace(/\s*[-–—]\s*(vehicle|car|noted|reported).*$/i, "").trim();
  return v;
}

function fieldAfterLabel(scope: string, labels: string[], maxLen = 80): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:#]?\\s*([^\\n]{1,${maxLen}})`, "i");
    const m = scope.match(re);
    if (!m?.[1]) continue;
    const cleaned = cleanSpecValue(m[1]);
    if (cleaned && cleaned.length <= maxLen) return cleaned;
  }
  return null;
}

function parseYear(scope: string): string {
  const labeled = fieldAfterLabel(scope, [
    "Model\\s*year",
    "Year\\s*(?:of\\s*)?(?:manufacture|vehicle)?",
    "Year",
  ]);
  if (labeled) {
    const y = Number(labeled.replace(/\D/g, "").slice(0, 4));
    if (isPlausibleModelYear(y)) return String(y);
  }

  // "2019 Audi A6 Prestige" near top / after VIN
  const ymm = scope.match(
    new RegExp(
      `\\b((?:19|20)\\d{2})\\s+(${KNOWN_MAKES.map(escapeRe).join("|")})\\s+([A-Za-z0-9][A-Za-z0-9 \\-/.]{0,40})`,
      "i",
    ),
  );
  if (ymm) {
    const y = Number(ymm[1]);
    if (isPlausibleModelYear(y)) return String(y);
  }
  return "";
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseMake(scope: string): string {
  const labeled = fieldAfterLabel(scope, ["Make", "Manufacturer"]);
  if (labeled) {
    const hit = KNOWN_MAKES.find((m) => labeled.toLowerCase().startsWith(m.toLowerCase()));
    if (hit) return hit;
    // First 1–3 words, stop before model-ish tokens
    const word = labeled.split(/\s+/)[0] ?? "";
    if (/^[A-Za-z][A-Za-z\-]+$/.test(word) && word.length >= 2) return word;
  }
  for (const make of KNOWN_MAKES) {
    const re = new RegExp(`\\b${escapeRe(make)}\\b`, "i");
    if (re.test(scope.slice(0, 2000))) return make;
  }
  return "";
}

function parseModel(scope: string, make: string): string {
  const labeled = fieldAfterLabel(scope, ["Model(?:\\s*name)?"], 60);
  if (labeled) {
    // Keep multi-word like "A6 Prestige", "Camry SE"
    return labeled.slice(0, 60);
  }

  if (make) {
    const re = new RegExp(
      `\\b${escapeRe(make)}\\s+([A-Za-z0-9][A-Za-z0-9 \\-/.]{1,50}?)(?=\\s{2,}|\\n|\\b(?:${NEXT_SPEC_LABEL})\\b|$)`,
      "i",
    );
    const m = scope.match(re);
    if (m?.[1]) {
      let model = cleanSpecValue(m[1]);
      // Drop leading year if captured
      model = model.replace(/^(?:19|20)\d{2}\s+/, "");
      return model.slice(0, 60);
    }
  }

  const ymm = scope.match(
    new RegExp(
      `\\b(?:19|20)\\d{2}\\s+(${KNOWN_MAKES.map(escapeRe).join("|")})\\s+([A-Za-z0-9][A-Za-z0-9 \\-/.]{1,50})`,
      "i",
    ),
  );
  if (ymm?.[2]) return cleanSpecValue(ymm[2]).slice(0, 60);
  return "";
}

function parseFuel(scope: string): string {
  const labeled = fieldAfterLabel(scope, ["Fuel\\s*type", "Fuel"]);
  if (labeled) {
    const l = labeled.toLowerCase();
    if (/diesel|tdi/.test(l)) return "Diesel";
    if (/electric|ev\b|battery/.test(l)) return "Electric";
    if (/hybrid|phev|plug.?in/.test(l)) return "Hybrid";
    if (/gas|petrol|unleaded|flex/.test(l)) return "Gasoline";
    return labeled.slice(0, 40);
  }
  if (/\bdiesel\b/i.test(scope.slice(0, 2500))) return "Diesel";
  if (/\belectric\b/i.test(scope.slice(0, 2500))) return "Electric";
  if (/\bhybrid\b/i.test(scope.slice(0, 2500))) return "Hybrid";
  if (/\b(?:gasoline|petrol)\b/i.test(scope.slice(0, 2500))) return "Gasoline";
  return "";
}

function parseBody(scope: string): string {
  const labeled = fieldAfterLabel(scope, ["Body\\s*style", "Body\\s*type", "Body"]);
  if (labeled) {
    const l = labeled.toLowerCase();
    if (/suv|crossover|sport.?utility/.test(l)) return "SUV";
    if (/sedan|saloon/.test(l)) return "Sedan";
    if (/coupe|coupé/.test(l)) return "Coupe";
    if (/hatch/.test(l)) return "Hatchback";
    if (/wagon|estate/.test(l)) return "Wagon";
    if (/pickup|truck/.test(l)) return "Pickup";
    if (/van|minivan/.test(l)) return "Van";
    if (/convertible|cabriolet/.test(l)) return "Convertible";
    return labeled.slice(0, 40);
  }
  const head = scope.slice(0, 2500);
  if (/\bSUV\b|\bcrossover\b/i.test(head)) return "SUV";
  if (/\bsedan\b/i.test(head)) return "Sedan";
  if (/\bcoupe\b/i.test(head)) return "Coupe";
  return "";
}

function parseTransmission(scope: string): string {
  const labeled = fieldAfterLabel(scope, ["Transmission", "Trans"]);
  if (labeled) {
    const l = labeled.toLowerCase();
    if (/manual|stick/.test(l)) return "Manual";
    if (/cvt/.test(l)) return "CVT";
    if (/auto|tiptronic|dsg|s.?tronic|pdk/.test(l)) return "Automatic";
    return labeled.slice(0, 40);
  }
  if (/\bmanual\b/i.test(scope.slice(0, 2500))) return "Manual";
  if (/\bautomatic\b/i.test(scope.slice(0, 2500))) return "Automatic";
  return "";
}

/** Full engine string e.g. "3.0L V6 TFSI", "2.0L I4 Turbo". */
export function parseEngine(scope: string): string {
  const labeled = fieldAfterLabel(scope, ["Engine(?:\\s*(?:size|type|displacement))?"], 90);
  if (labeled) {
    // Prefer keeping displacement + config from the label value
    const rich = labeled.match(
      /(\d(?:\.\d)?\s*L(?:iter)?(?:\s*[IVW]?\d)?(?:\s*[A-Za-z0-9+\-\/]{0,24}){0,6})/i,
    );
    if (rich?.[1]) return cleanSpecValue(rich[1]).slice(0, 80);
    return labeled.slice(0, 80);
  }
  const m = scope.slice(0, 3500).match(
    /\b(\d(?:\.\d)?\s*L(?:iter)?(?:\s*(?:I|V|W|H)?\d)?(?:\s*(?:Turbo|Supercharged|TFSI|TDI|TSI|EcoBoost|Hybrid|DOHC|SOHC))?(?:\s*[A-Za-z0-9+\-]{0,12}){0,4})\b/i,
  );
  return m?.[1] ? cleanSpecValue(m[1]).slice(0, 80) : "";
}

function parseHp(scope: string): string {
  const m = scope.slice(0, 3500).match(/\b(\d{2,4})\s*(?:hp|horsepower)\b/i);
  return m?.[1] ?? "";
}

function parseCylinders(scope: string): string {
  const m = scope.slice(0, 3500).match(/\b(\d)\s*(?:cyl|cylinders?)\b/i)
    || scope.slice(0, 3500).match(/\bV(\d)\b/);
  return m?.[1] ?? "";
}

function parseIntField(scope: string, labels: string[]): string {
  const raw = fieldAfterLabel(scope, labels);
  if (!raw) return "";
  const n = parseOdometerNumber(raw.replace(/[^\d,]/g, ""));
  return n != null ? String(n) : "";
}

function parseOdometerKm(text: string): string {
  const head = vehicleHeader(text);
  const patterns = [
    /(?:last\s+reported\s+)?(?:odometer|mileage)[^0-9\n]{0,40}([\d,]{3,7})\s*(miles?|mi|km|kilometers?|kilometres?)?/i,
  ];
  for (const re of patterns) {
    const m = head.match(re) ?? text.match(re);
    if (!m?.[1]) continue;
    const n = parseOdometerNumber(m[1]);
    if (n == null || n <= 0) continue;
    return String(readingToKm(n, m[2] ?? unitHintFromSnippet(m[0] ?? "")));
  }
  return "";
}

function boolFlag(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

function parseTitleStatus(scope: string): string {
  if (/\bsalvage\s+title\b/i.test(scope) || /\btitle\s+brand[:\s]+salvage\b/i.test(scope)) {
    return "salvage";
  }
  if (/\brebuilt\b/i.test(scope) && /\btitle\b/i.test(scope)) return "rebuilt";
  if (/\blemon\b/i.test(scope)) return "lemon";
  if (/\bclean\s+title\b/i.test(scope) || /\bclear\s+title\b/i.test(scope)) return "clean";
  const labeled = fieldAfterLabel(scope, ["Title\\s*brand", "Title\\s*status", "Title"]);
  if (labeled) {
    const lower = labeled.toLowerCase();
    if (lower.includes("salvage")) return "salvage";
    if (lower.includes("clean") || lower.includes("clear")) return "clean";
  }
  return "";
}

/** Strip dates, mileages, and location noise from notes — keep service / event info. */
export function cleanHistoryNote(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(new RegExp(DATE_TOKEN, "gi"), " ");
  s = s.replace(/\b[\d,]{2,7}\s*(?:miles?|mi|km|kilometers?|kilometres?)\b/gi, " ");
  s = s.replace(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2}\b/g, " ");
  s = s.replace(/\b(?:odometer|mileage)\s*(?:reading)?\b/gi, " ");
  s = s.replace(/\s*[-–—|:]\s*/g, " · ");
  s = s.replace(/(?:\s*·\s*)+/g, " · ").replace(/^\s*·\s*|\s*·\s*$/g, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s.length < 3) return "";
  return s.slice(0, 200);
}

type HistoryHit = {
  date: string;
  note: string;
  odometerKm: string;
  location: string;
  raw: string;
};

function parseHistoryBlocks(text: string): HistoryHit[] {
  const hits: HistoryHit[] = [];
  const lineRe = new RegExp(`(${DATE_TOKEN})\\s+(.{8,200})`, "gi");
  for (const m of text.matchAll(lineRe)) {
    const date = toIsoDate(m[1]!);
    const rest = m[2]!.trim();
    // Skip if this "date" is actually a model year alone with make (handled elsewhere)
    const odoM = rest.match(/([\d,]{2,7})\s*(miles?|mi|km|kilometers?)?/i);
    let odometerKm = "";
    if (odoM?.[1]) {
      const n = parseOdometerNumber(odoM[1]);
      if (n != null && n > 0) {
        odometerKm = String(readingToKm(n, odoM[2] ?? unitHintFromSnippet(odoM[0])));
      }
    }
    const locationM = rest.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2})\b/);
    const location = locationM ? `${locationM[1]}, ${locationM[2]}` : "";
    const note = cleanHistoryNote(rest);
    hits.push({ date, note, odometerKm, location, raw: rest });
    if (hits.length >= 80) break;
  }
  return hits;
}

function isAccidentish(raw: string): boolean {
  return /\b(accident|collision|damage|crash|hit|rear.?end|front.?end|side.?impact|airbag|structural)\b/i.test(raw);
}

function isServiceish(raw: string): boolean {
  return /\b(service|serviced|oil\s+change|maintenance|tire|brake|replace|replaced|repair|inspected|inspection|filter|fluid|alignment|battery|spark\s+plug|timing|transmission\s+service|dealer\s+service)\b/i.test(raw)
    && !isAccidentish(raw);
}

function isMileageEvent(raw: string, odometerKm: string): boolean {
  if (!odometerKm) return false;
  if (isServiceish(raw) && !/\b(odometer|mileage|reading|reported)\b/i.test(raw)) {
    // Service with mileage still belongs in mileage table + service table
    return true;
  }
  return /\b(odometer|mileage|inspection|registration|renewal|emission|smog|title\/registration|reported|reading)\b/i.test(raw)
    || /[\d,]{2,7}\s*(miles?|mi|km)\b/i.test(raw);
}

function isOwnerish(raw: string): boolean {
  return /\b(owner|purchased|sold|title\s+issued|registration\s+issued|first\s+owner|personal|lease|fleet|ownership)\b/i.test(raw);
}

function buildAccidents(hits: HistoryHit[], text: string): CatalogAccidentForm[] {
  const fromHits = hits
    .filter((h) => isAccidentish(h.raw))
    .map((h) => ({
      ...EMPTY_ACCIDENT,
      date: h.date,
      description: h.note || "Accident / damage reported",
      location: h.location,
      type: /flood|water/i.test(h.raw) ? "flood" : "collision",
      severity: /severe|major|structural/i.test(h.raw)
        ? "major"
        : /minor|cosmetic/i.test(h.raw)
          ? "minor"
          : "",
      odometerAtLoss: h.odometerKm,
      currency: "USD",
    }));

  if (fromHits.length > 0) {
    return sortHistoryNewestFirst(fromHits);
  }

  if (/\bno\s+accidents?\s+(?:reported|found)\b/i.test(text)) return [];
  return [];
}

/** Highest mileage first (then newest date). */
function sortMileageHighestFirst(rows: CatalogMileageForm[]): CatalogMileageForm[] {
  return [...rows].sort((a, b) => {
    const oa = Number(a.odometer) || 0;
    const ob = Number(b.odometer) || 0;
    if (ob !== oa) return ob - oa;
    // tie-break: newer date first
    return sortHistoryNewestFirst([a, b])[0] === a ? -1 : 1;
  });
}

function buildMileage(hits: HistoryHit[], latestKm: string): CatalogMileageForm[] {
  const rows = hits
    .filter((h) => isMileageEvent(h.raw, h.odometerKm) || (h.odometerKm && !isAccidentish(h.raw)))
    .filter((h) => h.odometerKm)
    .map((h) => ({
      ...EMPTY_MILEAGE,
      date: h.date,
      odometer: h.odometerKm,
      unit: "km",
      source: "",
      location: h.location,
      // Notes: service / event info only — not mileage figures
      description: isServiceish(h.raw) ? h.note : (h.note && !/^\d+$/.test(h.note) ? h.note : ""),
    }));

  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const k = `${r.date}|${r.odometer}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (unique.length === 0 && latestKm) {
    return [{
      ...EMPTY_MILEAGE,
      odometer: latestKm,
      unit: "km",
      source: "",
      description: "",
    }];
  }
  return sortMileageHighestFirst(unique).slice(0, 50);
}

function buildServices(hits: HistoryHit[]): CatalogServiceForm[] {
  const rows = hits
    .filter((h) => isServiceish(h.raw))
    .map((h) => ({
      ...EMPTY_SERVICE,
      date: h.date,
      mileage: h.odometerKm,
      title: "Service",
      location: h.location,
      description: h.note,
    }))
    .filter((r) => r.description || r.mileage);

  return sortHistoryNewestFirst(rows).slice(0, 50);
}

function buildOwners(hits: HistoryHit[], ownerCount: string): CatalogOwnerForm[] {
  const rows = hits
    .filter((h) => isOwnerish(h.raw))
    .map((h) => ({
      ...EMPTY_OWNER,
      date: h.date,
      location: h.location,
      mileage: h.odometerKm,
      condition: "",
      lotStatus: "",
    }));

  if (rows.length > 0) return sortHistoryNewestFirst(rows).slice(0, 20);

  // Do not invent empty owner rows — only count field
  void ownerCount;
  return [];
}

function parseOwnerCount(text: string): string {
  const head = vehicleHeader(text);
  const m = head.match(
    /(?:number\s+of\s+owners|owner\s+count|owners?\s*(?:reported)?)\s*[:#]?\s*(\d{1,2})\b/i,
  );
  if (m?.[1]) return m[1];
  const alt = head.match(/\b(\d{1,2})\s+owners?\b/i);
  return alt?.[1] ?? "";
}

function parseAccidentCount(text: string, accidents: CatalogAccidentForm[]): string {
  if (/\bno\s+accidents?\s+(?:reported|found)\b/i.test(text)) return "0";
  const m = vehicleHeader(text).match(
    /(?:accidents?\s*(?:reported|found|count)?|accident\s+count)\s*[:#]?\s*(\d{1,2})\b/i,
  );
  if (m?.[1]) return m[1];
  if (accidents.length > 0) return String(accidents.length);
  return "";
}

function emptyFormWithoutPhotos(): Omit<VinCatalogFormState, "photos"> {
  return {
    make: "",
    model: "",
    year: "",
    trim: "",
    engine: "",
    transmission: "",
    fuelType: "",
    bodyType: "",
    color: "",
    country: "us",
    odometer: "",
    ownerCount: "",
    accidentCount: "",
    hp: "",
    cylinders: "",
    titleStatus: "",
    isSalvage: false,
    isStolen: false,
    isTaxi: false,
    isFlooded: false,
    floodCount: "",
    floodLossAmount: "",
    accidents: [],
    insuranceClaims: [],
    mileageHistory: [],
    serviceHistory: [],
    ownerHistory: [],
    auctionHistory: [],
    registryHistory: [],
    marketData: { ...EMPTY_MARKET_DATA },
  };
}

/**
 * Parse extracted PDF text into form fields.
 * @param expectedVin — pending VIN; mismatch fails the parse.
 */
export function parseProviderPdfText(
  rawText: string,
  expectedVin: string,
): ProviderPdfParseResult {
  const text = normalizeWs(rawText);
  if (text.replace(/\s+/g, "").length < 40) {
    return {
      ok: false,
      error: "Could not read text from this PDF (it may be a scanned image). Use a text-based Carfax or AutoCheck PDF.",
    };
  }

  const provider = detectProviderPdfKind(text);
  const vins = extractVinsFromText(text);
  const expected = expectedVin.trim().toUpperCase();
  const vinFound = vins.find((v) => v === expected) ?? vins[0] ?? null;

  if (vins.length > 0 && expected && !vins.includes(expected)) {
    return {
      ok: false,
      error: `PDF VIN (${vins[0]}) does not match this pending VIN (${expected}).`,
    };
  }

  const head = vehicleHeader(text);
  const year = parseYear(head);
  const make = parseMake(head);
  const model = parseModel(head, make);
  const transmission = parseTransmission(head);
  const fuelType = parseFuel(head);
  const bodyType = parseBody(head);
  const engine = parseEngine(head);

  const odometer = parseOdometerKm(text);
  const hits = parseHistoryBlocks(text);
  const accidents = buildAccidents(hits, text);
  const ownerCount = parseOwnerCount(text) || parseIntField(head, ["Owners?"]);
  const accidentCount = parseAccidentCount(text, accidents);
  const mileageHistory = buildMileage(hits, odometer);
  const serviceHistory = buildServices(hits);
  const ownerHistory = buildOwners(hits, ownerCount);

  // Latest odometer from mileage table if header missing
  const topOdo = mileageHistory[0]?.odometer || odometer;

  const isSalvage = boolFlag(text, [
    /\bsalvage\s+title\b/i,
    /\btitle\s+brand[:\s]+salvage\b/i,
    /\breported\s+as\s+salvage\b/i,
  ]);
  const isFlooded = boolFlag(text, [
    /\bflood\s+damage\b/i,
    /\bwater\s+damage\b/i,
    /\bflood\s+title\b/i,
  ]);
  const isStolen = boolFlag(text, [
    /\bstolen\s+(?:vehicle|report|status)\b/i,
    /\btheft\s+record\b/i,
  ]);
  const isTaxi = boolFlag(text, [
    /\btaxi\s+use\b/i,
    /\brideshare\b/i,
  ]);

  const form: Omit<VinCatalogFormState, "photos"> = {
    ...emptyFormWithoutPhotos(),
    year,
    make: make.slice(0, 40),
    model: model.slice(0, 60),
    trim: "",
    engine,
    transmission: transmission.slice(0, 40),
    fuelType: fuelType.slice(0, 40),
    bodyType: bodyType.slice(0, 40),
    color: "", // never extract color — PDF noise ("White - vehicle")
    country: "us",
    odometer: topOdo,
    ownerCount,
    accidentCount,
    hp: parseHp(head),
    cylinders: parseCylinders(head) || (engine.match(/\b(?:V|I|W)(\d)\b/i)?.[1] ?? ""),
    titleStatus: parseTitleStatus(head),
    isSalvage,
    isStolen,
    isTaxi,
    isFlooded,
    floodCount: isFlooded ? "1" : "",
    accidents,
    mileageHistory,
    serviceHistory,
    ownerHistory,
  };

  const summary: string[] = [];
  if (provider !== "unknown") summary.push(`Detected ${provider === "carfax" ? "Carfax" : "AutoCheck"}`);
  else summary.push("Provider not clearly detected — best-effort parse");
  if (form.year || form.make || form.model) {
    summary.push([form.year, form.make, form.model].filter(Boolean).join(" "));
  }
  if (form.engine) summary.push(form.engine);
  if (form.odometer) summary.push(`Odometer ${form.odometer} km`);
  if (form.accidents.length) summary.push(`${form.accidents.length} accident(s)`);
  if (form.mileageHistory.length) summary.push(`${form.mileageHistory.length} mileage row(s)`);
  if (form.serviceHistory.length) summary.push(`${form.serviceHistory.length} service(s)`);
  if (form.ownerHistory.length) summary.push(`${form.ownerHistory.length} owner row(s)`);

  return { ok: true, provider, vinFound, form, summary };
}
