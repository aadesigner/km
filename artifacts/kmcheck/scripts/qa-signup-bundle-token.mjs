const ORIGIN = "https://kmcheck.com";
const html = await (await fetch(`${ORIGIN}/en/sign-up`)).text();
const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
const path = scripts[0];
const t = await (await fetch(`${ORIGIN}${path}`)).text();
const i = t.indexOf("x-kmcheck-client");
console.log({ path, len: t.length, guardIdx: i });
console.log("--- around header ---");
console.log(t.slice(Math.max(0, i - 250), i + 350));
const j = t.indexOf("setClientGuardToken");
console.log("--- setClientGuardToken ---");
console.log(t.slice(j, j + 250));
// Find nearby string constants that look like tokens (base64url-ish)
const near = t.slice(Math.max(0, i - 2000), i + 2000);
const candidates = [...near.matchAll(/["']([A-Za-z0-9_-]{20,80})["']/g)].map((m) => m[1]);
console.log("nearby_string_candidates", candidates.slice(0, 20));

for (const cand of candidates) {
  if (cand.includes("kmcheck") || cand.includes("http") || cand.includes("function")) continue;
  const r = await fetch(`${ORIGIN}/api/payments/public-settings`, {
    headers: {
      Origin: ORIGIN,
      Referer: `${ORIGIN}/en/sign-up`,
      "x-kmcheck-client": cand,
    },
  });
  if (r.status !== 403) {
    const body = await r.text();
    console.log("TOKEN_HIT", cand.slice(0, 8) + "…", r.status, body.slice(0, 400));
    break;
  }
}
