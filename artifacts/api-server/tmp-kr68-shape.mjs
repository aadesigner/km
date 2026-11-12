import { writeFileSync } from "node:fs";
import { db, providersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
const [p] = await db.select({ apiKey: providersTable.apiKey }).from(providersTable).where(eq(providersTable.name, "Carstat")).limit(1);
const key = p.apiKey.trim();
const headers = { Accept: "application/json", "Content-Type": "application/json", "x-api-key": key };
const vin = "KNAF241BEMA915413";
let body = await fetch("https://carstat.dev/api/vhr/reports", {
  method: "POST", headers,
  body: JSON.stringify({ vin, source_id: 68, formats: ["json"], language: "en" }),
}).then(r => r.json());
for (let i = 0; i < 10 && body.status_url && !["completed","failed","not_found"].includes(String(body.status).toLowerCase()); i++) {
  await new Promise(r => setTimeout(r, 1200));
  body = await fetch(body.status_url, { headers }).then(r => r.json());
}
const json = await fetch(body.files.json).then(r => r.json());
const sections = json.source?.sections || [];
const summary = sections.map(s => ({
  type: s.type,
  title: s.title,
  itemCount: Array.isArray(s.items) ? s.items.length : 0,
  item0Keys: s.items?.[0] && typeof s.items[0] === "object" ? Object.keys(s.items[0]).slice(0, 40) : null,
  item0sample: s.items?.[0] ? JSON.parse(JSON.stringify(s.items[0], null, 0).slice?.(0) || "x") : null,
}));
// smaller samples
const slim = sections.map(s => ({
  type: s.type,
  title: s.title,
  n: (s.items||[]).length,
  sample: (s.items||[])[0] ?? null,
}));
writeFileSync("tmp-kr68-shape.json", JSON.stringify({ top: Object.keys(json), sectionCount: sections.length, slim }, null, 2));

// also history source 5
let h = await fetch("https://carstat.dev/api/vhr/reports", {
  method: "POST", headers,
  body: JSON.stringify({ vin: "KMHB3518BNW003977", source_id: 5, formats: ["json"], language: "en" }),
}).then(r => r.json());
for (let i = 0; i < 10 && h.status_url && !["completed","failed","not_found"].includes(String(h.status).toLowerCase()); i++) {
  await new Promise(r => setTimeout(r, 1200));
  h = await fetch(h.status_url, { headers }).then(r => r.json());
}
const hj = h.files?.json ? await fetch(h.files.json).then(r => r.json()) : null;
writeFileSync("tmp-hist5-shape.json", JSON.stringify({
  sections: (hj?.source?.sections||[]).map(s => ({ type: s.type, title: s.title, n: (s.items||[]).length, sample: (s.items||[])[0] })),
}, null, 2));
console.error("ok");
