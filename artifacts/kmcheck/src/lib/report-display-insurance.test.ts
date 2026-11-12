import { describe, expect, it } from "vitest";
import {
  isKoreanMarketInsuranceClaim,
  sanitizeInsuranceClaims,
  sanitizeAccidents,
} from "./report-display";

describe("sanitizeInsuranceClaims for US-origin cars", () => {
  it("detects Encar KRW claim stubs", () => {
    expect(
      isKoreanMarketInsuranceClaim({
        date: "2026-02-03",
        type: "Insurance claim",
        lossAmount: 1_280_000,
        currency: "KRW",
        description: "Own damage 1,280,000 KRW · Third party 0 KRW",
      }),
    ).toBe(true);
  });

  it("drops Korean KRW claims when vehicle country is USA", () => {
    const out = sanitizeInsuranceClaims(
      [
        {
          date: "2026-02-03",
          type: "Insurance claim",
          lossAmount: 1_280_000,
          currency: "KRW",
          description: "Own damage 1,280,000 KRW · Third party 0 KRW",
        },
        {
          date: "2025-01-01",
          type: "Collision",
          lossAmount: 2500,
          currency: "USD",
          description: "US claim",
        },
      ],
      2018,
      "United States",
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.currency).toBe("USD");
  });

  it("keeps KRW claims for Korean vehicles", () => {
    const out = sanitizeInsuranceClaims(
      [
        {
          date: "2026-02-03",
          type: "Insurance claim",
          lossAmount: 1_280_000,
          currency: "KRW",
          description: "Own damage 1,280,000 KRW · Third party 0 KRW",
        },
      ],
      2021,
      "South Korea",
    );
    expect(out).toHaveLength(1);
  });
});

describe("sanitizeAccidents for US-origin cars", () => {
  it("drops Korean insurance accident rows", () => {
    const out = sanitizeAccidents(
      [
        {
          date: "2026-02-03",
          type: "insurance",
          country: "KR",
          description: "Korean insurance accident",
          lossAmount: 1_280_000,
          currency: "KRW",
        },
        {
          date: "2024-06-01",
          type: "collision",
          country: "US",
          description: "Front impact",
          lossAmount: 4000,
          currency: "USD",
        },
      ],
      2018,
      "United States",
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.country).toBe("US");
  });
});
