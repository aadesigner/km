const ORIGIN = "https://kmcheck.com";
const html = await (await fetch(`${ORIGIN}/en/sign-up`)).text();
const path = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])[0];
const t = await (await fetch(`${ORIGIN}${path}`)).text();

// Find all occurrences of setClientGuardToken and VITE patterns
for (const key of ["setClientGuardToken", "VITE_CLIENT_GUARD", "CLIENT_GUARD_TOKEN"]) {
  let from = 0;
  let n = 0;
  while (n < 5) {
    const i = t.indexOf(key, from);
    if (i < 0) break;
    console.log(`\n=== ${key} @ ${i} ===`);
    console.log(t.slice(Math.max(0, i - 120), i + 180));
    from = i + key.length;
    n += 1;
  }
}

// Look for dn= assignment near guard header usage
const i = t.indexOf("x-kmcheck-client");
const window = t.slice(Math.max(0, i - 5000), i + 500);
const assigns = [...window.matchAll(/\b([a-zA-Z_$][\w$]*)\s*=\s*["']([A-Za-z0-9_-]{16,})["']/g)];
console.log("\nnearby assigns", assigns.map((m) => [m[1], m[2].slice(0, 12) + "…"]));

// Try every long base64url-looking string in first 50kb of entry (env inlines early)
const head = t.slice(0, 80_000);
const cands = [...new Set([...head.matchAll(/["']([A-Za-z0-9_-]{24,64})["']/g)].map((m) => m[1]))]
  .filter((s) => !/^[a-z]+(-[a-z]+)*$/i.test(s))
  .filter((s) => /[A-Z]/.test(s) || /\d/.test(s));
console.log("head_cands", cands.length, cands.slice(0, 30));

for (const cand of cands.slice(0, 80)) {
  const r = await fetch(`${ORIGIN}/api/payments/public-settings`, {
    headers: { Origin: ORIGIN, "x-kmcheck-client": cand },
  });
  if (r.status === 200) {
    console.log("FOUND", cand);
    console.log((await r.text()).slice(0, 500));
    break;
  }
}
