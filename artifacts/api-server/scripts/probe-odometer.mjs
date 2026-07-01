import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const vin = (process.argv[2] ?? "WBA7G6104GG509390").toUpperCase();
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const cat = await c.query(
  `SELECT updated_at, data FROM vin_catalog WHERE vin = $1`,
  [vin],
);
const lu = await c.query(
  `SELECT id, updated_at, status, data FROM vin_lookups WHERE vin = $1 ORDER BY updated_at DESC LIMIT 3`,
  [vin],
);

function pick(data) {
  if (!data) return null;
  return {
    odometer: data.odometer ?? null,
    mileage: data.mileage ?? null,
    odometerLocked: data.odometerLocked ?? null,
    mileageHistory: Array.isArray(data.mileageHistory)
      ? data.mileageHistory.map((e) => ({ date: e.date, odometer: e.odometer, source: e.source }))
      : [],
    ownerMax: Array.isArray(data.ownerHistory)
      ? Math.max(0, ...data.ownerHistory.map((o) => Number(o.mileage) || 0))
      : null,
  };
}

console.log(JSON.stringify({
  vin,
  catalog: cat.rows[0]
    ? { updated_at: cat.rows[0].updated_at, ...pick(cat.rows[0].data) }
    : null,
  lookups: lu.rows.map((r) => ({
    id: r.id,
    updated_at: r.updated_at,
    status: r.status,
    ...pick(r.data),
  })),
}, null, 2));

await c.end();
