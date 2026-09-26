import { describe, expect, it } from "vitest";
import { classifyAcquisition } from "./acquisition";

describe("classifyAcquisition", () => {
  it("maps fbclid alone to organic instagram, not ads", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/sq/?fbclid=abc123",
      "",
    );
    expect(r.bucket).toBe("organic_social");
    expect(r.channel).toBe("instagram_social");
    expect(r.clickId).toBe("abc123");
  });

  it("maps instagram referrer plus fbclid to organic social", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/sq/?fbclid=IgAbc",
      "https://l.instagram.com/",
    );
    expect(r.bucket).toBe("organic_social");
    expect(r.channel).toBe("instagram_social");
  });

  it("still maps paid instagram utm to ads even with fbclid", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/sq/?utm_source=instagram&utm_medium=paid&fbclid=xyz",
      "https://l.instagram.com/",
    );
    expect(r.bucket).toBe("paid_ads");
    expect(r.channel).toBe("instagram_ads");
  });

  it("maps gclid to google ads", () => {
    const r = classifyAcquisition("https://kmcheck.com/en/?gclid=xyz", "");
    expect(r.bucket).toBe("paid_ads");
    expect(r.channel).toBe("google_ads");
  });

  it("maps paid utm meta", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/sq/?utm_source=meta&utm_medium=paid&utm_campaign=vin_al",
      "",
    );
    expect(r.bucket).toBe("paid_ads");
    expect(r.channel).toBe("meta_ads");
    expect(r.campaign).toBe("vin_al");
  });

  it("maps instagram referrer to organic social", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/sq/",
      "https://l.instagram.com/",
    );
    expect(r.bucket).toBe("organic_social");
    expect(r.channel).toBe("instagram_social");
    expect(r.referrer).toBe("l.instagram.com");
  });

  it("maps google referrer to google organic", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/en/",
      "https://www.google.com/",
    );
    expect(r.bucket).toBe("google");
    expect(r.channel).toBe("google_organic");
  });

  it("maps other sites to referral", () => {
    const r = classifyAcquisition(
      "https://kmcheck.com/en/",
      "https://partner.example.com/page",
    );
    expect(r.bucket).toBe("referral");
    expect(r.referrer).toBe("partner.example.com");
  });

  it("maps empty referrer to direct", () => {
    const r = classifyAcquisition("https://kmcheck.com/en/", "");
    expect(r.bucket).toBe("direct");
    expect(r.channel).toBe("direct");
  });
});
