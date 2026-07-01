/**
 * Probe Carstat local-exists + local-report for a VIN.
 * Usage: node scripts/probe-vin.mjs YV1MC67278J058366
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const vin = (process.argv[2] ?? "").toUpperCase();
if (vin.length !== 17) {
  console.error("Usage: node scripts/probe-vin.mjs <17-char-vin>");
  process.exit(1);
}

function loadEnv() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* ignore */ }
}

loadEnv();

const sql = postgres(process.env.DATABASE_URL);
const [provider] = await sql`
  SELECT id, name, base_url, api_key, is_active
  FROM providers
  WHERE is_active = true
  ORDER BY id
  LIMIT 1
`;

if (!provider?.api_key) {
  console.error("No active provider with api_key in DB");
  process.exit(1);
}

const base = String(provider.base_url).replace(/\/$/, "").replace("://api.carstat.dev", "://carstat.dev");
const headers = { Accept: "application/json", "x-api-key": provider.api_key };

async function probe(label, url) {
  console.log(`\n=== ${label} ===`);
  console.log("URL:", url);
  const res = await fetch(url, { headers });
  const text = await res.text();
  console.log("HTTP:", res.status);
  try {
    console.log("Body:", JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log("Body (raw):", text.slice(0, 2000));
  }
}

console.log("Provider:", provider.name, "| base:", base, "| key prefix:", provider.api_key.slice(0, 8) + "...");

await probe("local-exists", `${base}/api/local-exists/${encodeURIComponent(vin)}`);
await probe("local-report", `${base}/api/local-report/${encodeURIComponent(vin)}`);

await sql.end();
