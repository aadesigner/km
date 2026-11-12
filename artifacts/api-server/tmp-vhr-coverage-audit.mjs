import { db, providersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { normalizeCarstatVhrJsonPayloads } from "./src/lib/carstatVhrNormalize.ts";

const [p] = await db.select({ apiKey: providersTable.apiKey }).from(providersTable).where(eq(providersTable.name, "Carstat")).limit(1);
const key = p.apiKey.trim();
const headers = { Accept: "application/json", "Content-Type": "application/json", "x-api-key": key };

async function getJson(vin, sourceId) {
  let body = await fetch("https://carstat.dev/api/vhr/reports", {
    method: "POST", headers,
    body: JSON.stringify({ vin, source_id: sourceId, formats: ["json"], language: "en" }),
  }).then(r => r.json());
  for (let i = 0; i < 12 && body.status_url && !["completed","failed","not_found"].includes(String(body.status).toLowerCase()); i++) {
    await new Promise(r => setTimeout(r, 1000));
    body = await fetch(body.status_url, { headers }).then(r => r.json());
  }
  if (!body.files?.json) return null;
  return fetch(body.files.json).then(r => r.json());
}

function walkKeys(obj, prefix = "", out = new Set(), depth = 0) {
  if (depth > 5 || obj == null) return out;
  if (Array.isArray(obj)) {
    if (obj[0]) walkKeys(obj[0], prefix + "[]", out, depth + 1);
    return out;
  }
  if (typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    out.add(p);
    if (v && typeof v === "object") walkKeys(v, p, out, depth + 1);
  }
  return out;
}

const jobs = [
  ["7FARW2H56JE022576", 1],
  ["7FARW2H56JE022576", 2],
  ["7FARW2H56JE022576", 3],
  ["KMHB3518BNW003977", 5],
  ["KNAF241BEMA915413", 68],
  ["KMTG341ABMU089876", 4],
];

const audit = [];
for (const [vin, sid] of jobs) {
  const json = await getJson(vin, sid);
  if (!json) { audit.push({ vin, sid, missing: true }); continue; }
  const sections = json.source?.sections || [];
  const keys = [...walkKeys(json)].sort();
  const norm = normalizeCarstatVhrJsonPayloads([json], { vin });
  const usedHints = [
    "make","model","year","country","odometer","photos","mileageHistory","auctionHistory",
    "accidents","insuranceClaims","ownerHistory","vehicleExtras","marketData","isFlooded","trim","engine","fuelType","bodyType","color","hp"
  ];
  audit.push({
    vin, sid,
    sectionTypes: sections.map(s => s.type + (s.items?.[0]?.korea_section ? `:${s.items[0].korea_section}` : "")),
    keyCount: keys.length,
    sampleListingKeys: sections.find(s => s.type === "listings")?.items?.[0] ? Object.keys(sections.find(s => s.type === "listings").items[0]) : null,
    koreaSections: sections.filter(s => s.type === "korean_insurance").map(s => s.items?.[0]?.korea_section),
    historyItemKeys: sections.find(s => s.type === "history")?.items?.[0] ? Object.keys(sections.find(s => s.type === "history").items[0]) : null,
    normSummary: Object.fromEntries(usedHints.map(k => {
      const v = norm[k];
      if (Array.isArray(v)) return [k, v.length];
      if (v && typeof v === "object") return [k, Object.keys(v).filter(x => v[x] != null).length];
      return [k, v ?? null];
    })),
    // pricing-ish raw fields present?
    pricingSignals: keys.filter(k => /price|bid|value|estimate|average|avg|market|acv|cash/i.test(k)).slice(0, 80),
  });
  writeFileSync(`tmp-full-${sid}.json`, JSON.stringify(json));
}

writeFileSync("tmp-vhr-coverage-audit.json", JSON.stringify(audit, null, 2));
console.error("ok");
