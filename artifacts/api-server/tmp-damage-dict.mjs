import { db, providersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";
const [p] = await db.select({ apiKey: providersTable.apiKey }).from(providersTable).where(eq(providersTable.name, "Carstat")).limit(1);
const key = p.apiKey.trim();
const headers = { Accept: "application/json", "x-api-key": key };
// Try common dictionary endpoints
const urls = [
  "https://carstat.dev/api/vhr/dictionaries",
  "https://carstat.dev/api/vhr/damage-types",
  "https://carstat.dev/api/vhr/enums",
  "https://carstat.dev/api/dictionaries/damage",
  "https://carstat.dev/api/vhr/sources/1",
];
const out = {};
for (const url of urls) {
  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    const t = await r.text();
    out[url] = { status: r.status, body: t.slice(0, 500) };
  } catch (e) { out[url] = { error: String(e) }; }
}
// Also search localization paths inside a fresh report purchase if cheap
const buy = await fetch("https://carstat.dev/api/vhr/reports", {
  method: "POST", headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ vin: "7FARW2H56JE022576", source_id: 1, formats: ["json"], language: "en" }),
  signal: AbortSignal.timeout(20000),
}).then(r => r.json());
out.buyStatus = buy.status;
out.buyFiles = buy.files;
if (buy.files?.json) {
  const j = await fetch(buy.files.json).then(r => r.json());
  const listing = j.source?.sections?.find(s => s.type === "listings")?.items?.[0];
  out.listingDamageFields = listing ? Object.fromEntries(Object.entries(listing).filter(([k,v]) => /damage|label|condition|market|lot|currency|estimate|pre_accident|airbag/i.test(k))) : null;
  // deep search for damage name maps
  const blob = JSON.stringify(j);
  out.hasFrontEnd = /front.?end|Front End/i.test(blob);
  out.hasDamageName = /"damage_name"|main_damage_label|damage_label/i.test(blob);
  const m = blob.match(/damage[^"]{0,40}/gi)?.slice(0, 30);
  out.damageMentions = m;
}
writeFileSync("tmp-damage-dict.json", JSON.stringify(out, null, 2));
console.error("ok");
