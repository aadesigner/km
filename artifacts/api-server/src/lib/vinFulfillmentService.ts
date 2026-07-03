import {
  db,
  vinLookupsTable,
  paymentsTable,
  couponsTable,
  usersTable,
} from "@workspace/db";
import { and, eq, sql, desc } from "drizzle-orm";
import { logger } from "./logger.js";
import { withUserVinLookupLock } from "./vinLookupMutex.js";
import {
  fetchFromProvider,
  getCachedVin,
  getCatalogVin,
  upsertVinCatalog,
  enrichVinReportDataForServe,
  isStaleKoreanReport,
} from "./vinService.js";
import { catalogHasDeliverableReport } from "./vinCatalogImport.js";
import {
  fulfillManualPendingVinLookup,
  isVinEligibleForManualPending,
} from "./pendingVinService.js";
import { finalizePaymentOnFulfillment } from "./recordedPayments.js";
import { fireVinReadyEmailForUser } from "./vinReadyEmail.js";
import { claimEmailDelivery, paymentConfirmEmailDeliveryKey } from "./emailDeliveryGuard.js";
import {
  applyFrozenKrwPerUsd,
  getCurrentKrwPerUsd,
  readFrozenKrwPerUsd,
} from "./krwRate.js";

export const VIN_FULFILLING_STATUS = "fulfilling" as const;

export type ProviderFulfillmentPayment = {
  amount: number;
  currency: string;
  ref: string | null;
} | null;

export type ProviderFulfillmentInput = {
  userId: string;
  normalizedVin: string;
  resolvedPaymentId: number | null;
  freeCouponPaymentId: number | null;
  freeCouponCode: string | null;
  resolvedPayment: ProviderFulfillmentPayment;
  provider: { id: number; name: string; baseUrl: string; apiKey: string };
  user: typeof usersTable.$inferSelect | undefined;
};

async function stampLookupReportData(
  data: Record<string, unknown>,
  existingRate?: number | null,
): Promise<Record<string, unknown>> {
  const currentRate = await getCurrentKrwPerUsd();
  return applyFrozenKrwPerUsd(data, {
    existingRate: existingRate ?? readFrozenKrwPerUsd(data),
    currentRate,
  });
}

async function countFreeCoupon(paymentId: number, couponCode: string): Promise<void> {
  try {
    await db
      .update(paymentsTable)
      .set({ couponCode: null, updatedAt: new Date() })
      .where(and(eq(paymentsTable.id, paymentId), eq(paymentsTable.couponCode, couponCode)));
  } catch (err) {
    logger.warn({ err, couponCode, paymentId }, "Failed to clear free coupon code on payment");
  }
}

async function failFreeCouponPayment(paymentId: number, couponCode: string | null): Promise<void> {
  try {
    await db.update(paymentsTable)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(paymentsTable.id, paymentId));
    if (couponCode) {
      await db.update(couponsTable)
        .set({ uses: sql`GREATEST(uses - 1, 0)` })
        .where(eq(couponsTable.code, couponCode));
    }
  } catch (err) {
    logger.warn({ err, paymentId, couponCode }, "Failed to roll back free coupon payment");
  }
}

async function firePaymentConfirmEmail(
  lookupId: number,
  vin: string,
  data: Record<string, unknown> | null,
  user: { name: string | null; email: string } | undefined,
  payment: ProviderFulfillmentPayment,
): Promise<void> {
  if (!user) return;
  const deliveryKey = paymentConfirmEmailDeliveryKey(lookupId, user.email);
  if (!claimEmailDelivery(deliveryKey)) {
    logger.info({ vin, lookupId, email: user.email }, "Payment confirmation email skipped — duplicate guard");
    return;
  }
  try {
    const { systemSettingsTable } = await import("@workspace/db");
    const { desc, eq } = await import("drizzle-orm");
    const [settings] = await db
      .select({
        emailSendReportConfirm: systemSettingsTable.emailSendReportConfirm,
        siteUrl: systemSettingsTable.siteUrl,
        emailTemplates: systemSettingsTable.emailTemplates,
      })
      .from(systemSettingsTable)
      .orderBy(desc(systemSettingsTable.id))
      .limit(1);
    if (settings?.emailSendReportConfirm === false) return;
    const siteUrl = settings?.siteUrl?.replace(/\/$/, "") ?? "https://kmcheck.com";
    const templates = (settings?.emailTemplates ?? {}) as import("@workspace/db").EmailTemplatesConfig;
    const { sendEmail, buildPaymentConfirmationEmail } = await import("./emailService.js");
    const d = data ?? {};
    const result = await sendEmail({
      to: user.email,
      ...buildPaymentConfirmationEmail({
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        vin,
        reportUrl: `${siteUrl}/en/report/${lookupId}`,
        make: (d.make as string | null) ?? null,
        model: (d.model as string | null) ?? null,
        year: (d.year as number | null) ?? null,
        mileage: (d.mileage as number | null) ?? (d.odometer as number | null) ?? null,
        accidents: (d.accidentCount as number | null) ?? (Array.isArray(d.accidents) ? (d.accidents as unknown[]).length : null),
        owners: (d.owners as number | null) ?? null,
        photos: Array.isArray(d.photos) ? (d.photos as string[]).filter(Boolean).slice(0, 6) : null,
        amount: payment?.amount ?? 0,
        currency: payment?.currency ?? "EUR",
        paymentRef: payment?.ref ?? null,
        siteUrl,
      }, templates.confirm),
    });
    if (!result.ok) logger.warn({ vin, err: result.error }, "Payment confirmation email failed");
  } catch (err) {
    logger.warn({ vin, err }, "Payment confirmation email threw");
  }
}

export async function findUserFulfillingLookup(userId: string, vin: string) {
  const [row] = await db
    .select()
    .from(vinLookupsTable)
    .where(and(
      eq(vinLookupsTable.userId, userId),
      eq(vinLookupsTable.vin, vin),
      eq(vinLookupsTable.status, VIN_FULFILLING_STATUS),
    ))
    .orderBy(desc(vinLookupsTable.id))
    .limit(1);
  return row ?? null;
}

async function completeLookupFromCatalog(
  lookupId: number,
  input: ProviderFulfillmentInput,
  catalogEntry: NonNullable<Awaited<ReturnType<typeof getCatalogVin>>>,
): Promise<void> {
  const catalogData = catalogEntry.data as Record<string, unknown>;
  const enriched = await enrichVinReportDataForServe(input.normalizedVin, catalogData);
  const stampedData = await stampLookupReportData(enriched ?? catalogData);
  await db.update(vinLookupsTable).set({
    status: "complete",
    data: stampedData,
    providerName: catalogEntry.providerName,
    fromCache: true,
    updatedAt: new Date(),
  }).where(eq(vinLookupsTable.id, lookupId));

  await finalizePaymentOnFulfillment(input.resolvedPaymentId, lookupId);
  if (input.freeCouponPaymentId && input.freeCouponCode) {
    void countFreeCoupon(input.freeCouponPaymentId, input.freeCouponCode);
  }
  void fireVinReadyEmailForUser(lookupId, input.normalizedVin, stampedData, input.user);
  void firePaymentConfirmEmail(lookupId, input.normalizedVin, stampedData, input.user, input.resolvedPayment);
  logger.info({
    msg: "vin_lookup_hit",
    source: "catalog_async",
    vin: input.normalizedVin,
    userId: input.userId,
    lookupId,
  });
}

async function runProviderFulfillmentJob(lookupId: number, input: ProviderFulfillmentInput): Promise<void> {
  const {
    userId,
    normalizedVin,
    resolvedPaymentId,
    freeCouponPaymentId,
    freeCouponCode,
    resolvedPayment,
    provider,
    user,
  } = input;

  try {
      await withUserVinLookupLock(userId, normalizedVin, async () => {
      const [current] = await db
        .select()
        .from(vinLookupsTable)
        .where(eq(vinLookupsTable.id, lookupId))
        .limit(1);
      if (!current || current.status !== VIN_FULFILLING_STATUS) return;

      const catalogEntry = await getCatalogVin(normalizedVin);
        const catalogData = (catalogEntry?.data as Record<string, unknown> | null) ?? null;
        if (catalogEntry && catalogData && !isStaleKoreanReport(catalogData)) {
          await completeLookupFromCatalog(lookupId, input, catalogEntry);
          return;
        }

        const cached = await getCachedVin(normalizedVin);
        const cachedData = (cached?.data as Record<string, unknown> | null) ?? null;
        if (cached && cached.status === "complete" && cachedData && !isStaleKoreanReport(cachedData)) {
          const enriched = await enrichVinReportDataForServe(normalizedVin, cachedData, {
            primaryUpdatedAt: cached.updatedAt,
          });
          const stampedData = await stampLookupReportData(enriched ?? cachedData);
          await db.update(vinLookupsTable).set({
            status: "complete",
            data: stampedData,
            providerName: cached.providerName,
            fromCache: true,
            updatedAt: new Date(),
          }).where(eq(vinLookupsTable.id, lookupId));
          await finalizePaymentOnFulfillment(resolvedPaymentId, lookupId);
          if (freeCouponPaymentId && freeCouponCode) {
            void countFreeCoupon(freeCouponPaymentId, freeCouponCode);
          }
          void fireVinReadyEmailForUser(lookupId, normalizedVin, stampedData, user);
          void firePaymentConfirmEmail(lookupId, normalizedVin, stampedData, user, resolvedPayment);
          logger.info({ msg: "vin_lookup_hit", source: "cache_async", vin: normalizedVin, userId, lookupId });
          return;
        }

        if (!provider.apiKey?.trim()) {
          throw new Error("Provider API key not configured");
        }

        const data = await fetchFromProvider(normalizedVin, provider.baseUrl, provider.apiKey);
        const stampedData = await stampLookupReportData(data as unknown as Record<string, unknown>);
        await db.update(vinLookupsTable).set({
          status: "complete",
          data: stampedData,
          providerName: provider.name,
          fromCache: false,
          updatedAt: new Date(),
        }).where(eq(vinLookupsTable.id, lookupId));
        await finalizePaymentOnFulfillment(resolvedPaymentId, lookupId);
        void upsertVinCatalog(normalizedVin, provider.name, stampedData);
        if (freeCouponPaymentId && freeCouponCode) {
          void countFreeCoupon(freeCouponPaymentId, freeCouponCode);
        }
        void fireVinReadyEmailForUser(lookupId, normalizedVin, stampedData, user);
        void firePaymentConfirmEmail(lookupId, normalizedVin, stampedData, user, resolvedPayment);
        logger.info({ msg: "vin_lookup_hit", source: "provider_async", vin: normalizedVin, userId, lookupId });
    });
  } catch (err) {
    logger.error({ err, vin: normalizedVin, userId, lookupId }, "Async VIN provider fulfillment failed");

    let errorCode: string | undefined;
    if (err instanceof Error) {
      if (/no vehicle history data found|vin not found/i.test(err.message)) {
        errorCode = "VIN_NO_DATA";
      } else if (/provider subscription|empty lots|balance is insufficient|not available|access denied/i.test(err.message)) {
        errorCode = "VIN_CHECK_UNAVAILABLE";
      }
    }

    if (errorCode === "VIN_NO_DATA" && await isVinEligibleForManualPending(normalizedVin)) {
      try {
        await db.delete(vinLookupsTable).where(eq(vinLookupsTable.id, lookupId));
        const lookup = await fulfillManualPendingVinLookup({
          vin: normalizedVin,
          userId,
          paymentId: resolvedPaymentId,
        });
        await finalizePaymentOnFulfillment(resolvedPaymentId, lookup.id);
        if (freeCouponPaymentId && freeCouponCode) {
          void countFreeCoupon(freeCouponPaymentId, freeCouponCode);
        }
        // Manual pending fallback: no customer email until admin publishes.
        logger.info({ msg: "vin_lookup_hit", source: "manual_pending_async_fallback", vin: normalizedVin, userId, lookupId: lookup.id });
        return;
      } catch (manualErr) {
        logger.error({ manualErr, vin: normalizedVin, lookupId }, "Async manual pending fallback failed");
      }
    }

    await db.update(vinLookupsTable).set({
      status: "error",
      updatedAt: new Date(),
    }).where(and(eq(vinLookupsTable.id, lookupId), eq(vinLookupsTable.status, VIN_FULFILLING_STATUS)));

    if (resolvedPaymentId) {
      try {
        const [pmt] = await db.select({ amount: paymentsTable.amount })
          .from(paymentsTable)
          .where(eq(paymentsTable.id, resolvedPaymentId))
          .limit(1);
        const isFreeCoupon = Number(pmt?.amount ?? 0) === 0;
        if (isFreeCoupon) {
          await failFreeCouponPayment(resolvedPaymentId, freeCouponCode);
        } else {
          logger.error({
            msg: "paid_vin_lookup_delivery_failed",
            paymentId: resolvedPaymentId,
            vin: normalizedVin,
            userId,
            lookupId,
            errorCode,
          });
        }
      } catch (dbErr) {
        logger.error({ dbErr }, "Failed to update payment after async VIN lookup error");
      }
    }
  }
}

/** Queue provider fetch in background; HTTP returns immediately with fulfilling status. */
export async function startProviderFulfillment(
  input: ProviderFulfillmentInput,
): Promise<{ id: number; vin: string; status: string }> {
  const existing = await findUserFulfillingLookup(input.userId, input.normalizedVin);
  if (existing) {
    return { id: existing.id, vin: existing.vin, status: existing.status };
  }

  const [lookup] = await db.insert(vinLookupsTable).values({
    vin: input.normalizedVin,
    userId: input.userId,
    status: VIN_FULFILLING_STATUS,
    data: null,
    providerName: input.provider.name,
    fromCache: false,
    paymentId: input.resolvedPaymentId,
  }).returning();

  logger.info({
    msg: "vin_lookup_queued",
    vin: input.normalizedVin,
    userId: input.userId,
    lookupId: lookup.id,
    paymentRef: input.resolvedPayment?.ref ?? null,
  });

  void runProviderFulfillmentJob(lookup.id, input);
  return { id: lookup.id, vin: lookup.vin, status: lookup.status };
}
