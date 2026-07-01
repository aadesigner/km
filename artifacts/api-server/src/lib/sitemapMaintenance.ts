import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function collectSitemapPaths(): string[] {
  const paths: string[] = [];
  const fromEnv = process.env.PUBLIC_DIR?.trim();
  if (fromEnv) paths.push(path.join(fromEnv, "sitemap.xml"));

  const candidates = [
    path.resolve(process.cwd(), "artifacts/kmcheck/dist/public/sitemap.xml"),
    path.resolve(process.cwd(), "../kmcheck/dist/public/sitemap.xml"),
    path.resolve(process.cwd(), "artifacts/kmcheck/public/sitemap.xml"),
    path.resolve(process.cwd(), "../kmcheck/public/sitemap.xml"),
    path.resolve(process.cwd(), "dist/public/sitemap.xml"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && !paths.includes(candidate)) paths.push(candidate);
  }
  return paths;
}

/** Remove every `<url>` block whose loc contains `/vin/{vin}`. */
export function removeVinUrlBlocks(xml: string, vin: string): string {
  const escaped = vin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(`\\s*<url>[\\s\\S]*?\\/vin\\/${escaped}[\\s\\S]*?<\\/url>`, "gi");
  return xml.replace(blockRe, "");
}

/** Strip VIN URLs from every known sitemap.xml on disk (build output + source). */
export function removeVinFromSitemaps(vin: string): boolean {
  const normalized = vin.trim().toUpperCase();
  let updated = false;
  for (const file of collectSitemapPaths()) {
    try {
      const before = readFileSync(file, "utf8");
      const after = removeVinUrlBlocks(before, normalized);
      if (after !== before) {
        writeFileSync(file, after, "utf8");
        updated = true;
      }
    } catch {
      // missing or unreadable — skip
    }
  }
  return updated;
}
