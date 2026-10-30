import { describe, expect, it } from "vitest";
import { parseMarketingPath, resolveMarketingMetaSeo } from "@workspace/marketing-page-seo";

describe("sign-up marketing SEO for Facebook scrapes", () => {
  it("resolves /en/sign-up with noindex and home OG image", () => {
    expect(parseMarketingPath("/en/sign-up")).toEqual({
      pageKey: "sign_up",
      rest: "/sign-up",
      lang: "en",
    });
    const seo = resolveMarketingMetaSeo("/en/sign-up", "https://kmcheck.com");
    expect(seo?.noIndex).toBe(true);
    expect(seo?.canonicalUrl).toBe("https://kmcheck.com/en/sign-up");
    expect(seo?.ogImage).toBe("/seo/og/home-en.webp");
  });

  it("resolves /sq/sign-in the same way", () => {
    const seo = resolveMarketingMetaSeo("/sq/sign-in", "https://kmcheck.com");
    expect(seo?.pageKey).toBe("auth");
    expect(seo?.noIndex).toBe(true);
    expect(seo?.ogImage).toBe("/seo/og/home-sq.webp");
  });
});
