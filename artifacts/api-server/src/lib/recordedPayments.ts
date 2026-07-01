import { db, paymentsTable, vinLookupsTable } from "@workspace/db";
import { and, eq, exists, inArray, or, type SQL } from "drizzle-orm";

/** Lookup outcomes that count as a real delivered (or queued) report for the customer. */
export const FULFILLED_LOOKUP_STATUSES = ["complete", "pending_manual"] as const;

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

/**
 * Rows that belong in admin/client transaction history:
 * completed or revoked payment tied to a fulfilled lookup only.
 */
export function recordedTransactionWhere(extra?: SQL): SQL {
  const base = and(
    paymentHasFulfilledLookup(),
    or(eq(paymentsTable.status, "completed"), eq(paymentsTable.status, "revoked")),
  );
  return extra ? and(base, extra)! : base!;
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
