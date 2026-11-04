/** Live VIN page should already be noindex once API/static policy is deployed; probe current prod. */
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const vin = "WBA3V7106FJ995387";
const urls = [
  `https://kmcheck.com/en/vin/${vin}`,
  `https://kmcheck.com/sq/vin/${vin}`,
  "https://kmcheck.com/sitemap-pages.xml",
];

function pick(html, ...res) {
  for (const re of res) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

for (const url of urls) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "manual" });
  const t = await r.text();
  console.log(
    JSON.stringify({
      url,
      status: r.status,
      robots: pick(
        t,
        /name=["']robots["'][^>]*content=["']([^"']+)["']/i,
        /content=["']([^"']+)["'][^>]*name=["']robots["']/i,
      ),
      canonical: pick(
        t,
        /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
        /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i,
      ),
      hasVehicle: /"@type"\s*:\s*"Vehicle"/i.test(t),
      hasProduct: /"@type"\s*:\s*"Product"/i.test(t),
      hasVinUrls: /\/vin\//i.test(t),
      mentionsVinShard: /sitemap-vins/i.test(t),
      sample: t.includes("<urlset") ? `urls=${(t.match(/<url>/g) || []).length}` : undefined,
    }),
  );
}
