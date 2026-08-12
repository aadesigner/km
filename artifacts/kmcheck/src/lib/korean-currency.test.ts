import { describe, expect, it } from "vitest";
import {
  convertKrwToUsd,
  DEFAULT_KRW_PER_USD,
  formatKoreanInsuranceAmount,
  formatKoreanWonFromText,
  parseKrwFromText,
  resolveKrwPerUsd,
  shouldFormatAccidentLossAsKrw,
} from "./korean-currency";
import { formatInsuranceAmount } from "./insurance-claims";

describe("korean-currency", () => {
  it("converts KRW to USD using admin rate", () => {
    expect(convertKrwToUsd(7_060_220, 1537)).toBeCloseTo(4590.9, 0);
  });

  it("formats USD primary with won in parentheses", () => {
    expect(formatKoreanInsuranceAmount(7_060_220, 1537)).toBe("$4,594 (₩7,060,220)");
  });

  it("uses default rate when admin rate is invalid", () => {
    expect(resolveKrwPerUsd(0)).toBe(DEFAULT_KRW_PER_USD);
    expect(resolveKrwPerUsd(null)).toBe(DEFAULT_KRW_PER_USD);
    expect(DEFAULT_KRW_PER_USD).toBe(1415);
  });

  it("parses won from provider text", () => {
    expect(parseKrwFromText("2,566,720 won")).toBe(2_566_720);
    expect(parseKrwFromText("136.6 million won")).toBe(136_600_000);
    expect(parseKrwFromText("₩7060220")).toBe(7_060_220);
  });

  it("formats won text to USD primary string", () => {
    expect(formatKoreanWonFromText("2,566,720 won", 1537)).toBe("$1,670 (₩2,566,720)");
    expect(formatKoreanWonFromText("136.6 million won", 1537)).toBe("$88,874 (₩136,600,000)");
  });
});

describe("formatInsuranceAmount", () => {
  it("shows USD + won for Korean reports only", () => {
    expect(formatInsuranceAmount(7_060_220, "kr", 1537)).toBe("$4,594 (₩7,060,220)");
    expect(formatInsuranceAmount(5000, "us")).toBe("$5,000");
  });

  it("treats Korean insurance accidents as KRW even when vehicle country is US", () => {
    expect(formatInsuranceAmount(199_000, "us", 1537, {
      accidentType: "insurance",
      hasKoreanInsuranceClaims: true,
    })).toBe("$129 (₩199,000)");
  });
});

describe("shouldFormatAccidentLossAsKrw", () => {
  it("formats insurance/registry accidents as KRW without kr country", () => {
    expect(shouldFormatAccidentLossAsKrw({
      vehicleCountry: "us",
      accidentType: "insurance",
      hasKoreanInsuranceClaims: true,
    })).toBe(true);
  });
});
