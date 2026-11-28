/**
 * Estimated payment-processor fees for admin Bruto / Neto display.
 * Keep in sync with artifacts/kmcheck/src/lib/payment-processor-fees.ts
 *
 * PayPal: 3.9% + €0.30 · POK: 2.5% + €0.20
 */

export const PAYPAL_FEE_RATE = 0.039;
export const PAYPAL_FEE_FIXED = 0.3;
export const POK_FEE_RATE = 0.025;
export const POK_FEE_FIXED = 0.2;

/**
 * SQL expression (alias `p`) → estimated neto for one payment row.
 * Collected-revenue filter should already exclude credit_redemption.
 */
export const SQL_PAYMENT_ESTIMATED_NET = `
  CASE
    WHEN COALESCE(p.amount, 0) <= 0 THEN 0
    WHEN p.pok_order_id IS NOT NULL AND TRIM(p.pok_order_id) <> '' THEN
      GREATEST(p.amount - (p.amount * ${POK_FEE_RATE} + ${POK_FEE_FIXED}), 0)
    ELSE
      GREATEST(p.amount - (p.amount * ${PAYPAL_FEE_RATE} + ${PAYPAL_FEE_FIXED}), 0)
  END
`.replace(/\s+/g, " ").trim();

/** SQL expression (alias `p`) → estimated processor fee for one payment row. */
export const SQL_PAYMENT_ESTIMATED_FEE = `
  CASE
    WHEN COALESCE(p.amount, 0) <= 0 THEN 0
    WHEN p.pok_order_id IS NOT NULL AND TRIM(p.pok_order_id) <> '' THEN
      (p.amount * ${POK_FEE_RATE} + ${POK_FEE_FIXED})
    ELSE
      (p.amount * ${PAYPAL_FEE_RATE} + ${PAYPAL_FEE_FIXED})
  END
`.replace(/\s+/g, " ").trim();
