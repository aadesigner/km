/**
 * QA: admin routing + dashboard stability invariants (static).
 * Usage: node artifacts/kmcheck/scripts/qa-admin-routes.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const app = read("src/App.tsx");
const layout = read("src/pages/admin/layout.tsx");
const index = read("src/pages/admin/index.tsx");
const notFound = read("src/pages/admin/not-found.tsx");
const adminQueryOpts = read("src/lib/admin-query-options.ts");

// ── Admin 404 must stay inside admin shell ───────────────────────────────────
if (!notFound.includes("Admin page not found")) {
  fail("admin/not-found.tsx must render admin-specific 404 copy");
}
if (!app.includes("AdminNotFound")) {
  fail("App.tsx must import AdminNotFound");
}
if (!app.includes('path="/adminx/:rest*"')) {
  fail("App.tsx must register /adminx/:rest* catch-all before global 404");
}
if (!app.includes("normalizeAppPath")) {
  fail("App.tsx AppRouter must normalize paths (trailing slash fix)");
}
if (!app.includes('if (pathname.startsWith("/adminx"))')) {
  fail("NotFoundLang must delegate /adminx/* to AdminCatchAllRoute as safety net");
}

// Catch-all must come after concrete admin routes
const catchIdx = app.indexOf('path="/adminx/:rest*"');
const usersIdx = app.indexOf('path="/adminx/users"');
const overviewIdx = app.indexOf('path="/adminx" component={AdminOverviewRoute}');
if (catchIdx < 0 || usersIdx < 0 || overviewIdx < 0) {
  fail("App.tsx missing expected admin routes");
} else if (!(overviewIdx < usersIdx && usersIdx < catchIdx)) {
  fail("/adminx catch-all must be registered after specific admin routes");
}

// AdminLayout should be eagerly imported (avoids chunk-load 404 flashes)
if (!app.includes('import { AdminLayout } from "@/pages/admin/layout"')) {
  fail("AdminLayout must be eagerly imported in App.tsx");
}

// ── Nav links must have matching routes ───────────────────────────────────────
const navHrefs = [...layout.matchAll(/href: "(\/adminx[^"]*)"/g)].map((m) => m[1]);
for (const href of navHrefs) {
  const needle = href.includes(":")
    ? href.split("/:")[0]
    : href;
  if (!app.includes(`path="${href}"`) && !app.includes(`"${needle}`)) {
    // allow partial paths for detail routes
    if (!app.includes(needle.replace("/adminx", "/adminx"))) {
      fail(`admin nav href ${href} has no obvious Route in App.tsx`);
    }
  }
}

for (const href of navHrefs) {
  if (!app.includes(`"${href}"`)) {
    fail(`admin nav href ${href} missing from App.tsx routes`);
  }
}

// ── Dashboard performance guards ─────────────────────────────────────────────
if (index.includes("framer-motion")) {
  fail("admin dashboard should not use framer-motion (use CSS transitions to reduce memory)");
}
if (!index.includes("useMemo")) {
  fail("admin dashboard must memoize derived chart data");
}
if (!index.includes("isAnimationActive={false}")) {
  fail("recharts Area must disable animation (isAnimationActive={false})");
}
if (
  (index.includes("refetchInterval") || adminQueryOpts.includes("ADMIN_STATS_QUERY"))
  && !adminQueryOpts.includes("refetchIntervalInBackground: false")
) {
  fail("admin stats query must set refetchIntervalInBackground: false (ADMIN_STATS_QUERY)");
}

// Layout should reuse stats cache for pending badge (no duplicate poll)
if (layout.includes('queryKey: ["/api/admin/pending-vin-checks"')) {
  fail("AdminLayout must not run a separate pending-vin-checks poll; use stats cache");
}
if (!layout.includes("getAdminGetStatsQueryOptions")) {
  fail("AdminLayout should read pending count from admin stats query cache");
}

if (!layout.includes("splitRouterLocation") && !layout.includes("normalizeAppPath")) {
  fail("AdminLayout should match nav active state on normalized pathname");
}

// ── AdminPage should not wrap eager layout in Suspense ───────────────────────
const adminPageMatch = app.match(/function AdminPage[\s\S]*?^}/m);
if (adminPageMatch && adminPageMatch[0].includes("<Suspense") && adminPageMatch[0].includes("<AdminLayout")) {
  fail("AdminPage must not Suspense-wrap eager AdminLayout (causes full-shell loader flash)");
}

if (errors > 0) {
  console.error(`\n${errors} admin QA check(s) failed.`);
  process.exit(1);
}

console.log("Admin route + dashboard QA: all static checks passed.");
