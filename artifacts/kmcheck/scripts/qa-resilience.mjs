/**
 * QA: client resilience + caching invariants (static checks + optional live API probes).
 *
 * Usage:
 *   node artifacts/kmcheck/scripts/qa-resilience.mjs
 *   API_BASE=http://127.0.0.1:5000 node artifacts/kmcheck/scripts/qa-resilience.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = join(root, "..", "api-server");
let errors = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  errors++;
}

function read(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`missing file ${rel}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readApi(rel) {
  const path = join(apiRoot, rel);
  if (!existsSync(path)) {
    fail(`missing api file ${rel}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

// ── Static: unified public-settings cache ─────────────────────────────────────
const publicSettings = read("src/lib/public-settings.ts");
if (!publicSettings.includes("PUBLIC_SETTINGS_QUERY_KEY")) {
  fail("public-settings.ts must export PUBLIC_SETTINGS_QUERY_KEY");
}
for (const f of [
  "src/hooks/use-site-public-flags.ts",
  "src/hooks/use-krw-per-usd.ts",
  "src/components/site-analytics.tsx",
  "src/components/warm-cache.tsx",
]) {
  const src = read(f);
  if (!src.includes("PUBLIC_SETTINGS_QUERY_KEY") && !src.includes("public-settings")) {
    fail(`${f} should use shared public-settings module`);
  }
}
if (read("src/components/vin-access-gate.tsx").includes("access-gate")) {
  fail("vin-access-gate must not use a separate React Query key (share /api/vin/public cache)");
}

// ── Static: error boundaries reset on navigation ──────────────────────────────
if (!read("src/components/error-boundary.tsx").includes("resetKey")) {
  fail("RouteErrorBoundary must support resetKey");
}
if (!read("src/App.tsx").includes("resetKey")) {
  fail("App.tsx should pass resetKey to RouteErrorBoundary wrappers");
}

// ── Static: query client hardening ────────────────────────────────────────────
const queryClient = read("src/lib/query-client.ts");
if (!queryClient.includes("mutations") || !queryClient.includes("retry: 0")) {
  fail("query-client.ts must set mutations.retry to 0");
}
if (!queryClient.includes("429")) {
  fail("query-client.ts should skip retry on HTTP 429");
}

// ── Static: dashboard seeds VIN report cache ──────────────────────────────────
const dashboard = read("src/pages/dashboard.tsx");
if (!dashboard.includes("seedVinLookupsFromHistory")) {
  fail("dashboard.tsx must call seedVinLookupsFromHistory after history loads");
}

// ── Static: API VIN public no-store + lookup mutex ────────────────────────────
const vinRoute = readApi("src/routes/vin.ts");
if (!vinRoute.includes('Cache-Control", "private, no-store') && !vinRoute.includes("private, no-store")) {
  fail("GET /vin/public must set Cache-Control: private, no-store");
}
if (!vinRoute.includes("withUserVinLookupLock")) {
  fail("POST /vin/lookup provider path must use withUserVinLookupLock");
}

const trustedClient = readApi("src/lib/trustedClient.ts");
if (!trustedClient.includes('"/vin/image"')) {
  fail("trustedClient must exempt /vin/image (img tags cannot send X-Kmcheck-Client)");
}

if (!vinRoute.includes("findCompleteUserLookup")) {
  fail("POST /vin/lookup must re-check for existing lookup before insert");
}

// ── Static: health probe pings DB ─────────────────────────────────────────────
const health = readApi("src/routes/health.ts");
if (!health.includes("SELECT 1")) {
  fail("/healthz must ping the database");
}

// ── Static: client error translation coverage ─────────────────────────────────
const translateErr = read("src/lib/translate-client-error.ts");
const translateCodes = read("src/lib/translate-client-error.codes.ts");
if (!translateErr.includes("error_request_failed")) {
  fail("translate-client-error.ts must not fall back to vague copy only");
}
if (!translateErr.includes("ERROR_CODE_KEYS")) {
  fail("translate-client-error.ts must map API codes explicitly");
}
for (const code of ["PAYMENT_REQUIRED", "MAINTENANCE", "banned", "VIN_NO_DATA"]) {
  if (!translateErr.includes(`${code}:`)) {
    fail(`translate-client-error.ts missing code mapping for ${code}`);
  }
}
for (const key of ["error_request_failed", "error_server_busy", "error_network"]) {
  if (!read("src/i18n/en.json").includes(`"${key}"`)) {
    fail(`en.json missing ${key}`);
  }
}
if (!read("src/App.tsx").includes("AuthSubPage")) {
  fail("App.tsx should use AuthSubPage with resetKey for password routes");
}

// ── Static: rate-limit i18n ───────────────────────────────────────────────────
for (const lang of ["en", "ar", "uk", "ru", "sq"]) {
  const dict = read(`src/i18n/${lang}.json`);
  if (!dict.includes("error_rate_limit")) {
    fail(`${lang}.json missing error_rate_limit`);
  }
}

// ── Optional live API probes ──────────────────────────────────────────────────
const apiBase = (process.env.API_BASE ?? "").replace(/\/$/, "");

async function liveProbe() {
  console.log(`Live probes → ${apiBase}`);

  const healthRes = await fetch(`${apiBase}/api/healthz`);
  if (!healthRes.ok) {
    fail(`/api/healthz returned ${healthRes.status}`);
  } else {
    const body = await healthRes.json();
    if (body.status !== "ok") fail(`/api/healthz status not ok: ${JSON.stringify(body)}`);
  }

  const settingsRes = await fetch(`${apiBase}/api/payments/public-settings`);
  if (!settingsRes.ok) {
    fail(`/api/payments/public-settings returned ${settingsRes.status}`);
  }
  const cc = settingsRes.headers.get("cache-control") ?? "";
  if (!/no-store|private/i.test(cc)) {
    console.warn("WARN: public-settings Cache-Control is", cc || "(none)");
  }

  const badVin = await fetch(`${apiBase}/api/vin/public/NOT_A_VALID_VIN_17`);
  if (badVin.status !== 400) {
    fail(`invalid VIN on /vin/public should 400, got ${badVin.status}`);
  }
  const noStore = badVin.headers.get("cache-control") ?? "";
  if (!/no-store/i.test(noStore)) {
    fail(`/vin/public must send no-store (got ${noStore || "none"})`);
  }

  const overload = await Promise.all(
    Array.from({ length: 12 }, () => fetch(`${apiBase}/api/healthz`)),
  );
  const okCount = overload.filter((r) => r.ok).length;
  if (okCount < 10) {
    fail(`burst healthz: only ${okCount}/12 succeeded`);
  }
}

if (apiBase) {
  try {
    await liveProbe();
  } catch (err) {
    fail(`live probe error: ${err instanceof Error ? err.message : String(err)}`);
  }
} else {
  console.log("Skip live probes (set API_BASE to enable)");
}

if (errors === 0) {
  console.log("OK — resilience QA passed");
} else {
  console.error(`FAILED — ${errors} issue(s)`);
  process.exit(1);
}
