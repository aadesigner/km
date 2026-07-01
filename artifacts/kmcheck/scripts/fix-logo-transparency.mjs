import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fixLogo(relPath) {
  const input = path.join(root, relPath);
  console.log("processing", input);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = data;
  let cleared = 0;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    if (r <= 40 && g <= 40 && b <= 40) {
      px[i + 3] = 0;
      cleared++;
    }
  }
  const tmp = `${input}.tmp.png`;
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(tmp);
  fs.renameSync(tmp, input);
  const magic = fs.readFileSync(input).subarray(0, 4).toString("hex");
  console.log(relPath, "cleared", cleared, "pixels, magic", magic, "size", fs.statSync(input).size);
}

await fixLogo("public/brand/logo-white.png");
await fixLogo("public/brand/logo-dark.png");
await fixLogo("public/favicon.png");
