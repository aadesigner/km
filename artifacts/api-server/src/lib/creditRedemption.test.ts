import { describe, expect, it } from "vitest";
import {
  CREDIT_PACK_IDS,
  CREDIT_PACKS,
  creditPackAmountValue,
  getCreditPack,
  isCreditPackId,
} from "./creditPacks.js";
import { paypalAmountsMatch } from "./paypalCapture.js";

describe("creditPacks", () => {
  it("accepts pack3, pack5, and pack10 only", () => {
    expect(isCreditPackId("pack3")).toBe(true);
    expect(isCreditPackId("pack5")).toBe(true);
    expect(isCreditPackId("pack10")).toBe(true);
    expect(isCreditPackId("pack1")).toBe(false);
    expect(isCreditPackId(null)).toBe(false);
  });

  it("has expected totals and PayPal/POK amount strings", () => {
    expect(getCreditPack("pack3")).toMatchObject({ credits: 3, totalPrice: 41.97, unitPrice: 13.99 });
    expect(getCreditPack("pack5")).toMatchObject({ credits: 5, totalPrice: 64.95, unitPrice: 12.99 });
    expect(getCreditPack("pack10")).toMatchObject({ credits: 10, totalPrice: 99.9, unitPrice: 9.99 });

    expect(creditPackAmountValue(getCreditPack("pack3"))).toBe("41.97");
    expect(creditPackAmountValue(getCreditPack("pack5"))).toBe("64.95");
    expect(creditPackAmountValue(getCreditPack("pack10"))).toBe("99.90");
  });

  it("keeps catalog ids, record keys, and validation in sync", () => {
    expect(CREDIT_PACK_IDS).toEqual(["pack3", "pack5", "pack10"]);
    expect(Object.keys(CREDIT_PACKS).sort()).toEqual([...CREDIT_PACK_IDS].sort());
    for (const id of CREDIT_PACK_IDS) {
      expect(CREDIT_PACKS[id].id).toBe(id);
      expect(CREDIT_PACKS[id].credits).toBeGreaterThan(0);
      expect(CREDIT_PACKS[id].totalPrice).toBeCloseTo(
        CREDIT_PACKS[id].unitPrice * CREDIT_PACKS[id].credits,
        2,
      );
      expect(creditPackAmountValue(CREDIT_PACKS[id])).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it("matches PayPal capture amounts for every pack including pack10", () => {
    for (const id of CREDIT_PACK_IDS) {
      const pack = getCreditPack(id);
      const captured = Number(creditPackAmountValue(pack));
      expect(paypalAmountsMatch(pack.totalPrice, pack.currency, {
        amount: captured,
        currency: pack.currency,
      })).toBe(true);
    }
  });
});
