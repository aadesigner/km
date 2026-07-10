import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("staticSite asset fallback", () => {
  const src = readFileSync(join(apiRoot, "lib/staticSite.ts"), "utf8");

  it("returns 404 for missing asset paths instead of SPA index.html", () => {
    expect(src).toContain("isStaticAssetRequest");
    expect(src).toMatch(/isStaticAssetRequest\(req\.path\)[\s\S]*404/);
  });
});
