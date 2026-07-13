import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHECKOUT_PREFILL_ONLY_KEY,
  CHECKOUT_VIN_KEY,
  PAYPAL_CHECKOUT_SESSION_KEY,
  PENDING_VIN_KEY,
  clearCheckoutPaymentResumeState,
  consumeCheckoutPrefillOnly,
  getPostAuthCheckoutPath,
  markCheckoutPrefillOnly,
  markPaypalCheckoutAwaitingApproval,
  markPaypalCheckoutCapturePending,
  readPaypalCheckoutSession,
  shouldResumePaypalCapture,
} from "./checkout-vin-flow";

describe("getPostAuthCheckoutPath", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("redirects to checkout with VIN and marks prefill-only landing", () => {
    sessionStorage.setItem(PENDING_VIN_KEY, "1HGBH41JXMN109186");
    sessionStorage.setItem(PAYPAL_CHECKOUT_SESSION_KEY, JSON.stringify({ orderId: "ABC12345", vin: "1HGBH41JXMN109186" }));

    expect(getPostAuthCheckoutPath("en")).toBe("/en/checkout?vin=1HGBH41JXMN109186");
    expect(sessionStorage.getItem(PENDING_VIN_KEY)).toBeNull();
    expect(sessionStorage.getItem(CHECKOUT_VIN_KEY)).toBe("1HGBH41JXMN109186");
    expect(sessionStorage.getItem(PAYPAL_CHECKOUT_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(CHECKOUT_PREFILL_ONLY_KEY)).toBe("1");
  });

  it("uses stored checkout VIN when pending is absent", () => {
    sessionStorage.setItem(CHECKOUT_VIN_KEY, "WBA3A5G59DNP26082");

    expect(getPostAuthCheckoutPath("de")).toBe("/de/checkout?vin=WBA3A5G59DNP26082");
    expect(sessionStorage.getItem(CHECKOUT_PREFILL_ONLY_KEY)).toBe("1");
  });

  it("returns null when no VIN is waiting", () => {
    expect(getPostAuthCheckoutPath("en")).toBeNull();
    expect(sessionStorage.getItem(CHECKOUT_PREFILL_ONLY_KEY)).toBeNull();
  });
});

describe("checkout prefill helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("consumeCheckoutPrefillOnly reads the flag once", () => {
    markCheckoutPrefillOnly();
    expect(consumeCheckoutPrefillOnly()).toBe(true);
    expect(consumeCheckoutPrefillOnly()).toBe(false);
  });

  it("clearCheckoutPaymentResumeState removes PayPal session", () => {
    sessionStorage.setItem(PAYPAL_CHECKOUT_SESSION_KEY, "{}");
    clearCheckoutPaymentResumeState();
    expect(sessionStorage.getItem(PAYPAL_CHECKOUT_SESSION_KEY)).toBeNull();
  });

  it("tracks PayPal session phase for resume", () => {
    markPaypalCheckoutAwaitingApproval("abc12345", "1HGBH41JXMN109186");
    expect(readPaypalCheckoutSession()).toEqual({
      orderId: "ABC12345",
      vin: "1HGBH41JXMN109186",
      phase: "approval",
    });
    markPaypalCheckoutCapturePending("abc12345", "1HGBH41JXMN109186");
    expect(readPaypalCheckoutSession()?.phase).toBe("capture");
    expect(shouldResumePaypalCapture(readPaypalCheckoutSession()!)).toBe(true);
  });

  it("legacy PayPal sessions without phase restore approval UI, not capture", () => {
    sessionStorage.setItem(
      PAYPAL_CHECKOUT_SESSION_KEY,
      JSON.stringify({ orderId: "ABC12345", vin: "1HGBH41JXMN109186" }),
    );
    const session = readPaypalCheckoutSession();
    expect(session?.phase).toBeUndefined();
    expect(shouldResumePaypalCapture(session!)).toBe(false);
  });

  it("rejects invalid PayPal session payloads", () => {
    sessionStorage.setItem(PAYPAL_CHECKOUT_SESSION_KEY, JSON.stringify({ orderId: "x", vin: "short" }));
    expect(readPaypalCheckoutSession()).toBeNull();
  });
});
