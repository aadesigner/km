/** Free Carstat USA check-records peek — does NOT call paid /api/reports. */
import {
  checkCarstatUsaRecords,
  checkRecordsUrl,
  resolveCarstatUsaApiConfig,
} from "../src/lib/carstatUsaApi.ts";

const vin = String(process.argv[2] ?? "7FARW2H56JE022576").trim().toUpperCase();
const cfg = await resolveCarstatUsaApiConfig();
if (!cfg) {
  console.log(JSON.stringify({ ok: false, error: "Carstat USA not configured or disabled" }, null, 2));
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      endpoint: checkRecordsUrl(cfg.baseUrl, vin),
      note: "free check-records only — no paid /api/reports call",
    },
    null,
    2,
  ),
);

const result = await checkCarstatUsaRecords(vin);
console.log(JSON.stringify(result, null, 2));
process.exit(0);
