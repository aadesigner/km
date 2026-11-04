import { describe, expect, it } from "vitest";
import { parseMarketingPath, resolveMarketingMetaSeo } from "@workspace/marketing-page-seo";

describe("apex English homepage SEO", () => {
  it("indexes English home at https://kmcheck.com/ (not /en)", () => {
    expect(parseMarketingPath("/")).toEqual({ pageKey: "home", rest: "", lang: "en" });
    expect(parseMarketingPath("/en")).toEqual({ pageKey: "home", rest: "", lang: "en" });

    for (const path of ["/", "/en"]) {
      const seo = resolveMarketingMetaSeo(path, "https://kmcheck.com");
      expect(seo?.canonicalPath).toBe("/");
      expect(seo?.canonicalUrl).toBe("https://kmcheck.com/");
      expect(seo?.noIndex).toBe(false);
      expect(seo?.pageKey).toBe("home");
    }

    const sq = resolveMarketingMetaSeo("/sq", "https://kmcheck.com");
    expect(sq?.canonicalUrl).toBe("https://kmcheck.com/sq");

    const pricing = resolveMarketingMetaSeo("/en/pricing", "https://kmcheck.com");
    expect(pricing?.canonicalUrl).toBe("https://kmcheck.com/en/pricing");
  });
});

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
