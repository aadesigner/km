/** Live signup funnel QA — settings, register endpoint, auth pages, OAuth. */
const ORIGIN = "https://kmcheck.com";
const UA_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const UA_IG =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 312.0.0.0.0";
const UA_FB =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0.0.0;]";

async function get(path, ua = UA_CHROME) {
  const r = await fetch(`${ORIGIN}${path}`, {
    headers: { "User-Agent": ua, Accept: "text/html,application/json" },
    redirect: "manual",
  });
  const text = await r.text();
  return { status: r.status, loc: r.headers.get("location"), text, ctype: r.headers.get("content-type") };
}

async function post(path, body, ua = UA_CHROME) {
  const r = await fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "User-Agent": ua,
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: ORIGIN,
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: r.status, json, text: text.slice(0, 400) };
}

const pages = [
  ["/en", UA_CHROME],
  ["/en?fbclid=test123&utm_source=facebook&utm_medium=paid", UA_IG],
  ["/en/sign-up", UA_IG],
  ["/en/sign-up", UA_FB],
  ["/en/sign-up", UA_CHROME],
  ["/sq/sign-up", UA_CHROME],
  ["/en/sign-in", UA_CHROME],
];

for (const [path, ua] of pages) {
  const r = await get(path, ua);
  const robots = (r.text.match(/name=["']robots["'][^>]*content=["']([^"']+)/i) || [])[1];
  const hasForm = /id=["']email["']|type=["']email["']|auth_signup|sign.?up/i.test(r.text);
  const hasRecaptchaScript = /recaptcha|grecaptcha/i.test(r.text);
  const title = (r.text.match(/<title>([^<]+)/i) || [])[1];
  console.log(
    JSON.stringify({
      path,
      ua: ua.includes("Instagram") ? "IG" : ua.includes("FB") ? "FB" : "Safari",
      status: r.status,
      loc: r.loc,
      robots,
      title,
      hasFormHint: hasForm,
      hasRecaptchaScript,
      len: r.text.length,
    }),
  );
}

for (const path of [
  "/api/settings/public",
  "/api/public/settings",
  "/api/auth/geo-country",
  "/api/auth/providers",
  "/api/auth/oauth-providers",
  "/api/system/public",
]) {
  const r = await get(path, UA_CHROME);
  console.log(
    JSON.stringify({
      api: path,
      status: r.status,
      snippet: r.text.slice(0, 500).replace(/\s+/g, " "),
    }),
  );
}

// Soft probe register — expect validation error, not 5xx/guard block
const fake = `qa+${Date.now()}@example.com`;
for (const [label, ua] of [
  ["chrome", UA_CHROME],
  ["instagram", UA_IG],
  ["facebook", UA_FB],
]) {
  const r = await post(
    "/api/auth/register",
    { email: fake, password: "short", name: "QA" },
    ua,
  );
  console.log(JSON.stringify({ registerProbe: label, status: r.status, json: r.json, text: r.text }));
}

// Missing fields
{
  const r = await post("/api/auth/register", {}, UA_CHROME);
  console.log(JSON.stringify({ registerEmpty: r.status, json: r.json }));
}

// OAuth init
for (const path of ["/api/auth/facebook?lang=en", "/api/auth/google?lang=en"]) {
  const r = await get(path, UA_IG);
  console.log(JSON.stringify({ oauth: path, status: r.status, loc: r.loc, snippet: r.text.slice(0, 200) }));
}
