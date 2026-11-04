/** Live probe: Googlebot marketing SEO vs VIN sitemap lag. */
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const urls = [
  "https://kmcheck.com/",
  "https://kmcheck.com/en",
  "https://kmcheck.com/sq",
  "https://kmcheck.com/en/pricing",
  "https://kmcheck.com/sq/pricing",
  "https://kmcheck.com/sitemap.xml",
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
  const robots = pick(
    t,
    /name=["']robots["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*name=["']robots["']/i,
  );
  const can = pick(
    t,
    /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i,
  );
  const hasVehicle = /"@type"\s*:\s*"Vehicle"/i.test(t);
  const hasProduct = /"@type"\s*:\s*"Product"/i.test(t);
  const vinShards = (t.match(/sitemap-vins/gi) || []).length;
  console.log(
    JSON.stringify({
      url,
      status: r.status,
      location: r.headers.get("location"),
      robots,
      canonical: can,
      hasVehicle,
      hasProduct,
      vinShardsInBody: vinShards,
    }),
  );
}
