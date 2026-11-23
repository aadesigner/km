/**
 * Live QA: post-pay Korean Insurance (68) last-resort buy.
 * Usage: node --env-file=../../.env --import tsx tmp-qa-kr68-last-resort.mjs [VIN]
 * Default VIN: KNAF241BEMA915413 (known KR insurance demo from coverage audit).
 *
 * Does NOT charge if dry-run? This script DOES buy report 68 (costs tokens).
 * Pass --check-only to only run /checks without buying.
 */
import { eq } from "drizzle-orm";
import { db, providersTable } from "@workspace/db";
import {
  checkCarstatVhrAvailability,
  fetchCarstatVhrReport,
  buildForcedKoreanBuyList,
  shouldForceKoreanInsuranceReport,
  hasStructuredVhrReport,
  VHR_KOREAN_INSURANCE_ID,
} from "./src/lib/carstatVhrApi.ts";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check-only");
const vinArg = args.find((a) => !a.startsWith("--"));
const vin = (vinArg ?? "KNAF241BEMA915413").trim().toUpperCase();

const [p] = await db
  .select({ name: providersTable.name, apiKey: providersTable.apiKey })
  .from(providersTable)
  .where(eq(providersTable.isActive, true))
  .limit(5);
if (!p?.apiKey?.trim()) {
  console.error("FAIL: no active provider api key in DB");
  process.exit(1);
}
console.log("provider_row", p.name, "key_len", p.apiKey.trim().length);
console.log("vin", vin);

const forceGate = await shouldForceKoreanInsuranceReport(vin);
console.log("force_gate", forceGate);

const probe = await checkCarstatVhrAvailability(vin, { phase: "probe" });
console.log("peek_check", {
  status: probe.status,
  selected: probe.status === "exists" ? probe.selectedSources.map((s) => s.sourceId) : null,
});

const fulfill = await checkCarstatVhrAvailability(vin, { phase: "fulfill" });
console.log("fulfill_check", {
  status: fulfill.status,
  selected: fulfill.status === "exists" ? fulfill.selectedSources.map((s) => s.sourceId) : null,
  includes68:
    fulfill.status === "exists"
    && fulfill.selectedSources.some((s) => s.sourceId === VHR_KOREAN_INSURANCE_ID),
});

if (checkOnly) {
  console.log("done --check-only (no report purchase)");
  process.exit(0);
}

if (!forceGate.force && fulfill.status !== "exists") {
  console.log("SKIP buy: not Korean-market and fulfill check miss");
  process.exit(0);
}

const selected =
  fulfill.status === "exists"
    ? fulfill.selectedSources
    : buildForcedKoreanBuyList(vin);
console.log("buying", selected.map((s) => s.sourceId));

try {
  const data = await fetchCarstatVhrReport(vin, selected);
  const structured = hasStructuredVhrReport(data);
  console.log("RESULT deliverable", {
    structured,
    dataSource: data.dataSource,
    make: data.make ?? null,
    year: data.year ?? null,
    odometer: data.odometer ?? null,
    mileageHistory: data.mileageHistory?.length ?? 0,
    insuranceClaims: data.insuranceClaims?.length ?? 0,
    accidents: data.accidents?.length ?? 0,
    vhrReports: Array.isArray(data.vhrReports) ? data.vhrReports.length : 0,
  });
  if (!structured) {
    console.error("FAIL: expected structured data after buy (would go pending)");
    process.exit(2);
  }
  console.log("PASS: would show report as usual");
  process.exit(0);
} catch (err) {
  const code = err && typeof err === "object" && "code" in err ? err.code : null;
  console.log("RESULT no_data_or_error", {
    code,
    message: err instanceof Error ? err.message : String(err),
  });
  if (code === "VIN_NO_DATA") {
    console.log("PASS path: VIN_NO_DATA → fulfillment pending_manual");
    process.exit(0);
  }
  console.error("FAIL unexpected error");
  process.exit(1);
}
