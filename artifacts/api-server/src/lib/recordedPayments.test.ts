import { describe, expect, it } from "vitest";
import {
  isCollectedRevenueStatus,
  isPaymentUsableForLookup,
  sumCollectedRevenue,
} from "./recordedPayments.js";

describe("isPaymentUsableForLookup", () => {
  const userId = "user-1";

  it("accepts completed payments for the same user", () => {
    expect(isPaymentUsableForLookup({ status: "completed", amount: 9.99, userId }, userId)).toBe(true);
  });

  it("accepts pending free-coupon reservations before fulfillment", () => {
    expect(isPaymentUsableForLookup({ status: "pending", amount: 0, userId }, userId)).toBe(true);
  });

  it("rejects pending paid PayPal orders", () => {
    expect(isPaymentUsableForLookup({ status: "pending", amount: 9.99, userId }, userId)).toBe(false);
  });

  it("rejects another user's payment", () => {
    expect(isPaymentUsableForLookup({ status: "completed", amount: 9.99, userId: "other" }, userId)).toBe(false);
  });
});

describe("collected revenue after pending credit/remove", () => {
  it("treats revoked like completed for revenue (no deduct)", () => {
    expect(isCollectedRevenueStatus("completed")).toBe(true);
    expect(isCollectedRevenueStatus("revoked")).toBe(true);
    expect(isCollectedRevenueStatus("refunded")).toBe(false);
    expect(isCollectedRevenueStatus("failed")).toBe(false);
  });

  it("sums completed + revoked amounts", () => {
    expect(sumCollectedRevenue([
      { status: "completed", rev: 10 },
      { status: "revoked", rev: 15 },
      { status: "failed", rev: 99 },
      { status: "refunded", rev: 50 },
    ])).toBe(25);
  });
});
