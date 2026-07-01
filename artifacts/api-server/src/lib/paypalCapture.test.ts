import { describe, expect, it } from "vitest";
import {
  isPaypalOrderAlreadyCaptured,
  readPaypalOrderStatus,
  interpretPaypalCaptureResponse,
} from "./paypalCapture.js";

describe("paypalCapture", () => {
  it("detects already-captured PayPal errors", () => {
    expect(
      isPaypalOrderAlreadyCaptured({
        name: "UNPROCESSABLE_ENTITY",
        details: [{ issue: "ORDER_ALREADY_CAPTURED" }],
      }),
    ).toBe(true);
    expect(isPaypalOrderAlreadyCaptured({ status: "COMPLETED" })).toBe(false);
  });

  it("reads order status from capture payload", () => {
    expect(readPaypalOrderStatus({ status: "COMPLETED", id: "ABC" })).toBe("COMPLETED");
    expect(readPaypalOrderStatus({ name: "ERROR" })).toBeNull();
  });

  it("treats already-captured orders as completed after order fetch", async () => {
    const result = await interpretPaypalCaptureResponse(
      new Response(JSON.stringify({
        name: "UNPROCESSABLE_ENTITY",
        details: [{ issue: "ORDER_ALREADY_CAPTURED" }],
      }), { status: 422 }),
      async () => "COMPLETED",
    );
    expect(result.treatedAsCompleted).toBe(true);
  });

  it("does not treat failed capture as completed when order is not completed", async () => {
    const result = await interpretPaypalCaptureResponse(
      new Response(JSON.stringify({ name: "ERROR" }), { status: 500 }),
      async () => "APPROVED",
    );
    expect(result.treatedAsCompleted).toBe(false);
  });
});
