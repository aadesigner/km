/**
 * Bulk-repair zigzag mileageHistory on vin_catalog (and matching vin_lookups).
 * Dry-run by default — pass --write to persist.
 * Production: also runs once automatically on API boot (one_shot marker).
 *
 * Usage:
 *   pnpm exec tsx --import ./load-env.mjs scripts/repair-catalog-mileage.mjs
 *   pnpm exec tsx --import ./load-env.mjs scripts/repair-catalog-mileage.mjs --write
 *   pnpm exec tsx --import ./load-env.mjs scripts/repair-catalog-mileage.mjs --write --limit 500
 *   pnpm exec tsx --import ./load-env.mjs scripts/repair-catalog-mileage.mjs --vin WBA...
 */
import { runCatalogMileageRepairBatch } from "../src/lib/mileageHistoryRepairJob.js";

const args = process.argv.slice(2);
const write = args.includes("--write");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? Math.max(1, Number(args[limitIdx + 1]) || 0) : undefined;
const vinIdx = args.indexOf("--vin");
const vin = vinIdx >= 0 ? String(args[vinIdx + 1] ?? "").trim().toUpperCase() : undefined;

const result = await runCatalogMileageRepairBatch({
  write,
  limit: limit && limit > 0 ? limit : undefined,
  vin: vin || undefined,
});

console.log(JSON.stringify({ mode: write ? "write" : "dry-run", ...result }, null, 2));

if (!write && result.changed > 0) {
  console.log("\nDry-run only. Re-run with --write to persist (or deploy — boot runs this once).");
}

process.exit(0);
