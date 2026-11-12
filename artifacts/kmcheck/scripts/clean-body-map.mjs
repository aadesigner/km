import { readFileSync, writeFileSync } from "fs";

let svg = readFileSync("public/damage-diagram/body-map.svg", "utf8");
svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
svg = svg.replace(/<image[\s\S]*?<\/image>/gi, "");
svg = svg.replace(/<image[^>]*\/>/gi, "");
// Remove baked damage overlays for that specific VIN
svg = svg.replace(/<(path|polygon|polyline|rect)\b([^>]*\bclass="st[234]\b[^"]*"[^>]*)><\/\1>/gi, "");
svg = svg.replace(/<(path|polygon|polyline|rect)\b([^>]*\bclass="st[234]\b[^"]*"[^>]*)\/>/gi, "");
svg = svg.replace(/\sstyle="position:[^"]*"/g, "");
svg = svg.replace(/<a>[^<]*<\/a>/g, "");
svg = svg.replace(/<g id="car1"[^>]*><\/g>/g, "");
writeFileSync("public/damage-diagram/body-map.svg", svg, "utf8");
console.log({
  len: svg.length,
  st4: /class="st4/.test(svg),
  script: /<script/i.test(svg),
  image: /<image/i.test(svg),
  p01: /id="p01"/.test(svg),
  p03: /id="p03"/.test(svg),
});
