/**
 * Estimated payment-processor fees for admin Bruto / Neto display.
 * Display-only — does not change checkout or recorded payment amounts.
 *
 * PayPal: 3.9% + €0.30 per paid order
 * POK:    2.5% + €0.20 per paid order
 * Credit / free: no processor fee
 */

export type ProcessorFeeMethod = "paypal" | "pok" | "credit" | "free";

export const PAYPAL_FEE_RATE = 0.039;
export const PAYPAL_FEE_FIXED = 0.3;
export const POK_FEE_RATE = 0.025;
export const POK_FEE_FIXED = 0.2;

export const PROCESSOR_FEE_FOOTNOTE =
  "PayPal 3.9% + €0.30 · POK 2.5% + €0.20 (estimated)";

export function roundMoneyCents(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/** Per-order estimated fee. Legacy paid rows without ids are treated as PayPal. */
export function estimateProcessorFee(
  amount: number,
  method: ProcessorFeeMethod | string | null | undefined,
): number {
  const amt = Number(amount) || 0;
  if (!(amt > 0)) return 0;
  const m = (method ?? "paypal").toLowerCase();
  if (m === "pok") return roundMoneyCents(amt * POK_FEE_RATE + POK_FEE_FIXED);
  if (m === "credit" || m === "free") return 0;
  // paypal + unknown paid fallback
  return roundMoneyCents(amt * PAYPAL_FEE_RATE + PAYPAL_FEE_FIXED);
}

export function estimateNetAmount(
  amount: number,
  method: ProcessorFeeMethod | string | null | undefined,
): number {
  const amt = Number(amount) || 0;
  if (!(amt > 0)) return 0;
  return roundMoneyCents(Math.max(0, amt - estimateProcessorFee(amt, method)));
}

/**
 * Exact aggregate equivalent of summing per-order fees when fee = rate*amount + fixed.
 */
export function feesFromMethodAggregate(input: {
  method: ProcessorFeeMethod | string | null | undefined;
  revenue: number;
  count: number;
}): number {
  const revenue = Number(input.revenue) || 0;
  const count = Number(input.count) || 0;
  if (!(revenue > 0) || !(count > 0)) return 0;
  const m = (input.method ?? "paypal").toLowerCase();
  if (m === "credit" || m === "free") return 0;
  if (m === "pok") return roundMoneyCents(revenue * POK_FEE_RATE + count * POK_FEE_FIXED);
  return roundMoneyCents(revenue * PAYPAL_FEE_RATE + count * PAYPAL_FEE_FIXED);
}

export type MethodRevenueRow = {
  method: ProcessorFeeMethod | string;
  count: number;
  revenue: number;
};

export function summarizeProcessorFees(rows: MethodRevenueRow[] | null | undefined): {
  gross: number;
  fees: number;
  net: number;
} {
  let gross = 0;
  let fees = 0;
  for (const row of rows ?? []) {
    const revenue = Number(row.revenue) || 0;
    const count = Number(row.count) || 0;
    gross += revenue;
    fees += feesFromMethodAggregate({ method: row.method, revenue, count });
  }
  gross = roundMoneyCents(gross);
  fees = roundMoneyCents(fees);
  return {
    gross,
    fees,
    net: roundMoneyCents(Math.max(0, gross - fees)),
  };
}

/** Neto for a known bruto total using method-row fee estimates. */
export function netFromGrossAndMethodRows(
  gross: number,
  rows: MethodRevenueRow[] | null | undefined,
): { revenueGross: number; revenueNet: number; processorFees: number } {
  const bruto = roundMoneyCents(Number(gross) || 0);
  const { fees } = summarizeProcessorFees(rows);
  const processorFees = roundMoneyCents(Math.min(fees, Math.max(0, bruto)));
  return {
    revenueGross: bruto,
    processorFees,
    revenueNet: roundMoneyCents(Math.max(0, bruto - processorFees)),
  };
}
