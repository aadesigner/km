import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const vin = (process.argv[2] ?? "").toUpperCase();
if (vin.length !== 17) {
  console.error("Usage: node lib/db/scripts/probe-catalog-vin.mjs <vin>");
  process.exit(1);
}

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const catalog = await c.query("SELECT data FROM vin_catalog WHERE vin = $1", [vin]);
console.log("=== CATALOG ===");
console.log(JSON.stringify(catalog.rows[0]?.data ?? null, null, 2));

const providerRes = await c.query(
  "SELECT base_url, api_key FROM providers WHERE is_active = true ORDER BY id LIMIT 1",
);
const provider = providerRes.rows[0];
if (provider?.api_key) {
  const base = String(provider.base_url).replace(/\/$/, "").replace("://api.carstat.dev", "://carstat.dev");
  const url = `${base}/api/local-report/${encodeURIComponent(vin)}`;
  const res = await fetch(url, { headers: { Accept: "application/json", "x-api-key": provider.api_key } });
  const text = await res.text();
  console.log("\n=== RAW PROVIDER HTTP", res.status, "===");
  try {
    const body = JSON.parse(text);
    const raw = body.data?.[0] ?? body.data ?? body;
    const lots = raw.lots ?? [];
    console.log("LOT COUNT:", lots.length);
    if (lots[0]) {
      console.log("FIRST LOT KEYS:", Object.keys(lots[0]).sort().join(", "));
      console.log("FIRST LOT:", JSON.stringify(lots[0], null, 2));
    }
  } catch {
    console.log(text.slice(0, 5000));
  }

  const { fetchFromProvider } = await import(
    "../../../artifacts/api-server/src/lib/vinService.ts"
  );
  const normalized = await fetchFromProvider(vin, provider.base_url, provider.api_key);
  console.log("\n=== NORMALIZED ===");
  console.log(JSON.stringify(normalized, null, 2));
}

await c.end();
