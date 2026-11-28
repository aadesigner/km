import { describe, expect, it } from "vitest";
import {
  estimateNetAmount,
  estimateProcessorFee,
  feesFromMethodAggregate,
  netFromGrossAndMethodRows,
  summarizeProcessorFees,
} from "./payment-processor-fees";

describe("estimateProcessorFee", () => {
  it("applies PayPal 3.9% + €0.30", () => {
    // 10 * 0.039 + 0.30 = 0.69
    expect(estimateProcessorFee(10, "paypal")).toBe(0.69);
  });

  it("applies POK 2.5% + €0.20", () => {
    // 10 * 0.025 + 0.20 = 0.45
    expect(estimateProcessorFee(10, "pok")).toBe(0.45);
  });

  it("charges nothing for credit/free or zero amounts", () => {
    expect(estimateProcessorFee(10, "credit")).toBe(0);
    expect(estimateProcessorFee(10, "free")).toBe(0);
    expect(estimateProcessorFee(0, "paypal")).toBe(0);
  });

  it("treats unknown paid method as PayPal", () => {
    expect(estimateProcessorFee(10, "unknown")).toBe(0.69);
  });
});

describe("estimateNetAmount", () => {
  it("returns bruto minus fee, floored at 0", () => {
    expect(estimateNetAmount(10, "paypal")).toBe(9.31);
    expect(estimateNetAmount(0.1, "paypal")).toBe(0);
  });
});

describe("feesFromMethodAggregate", () => {
  it("matches summed per-order fees", () => {
    const amounts = [10, 20, 14.99];
    const perOrder = amounts.reduce((s, a) => s + estimateProcessorFee(a, "paypal"), 0);
    const agg = feesFromMethodAggregate({
      method: "paypal",
      revenue: amounts.reduce((s, a) => s + a, 0),
      count: amounts.length,
    });
    expect(agg).toBe(Math.round(perOrder * 100) / 100);
  });

  it("uses POK rates on aggregates", () => {
    expect(feesFromMethodAggregate({ method: "pok", revenue: 100, count: 4 })).toBe(3.3);
  });
});

describe("summarizeProcessorFees / netFromGrossAndMethodRows", () => {
  it("combines paypal + pok rows", () => {
    const summary = summarizeProcessorFees([
      { method: "paypal", count: 2, revenue: 20 },
      { method: "pok", count: 1, revenue: 10 },
      { method: "free", count: 3, revenue: 0 },
    ]);
    // paypal: 20*0.039 + 2*0.30 = 1.38; pok: 10*0.025 + 0.20 = 0.45
    expect(summary.gross).toBe(30);
    expect(summary.fees).toBe(1.83);
    expect(summary.net).toBe(28.17);
  });

  it("clamps fees to bruto when deriving neto", () => {
    const out = netFromGrossAndMethodRows(10, [
      { method: "paypal", count: 2, revenue: 20 },
    ]);
    expect(out.revenueGross).toBe(10);
    expect(out.processorFees).toBeLessThanOrEqual(10);
    expect(out.revenueNet + out.processorFees).toBeCloseTo(out.revenueGross, 2);
  });
});
