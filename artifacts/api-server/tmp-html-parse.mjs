const htmlUrl = "https://v-h-r.b-cdn.net/vhr/examples/7FARW2H56JE022576/bed452661b243e4d5defdbdb52ae1ec4e4c11e5b298b87217ea1c096e8d02c0a.html";
const html = await fetch(htmlUrl).then(r => r.text());
import { writeFileSync } from "node:fs";
// Pull listing cards text
const cards = [...html.matchAll(/<article[\s\S]*?<\/article>/gi)].map(m => m[0].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()).slice(0,5);
const dts = [...html.matchAll(/<dt>([^<]+)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)].map(m => [m[1], m[2].replace(/<[^>]+>/g,"").trim()]);
const interesting = dts.filter(([k]) => /damage|condition|market|sale|odometer|lot|price|currency|status|airbag|repair|value/i.test(k));
writeFileSync("tmp-html-parse.json", JSON.stringify({ cards, interesting: interesting.slice(0,80) }, null, 2));
console.error("cards", cards.length, "interesting", interesting.length);
