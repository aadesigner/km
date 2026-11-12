const htmlUrl = "https://v-h-r.b-cdn.net/vhr/examples/7FARW2H56JE022576/bed452661b243e4d5defdbdb52ae1ec4e4c11e5b298b87217ea1c096e8d02c0a.html";
const html = await fetch(htmlUrl).then(r => r.text());
const lower = html.toLowerCase();
const idx = lower.indexOf("damage");
console.error("len", html.length, "damageIdx", idx);
// extract snippets around damage
const snippets = [];
let from = 0;
while (snippets.length < 8) {
  const i = lower.indexOf("damage", from);
  if (i < 0) break;
  snippets.push(html.slice(Math.max(0,i-80), i+120).replace(/\s+/g," "));
  from = i + 6;
}
import { writeFileSync } from "node:fs";
writeFileSync("tmp-html-damage.txt", snippets.join("\n---\n"));
// also look for Front/Rear/Side
for (const w of ["Front End","Rear End","Side","All Over","copart","encar","Primary"]) {
  console.error(w, lower.includes(w.toLowerCase()));
}
