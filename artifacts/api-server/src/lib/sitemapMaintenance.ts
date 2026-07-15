import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

function collectPublicDirs(): string[] {
  const dirs: string[] = [];
  const fromEnv = process.env.PUBLIC_DIR?.trim();
  if (fromEnv) dirs.push(fromEnv);

  const candidates = [
    path.resolve(process.cwd(), "artifacts/kmcheck/dist/public"),
    path.resolve(process.cwd(), "../kmcheck/dist/public"),
    path.resolve(process.cwd(), "artifacts/kmcheck/public"),
    path.resolve(process.cwd(), "../kmcheck/public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && !dirs.includes(candidate)) dirs.push(candidate);
  }
  return dirs;
}

/**
 * VIN URLs live only in sitemap-vins-*.xml shards (not the marketing pages urlset
 * or the sitemap index).
 */
export function collectVinSitemapPaths(): string[] {
  const paths: string[] = [];
  for (const dir of collectPublicDirs()) {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!/^sitemap-vins-\d+\.xml$/i.test(name)) continue;
      const full = path.join(dir, name);
      if (!paths.includes(full)) paths.push(full);
    }
  }
  return paths;
}

/** @deprecated Prefer collectVinSitemapPaths — kept for clarity in call sites. */
function collectSitemapPaths(): string[] {
  return collectVinSitemapPaths();
}

/** Remove every `<url>` block whose loc contains `/vin/{vin}`. */
export function removeVinUrlBlocks(xml: string, vin: string): string {
  const escaped = vin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(`\\s*<url>[\\s\\S]*?\\/vin\\/${escaped}[\\s\\S]*?<\\/url>`, "gi");
  return xml.replace(blockRe, "");
}

/** Strip VIN URLs from every VIN shard sitemap on disk (build output + source). */
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
