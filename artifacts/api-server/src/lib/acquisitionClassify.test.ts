import { describe, expect, it } from "vitest";
import { classifyAcquisition } from "./acquisitionClassify.js";

describe("server classifyAcquisition", () => {
  it("maps instagram referrer plus fbclid to Insta social", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/sq/?fbclid=IgAbc",
      "https://l.instagram.com/",
      "Mozilla/5.0",
      "kmcheck.com",
    );
    expect(r.bucket).toBe("organic_social");
    expect(r.channel).toBe("instagram_social");
  });

  it("does not treat fbclid as an ad", () => {
    const r = classifyAcquisition("https://kmcheck.com/sq/?fbclid=abc", "", "", "kmcheck.com");
    expect(r.bucket).toBe("organic_social");
    expect(r.channel).not.toMatch(/ads/);
  });
});
