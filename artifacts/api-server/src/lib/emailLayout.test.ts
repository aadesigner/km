import { describe, it, expect } from "vitest";
import { buildEmailBase, emailBrandLogoUrl } from "./emailLayout.js";

describe("emailLayout", () => {
  it("uses the white brand logo image in the header", () => {
    const html = buildEmailBase("<p>Hi</p>", undefined, "https://kmcheck.com");
    expect(html).toContain('src="https://kmcheck.com/brand/logo-white.png"');
    expect(html).toContain('alt="kmcheck.com"');
    expect(html).not.toContain("km<span");
  });

  it("builds logo URL from site settings", () => {
    expect(emailBrandLogoUrl("https://example.com/")).toBe("https://example.com/brand/logo-white.png");
  });
});
