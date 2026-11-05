/** List live sitemap index + shard status for kmcheck. */
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const ORIGIN = "https://kmcheck.com";

async function get(path) {
  const url = path.startsWith("http") ? path : `${ORIGIN}${path}`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "manual" });
  const text = await r.text();
  return { url, status: r.status, ctype: r.headers.get("content-type"), text };
}

const index = await get("/sitemap.xml");
console.log(JSON.stringify({
  url: index.url,
  status: index.status,
  ctype: index.ctype,
  bodyPreview: index.text.slice(0, 800),
}, null, 2));

const locs = [...index.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log("index_locs:", locs);

for (const loc of locs) {
  const s = await get(loc);
  const urls = (s.text.match(/<url>/g) || []).length;
  const vins = (s.text.match(/\/vin\//gi) || []).length;
  const shards = (s.text.match(/sitemap-vins/gi) || []).length;
  const first = [...s.text.matchAll(/<loc>([^<]+)<\/loc>/g)].slice(0, 3).map((m) => m[1]);
  const pris = {
    apex: (s.text.match(/<loc>https:\/\/kmcheck\.com\/<\/loc>[\s\S]*?<priority>([^<]+)/) || [])[1],
    sq: (s.text.match(/<loc>https:\/\/kmcheck\.com\/sq<\/loc>[\s\S]*?<priority>([^<]+)/) || [])[1],
    enPricing: (s.text.match(/<loc>https:\/\/kmcheck\.com\/en\/pricing<\/loc>[\s\S]*?<priority>([^<]+)/) || [])[1],
    sqPricing: (s.text.match(/<loc>https:\/\/kmcheck\.com\/sq\/pricing<\/loc>[\s\S]*?<priority>([^<]+)/) || [])[1],
  };
  console.log(JSON.stringify({ loc, status: s.status, urls, vinUrls: vins, vinShardMentions: shards, firstLocs: first, priorities: pris }));
}

for (const path of ["/sitemap-vins-1.xml", "/sitemap-vins-2.xml"]) {
  const s = await get(path);
  console.log(JSON.stringify({
    path,
    status: s.status,
    looksLikeXmlError: /<error>|sitemap not found|Not found/i.test(s.text),
    hasVin: /\/vin\//i.test(s.text),
    snippet: s.text.slice(0, 160).replace(/\s+/g, " "),
  }));
}
