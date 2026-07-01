import { describe, expect, it } from "vitest";
import { isPaymentUsableForLookup } from "./recordedPayments.js";

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
