const htmlUrl = "https://v-h-r.b-cdn.net/vhr/examples/7FARW2H56JE022576/bed452661b243e4d5defdbdb52ae1ec4e4c11e5b298b87217ea1c096e8d02c0a.html";
const html = await fetch(htmlUrl).then(r => r.text());
import { writeFileSync } from "node:fs";
const m = html.match(/damage[^\n]{0,200}/gi)?.slice(0,40) || [];
const m2 = html.match(/main_damage[\s\S]{0,200}/gi)?.slice(0,10) || [];
const m3 = html.match(/"1"\s*:\s*"[^"]+"/g)?.slice(0,30) || [];
const dict = html.match(/Front End|Rear End|Side Damage|All Over|Normal Wear/gi);
writeFileSync("tmp-html-dmg2.txt", JSON.stringify({ m, m2, m3, dict }, null, 2));
console.error("done");
