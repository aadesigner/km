/** Confirm live SPA ships client-guard token and public-settings works with it. */
const ORIGIN = "https://kmcheck.com";

const html = await (await fetch(`${ORIGIN}/en/sign-up`)).text();
const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
console.log("script_count", scripts.length);

let guardHeader = false;
let tokenLiteral = null;
for (const path of scripts) {
  const t = await (await fetch(`${ORIGIN}${path}`)).text();
  if (!t.includes("x-kmcheck-client")) continue;
  guardHeader = true;
  // bundled as header + string literal nearby
  const m = t.match(/x-kmcheck-client["']?\s*,\s*["']([^"']{12,})["']/);
  const m2 = t.match(/["']x-kmcheck-client["']\s*:\s*["']([^"']{12,})["']/);
  const m3 = t.match(/setClientGuardToken\(["']([^"']{12,})["']\)/);
  tokenLiteral = m?.[1] || m2?.[1] || m3?.[1] || tokenLiteral;
  if (tokenLiteral) break;
  // broader: look for env-inlined token assignment patterns
  const m4 = t.match(/CLIENT_GUARD[^\n]{0,40}["']([A-Za-z0-9_-]{16,})["']/);
  if (m4) {
    tokenLiteral = m4[1];
    break;
  }
}

console.log(JSON.stringify({ guardHeader, hasExtractedToken: !!tokenLiteral, tokenLen: tokenLiteral?.length ?? 0 }));

const pub = await fetch(`${ORIGIN}/api/payments/public-settings`, {
  headers: {
    Origin: ORIGIN,
    Referer: `${ORIGIN}/en/sign-up`,
    ...(tokenLiteral ? { "x-kmcheck-client": tokenLiteral } : {}),
  },
});
const pubText = await pub.text();
console.log("public-settings", pub.status, pubText.slice(0, 600));

if (tokenLiteral) {
  const reg = await fetch(`${ORIGIN}/api/auth/register`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      Referer: `${ORIGIN}/en/sign-up`,
      "Content-Type": "application/json",
      "x-kmcheck-client": tokenLiteral,
    },
    body: JSON.stringify({ email: "qa@example.com", password: "ab", name: "QA" }),
  });
  console.log("register_with_token", reg.status, (await reg.text()).slice(0, 300));
}

// Browser-like without token should still 403 when guard enforced
const bare = await fetch(`${ORIGIN}/api/payments/public-settings`, {
  headers: { Origin: ORIGIN, Referer: `${ORIGIN}/en/sign-up`, "Sec-Fetch-Site": "same-origin" },
});
console.log("public-settings_no_token", bare.status, (await bare.text()).slice(0, 120));
