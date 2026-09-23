/**
 * Parse Carfax / AutoCheck PDF text into pending VIN form fields.
 * Miles are converted to km. Does not touch photos (handled by apply helper).
 */

import {
  EMPTY_ACCIDENT,
  EMPTY_MILEAGE,
  EMPTY_OWNER,
  EMPTY_MARKET_DATA,
  type CatalogAccidentForm,
  type CatalogMileageForm,
  type CatalogOwnerForm,
} from "@/components/admin/vin-catalog-history-editors";
import type { VinCatalogFormState } from "@/components/admin/vin-catalog-data-form";
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
const DATE_RE =
  /\b((?:0?[1-9]|1[0-2])[\/\-.](?:0?[1-9]|[12]\d|3[01])[\/\-.](?:19|20)\d{2}|(?:19|20)\d{2}[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:0?[1-9]|[12]\d|3[01]))\b/;

function normalizeWs(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  // MM/DD/YYYY
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1]!.padStart(2, "0");
    const dd = m[2]!.padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  // YYYY/MM/DD
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
  }
  return raw.trim();
}

function fieldAfterLabel(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(
      `${label}\\s*[:#]?\\s*([^\\n]{1,80})`,
      "i",
    );
    const m = text.match(re);
    if (m?.[1]) {
      const v = m[1].replace(/\s{2,}/g, " ").trim();
      // Stop at next obvious label-ish token
      const cut = v.split(/\s{2,}|(?=\b(?:VIN|Year|Make|Model|Trim|Engine|Transmission|Fuel|Body|Color|Odometer|Title)\b)/i)[0];
      const cleaned = (cut ?? v).trim().replace(/[,;]+$/, "");
      if (cleaned && cleaned.length < 80) return cleaned;
    }
  }
  return null;
}

function parseYearMakeModelLine(text: string): { year?: string; make?: string; model?: string } {
  // e.g. "2019 Honda Civic EX" or "Year Make Model: 2019 Honda Civic"
  const m = text.match(
    /\b((?:19|20)\d{2})\s+([A-Za-z][A-Za-z\-]+)\s+([A-Za-z0-9][A-Za-z0-9 \-/.]{1,40}?)(?=\s{2,}|\n|VIN\b|Engine\b|Trim\b|$)/,
  );
  if (!m) return {};
  return {
    year: m[1],
    make: m[2],
    model: m[3]!.trim().replace(/\s+/g, " "),
  };
}

function parseIntField(text: string, labels: string[]): string {
  const raw = fieldAfterLabel(text, labels);
  if (!raw) return "";
  const n = parseOdometerNumber(raw.replace(/[^\d,]/g, ""));
  return n != null ? String(n) : "";
}

function parseOdometerKm(text: string): string {
  const patterns = [
    /(?:odometer|mileage|last\s+reported\s+odometer)[^0-9\n]{0,40}([\d,]{2,7})\s*(miles?|mi|km|kilometers?|kilometres?)?/i,
    /([\d,]{2,7})\s*(miles?|mi)\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const n = parseOdometerNumber(m[1]);
    if (n == null || n <= 0) continue;
    const hint = m[2] ? m[2] : unitHintFromSnippet(m[0] ?? "");
    return String(readingToKm(n, hint));
  }
  return "";
}

function boolFlag(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

function parseTitleStatus(text: string): string {
  if (/\bsalvage\b/i.test(text) && /\btitle\b/i.test(text)) return "salvage";
  if (/\brebuilt\b/i.test(text) && /\btitle\b/i.test(text)) return "rebuilt";
  if (/\blemon\b/i.test(text)) return "lemon";
  const labeled = fieldAfterLabel(text, ["Title\\s*(?:brand|status|issue)?", "Title"]);
  if (labeled) {
    const lower = labeled.toLowerCase();
    if (lower.includes("salvage")) return "salvage";
    if (lower.includes("clean") || lower.includes("clear")) return "clean";
    return labeled.slice(0, 40);
  }
  if (/\bclean\s+title\b/i.test(text) || /\bclear\s+title\b/i.test(text)) return "clean";
  return "";
}

type HistoryHit = { date: string; description: string; odometerKm: string; location: string };

function parseHistoryBlocks(text: string): HistoryHit[] {
  const hits: HistoryHit[] = [];
  // Lines that look like: 03/15/2021 ... 45230 miles ... Damage / Accident ...
  const lineRe =
    /((?:0?[1-9]|1[0-2])[\/\-.](?:0?[1-9]|[12]\d|3[01])[\/\-.](?:19|20)\d{2})\s+(.{10,160})/gi;
  for (const m of text.matchAll(lineRe)) {
    const date = toIsoDate(m[1]!);
    const rest = m[2]!.trim();
    const odoM = rest.match(/([\d,]{2,7})\s*(miles?|mi|km|kilometers?)?/i);
    let odometerKm = "";
    if (odoM?.[1]) {
      const n = parseOdometerNumber(odoM[1]);
      if (n != null) odometerKm = String(readingToKm(n, odoM[2] ?? unitHintFromSnippet(odoM[0])));
    }
    const locationM = rest.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2})\b/);
    const location = locationM ? `${locationM[1]}, ${locationM[2]}` : "";
    hits.push({ date, description: rest.slice(0, 200), odometerKm, location });
    if (hits.length >= 40) break;
  }
  return hits;
}

function isAccidentish(desc: string): boolean {
  return /\b(accident|collision|damage|crash|hit|rear.?end|front.?end|side.?impact|airbag|structural)\b/i.test(desc);
}

function isMileageish(desc: string): boolean {
  return /\b(odometer|mileage|inspection|service|registration|renewal|emission|smog|title\/registration|reported)\b/i.test(desc)
    || /[\d,]{2,7}\s*(miles?|mi|km)\b/i.test(desc);
}

function isOwnerish(desc: string): boolean {
  return /\b(owner|purchased|sold|title\s+issued|registration\s+issued|first\s+owner|personal|lease|fleet)\b/i.test(desc);
}

function buildAccidents(hits: HistoryHit[], text: string): CatalogAccidentForm[] {
  const fromHits = hits
    .filter((h) => isAccidentish(h.description))
    .map((h) => ({
      ...EMPTY_ACCIDENT,
      date: h.date,
      description: h.description.replace(/\s+/g, " ").slice(0, 240),
      location: h.location,
      type: /flood|water/i.test(h.description) ? "flood" : "collision",
      severity: /severe|major|structural/i.test(h.description)
        ? "major"
        : /minor|cosmetic/i.test(h.description)
          ? "minor"
          : "",
      odometerAtLoss: h.odometerKm,
      currency: "USD",
    }));

  if (fromHits.length > 0) return fromHits;

  // Fallback: numbered accident sections
  if (/\bno\s+accidents?\s+(?:reported|found)\b/i.test(text)) return [];
  const accidentSection = text.match(
    /(?:accident|damage)\s*(?:\/\s*damage)?\s*history([\s\S]{0,4000}?)(?:(?:owner|title|odometer|service)\s+history|$)/i,
  );
  if (!accidentSection) return [];
  const block = accidentSection[1] ?? "";
  const dates = [...block.matchAll(new RegExp(DATE_RE.source, "gi"))];
  return dates.slice(0, 15).map((d) => ({
    ...EMPTY_ACCIDENT,
    date: toIsoDate(d[1] ?? d[0]!),
    description: "Accident / damage reported",
    type: "collision",
    currency: "USD",
  }));
}

function buildMileage(hits: HistoryHit[], latestKm: string): CatalogMileageForm[] {
  const rows = hits
    .filter((h) => h.odometerKm && (isMileageish(h.description) || !isAccidentish(h.description)))
    .map((h) => ({
      ...EMPTY_MILEAGE,
      date: h.date,
      odometer: h.odometerKm,
      unit: "km",
      source: "provider_pdf",
      location: h.location,
      description: h.description.replace(/\s+/g, " ").slice(0, 200),
    }));

  // Dedupe by date+odo
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
      source: "provider_pdf",
      description: "Last reported odometer",
    }];
  }
  return unique.slice(0, 40);
}

function buildOwners(hits: HistoryHit[], ownerCount: string): CatalogOwnerForm[] {
  const rows = hits
    .filter((h) => isOwnerish(h.description))
    .map((h) => ({
      ...EMPTY_OWNER,
      date: h.date,
      location: h.location,
      mileage: h.odometerKm,
      condition: "",
      lotStatus: "",
    }));

  if (rows.length > 0) return rows.slice(0, 20);

  const n = Number(ownerCount);
  if (Number.isFinite(n) && n > 0) {
    return Array.from({ length: Math.min(n, 8) }, () => ({ ...EMPTY_OWNER }));
  }
  return [];
}

function parseOwnerCount(text: string): string {
  const m = text.match(
    /(?:number\s+of\s+owners|owner\s+count|owners?\s*(?:reported)?)\s*[:#]?\s*(\d{1,2})\b/i,
  );
  if (m?.[1]) return m[1];
  const alt = text.match(/\b(\d{1,2})\s+owners?\b/i);
  return alt?.[1] ?? "";
}

function parseAccidentCount(text: string, accidents: CatalogAccidentForm[]): string {
  if (/\bno\s+accidents?\s+(?:reported|found)\b/i.test(text)) return "0";
  const m = text.match(
    /(?:accidents?\s*(?:reported|found|count)?|accident\s+count)\s*[:#]?\s*(\d{1,2})\b/i,
  );
  if (m?.[1]) return m[1];
  if (accidents.length > 0) return String(accidents.length);
  return "";
}

function parseEngine(text: string): string {
  const labeled = fieldAfterLabel(text, ["Engine(?:\\s*size|\\s*type)?", "Engine"]);
  if (labeled) return labeled.slice(0, 60);
  const m = text.match(/\b(\d(?:\.\d)?\s*L(?:\s*[A-Za-z0-9\-]+)?(?:\s*V?\d)?)\b/);
  return m?.[1]?.trim() ?? "";
}

function parseHp(text: string): string {
  const m = text.match(/\b(\d{2,4})\s*(?:hp|horsepower)\b/i);
  return m?.[1] ?? "";
}

function parseCylinders(text: string): string {
  const m = text.match(/\b(\d)\s*(?:cyl|cylinders?)\b/i)
    || text.match(/\bV(\d)\b/);
  return m?.[1] ?? "";
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

  const ymm = parseYearMakeModelLine(text);
  const year = fieldAfterLabel(text, ["Year"]) ?? ymm.year ?? "";
  const make = fieldAfterLabel(text, ["Make"]) ?? ymm.make ?? "";
  let model = fieldAfterLabel(text, ["Model"]) ?? "";
  if (!model && ymm.model) {
    // ymm.model may include trim words — keep as model
    model = ymm.model.split(/\s+/).slice(0, 3).join(" ");
  }
  const trim = fieldAfterLabel(text, ["Trim(?:\\s*level)?", "Style", "Series"]) ?? "";
  const transmission = fieldAfterLabel(text, ["Transmission", "Trans"]) ?? "";
  const fuelType = fieldAfterLabel(text, ["Fuel(?:\\s*type)?", "Fuel"]) ?? "";
  const bodyType = fieldAfterLabel(text, ["Body(?:\\s*style|\\s*type)?", "Body"]) ?? "";
  const color = fieldAfterLabel(text, [
    "Exterior\\s*color",
    "Color",
    "Ext(?:erior)?\\.?\\s*color",
  ]) ?? "";

  const odometer = parseOdometerKm(text);
  const hits = parseHistoryBlocks(text);
  const accidents = buildAccidents(hits, text);
  const ownerCount = parseOwnerCount(text) || parseIntField(text, ["Owners?"]);
  const accidentCount = parseAccidentCount(text, accidents);
  const mileageHistory = buildMileage(hits, odometer);
  const ownerHistory = buildOwners(hits, ownerCount);

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
    /\btaxi\b/i,
    /\brideshare\b/i,
    /\buber\b/i,
    /\blyft\b/i,
  ]);

  const form: Omit<VinCatalogFormState, "photos"> = {
    ...emptyFormWithoutPhotos(),
    year: year.replace(/\D/g, "").slice(0, 4),
    make: make.slice(0, 40),
    model: model.slice(0, 60),
    trim: trim.slice(0, 40),
    engine: parseEngine(text),
    transmission: transmission.slice(0, 40),
    fuelType: fuelType.slice(0, 40),
    bodyType: bodyType.slice(0, 40),
    color: color.slice(0, 40),
    country: "us",
    odometer,
    ownerCount,
    accidentCount,
    hp: parseHp(text),
    cylinders: parseCylinders(text),
    titleStatus: parseTitleStatus(text),
    isSalvage,
    isStolen,
    isTaxi,
    isFlooded,
    floodCount: isFlooded ? "1" : "",
    accidents,
    mileageHistory,
    ownerHistory,
  };

  const summary: string[] = [];
  if (provider !== "unknown") summary.push(`Detected ${provider === "carfax" ? "Carfax" : "AutoCheck"}`);
  else summary.push("Provider not clearly detected — best-effort parse");
  if (form.year || form.make || form.model) {
    summary.push([form.year, form.make, form.model].filter(Boolean).join(" "));
  }
  if (form.odometer) summary.push(`Odometer ${form.odometer} km`);
  if (form.accidents.length) summary.push(`${form.accidents.length} accident row(s)`);
  if (form.mileageHistory.length) summary.push(`${form.mileageHistory.length} mileage row(s)`);
  if (form.ownerHistory.length) summary.push(`${form.ownerHistory.length} owner row(s)`);

  return { ok: true, provider, vinFound, form, summary };
}
