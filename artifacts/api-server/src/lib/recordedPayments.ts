import { db, paymentsTable, vinLookupsTable } from "@workspace/db";
import { and, eq, exists, inArray, or, type SQL } from "drizzle-orm";

/** Lookup outcomes that count as a real delivered (or queued) report for the customer. */
export const FULFILLED_LOOKUP_STATUSES = ["complete", "pending_manual"] as const;

/** Payment kinds that are real money/history without a VIN lookup row. */
export const NON_LOOKUP_PAYMENT_KINDS = ["credit_pack", "credit_redemption"] as const;

/** Payment is linked to a fulfilled VIN report (unlock or manual pending queue). */
export function paymentHasFulfilledLookup(): SQL {
  return exists(
    db
      .select({ id: vinLookupsTable.id })
      .from(vinLookupsTable)
      .where(
        and(
          eq(vinLookupsTable.paymentId, paymentsTable.id),
          inArray(vinLookupsTable.status, [...FULFILLED_LOOKUP_STATUSES]),
        ),
      ),
  );
}

/** Completed credit pack / redemption (no VIN lookup required). */
export function paymentIsCompletedNonLookupKind(): SQL {
  return and(
    eq(paymentsTable.status, "completed"),
    inArray(paymentsTable.kind, [...NON_LOOKUP_PAYMENT_KINDS]),
  )!;
}

/**
 * Rows that belong in admin/client transaction history.
 * - Completed/revoked VIN payments with a fulfilled lookup
 * - Revoked payments even after lookups were removed (pending VIN credit/remove)
 * - Completed credit packs / redemptions
 */
export function recordedTransactionWhere(extra?: SQL): SQL {
  const base = or(
    and(
      paymentHasFulfilledLookup(),
      or(eq(paymentsTable.status, "completed"), eq(paymentsTable.status, "revoked")),
    ),
    eq(paymentsTable.status, "revoked"),
    paymentIsCompletedNonLookupKind(),
  )!;
  return extra ? and(base, extra)! : base;
}

/** Mark payment completed and link to the lookup that unlocked the report. */
export async function finalizePaymentOnFulfillment(
  paymentId: number | null | undefined,
  lookupId: number,
): Promise<void> {
  if (!paymentId) return;
  await db
    .update(paymentsTable)
    .set({
      status: "completed",
      vinLookupId: lookupId,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, paymentId));
}

export function isPaymentUsableForLookup(
  payment: { status: string; amount: number | null | undefined; userId: string },
  userId: string,
): boolean {
  if (payment.userId !== userId) return false;
  if (payment.status === "completed") return true;
  if (payment.status === "pending" && Number(payment.amount ?? 0) === 0) return true;
  return false;
}
