import { Router } from "express";
import { db, paymentsTable, pricingTable, usersTable, systemSettingsTable, couponsTable, DEFAULT_PRICING, normalizePricingAmounts } from "@workspace/db";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";
import { ensureVinPayableForPayment } from "../lib/vinService.js";
import { recordedTransactionWhere } from "../lib/recordedPayments.js";
import rateLimit from "express-rate-limit";
import { isTrustedApiRequest } from "../lib/clientGuard.js";
import { isRecaptchaRelaxedForRequest } from "../lib/allowedOrigins.js";
import { makeTtlCache } from "../lib/ttlCache.js";
import { getEffectiveSystemSettings } from "../lib/systemSettings.js";
import {
  isFacebookOAuthConfigured,
  isGoogleOAuthConfigured,
  isLinkedInOAuthConfigured,
} from "../lib/oauthSettings.js";
import { normalizeMaintenanceRestrictions } from "../lib/maintenancePolicy.js";
import { rejectVinLookupIfDisabled } from "../lib/vinLookupGate.js";
import { resolveClarityProjectId } from "../lib/analyticsIds.js";
import {
  PAYPAL_ORDER_ID_RE,
  fetchPaypalOrderStatus,
  interpretPaypalCaptureResponse,
  fetchPaypalOrderCaptureAmount,
  paypalAmountsMatch,
} from "../lib/paypalCapture.js";
import { paypalOrderCreateLimiter, paypalCaptureLimiter } from "../lib/expensiveEndpointLimiter.js";

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many coupon attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTrustedApiRequest(req),
});

const router = Router();

// ── PayPal helpers ────────────────────────────────────────────────────────────

async function getPaypalConfig() {
  const settings = await getEffectiveSystemSettings();
  const clientId = (settings?.paypalClientId?.trim() || process.env.PAYPAL_CLIENT_ID?.trim()) ?? "";
  const clientSecret = (settings?.paypalClientSecret?.trim() || process.env.PAYPAL_CLIENT_SECRET?.trim()) ?? "";
  const sandbox = settings?.paypalSandbox ?? true;
  return { clientId, clientSecret, sandbox };
}

async function getPaypalAccessToken(clientId: string, clientSecret: string, sandbox: boolean) {
  const base = sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`PayPal auth failed: ${err.slice(0, 200)}`);
  }
  const data = await resp.json() as { access_token: string; expires_in?: number };
  return { token: data.access_token, base, expiresIn: data.expires_in ?? 32400 };
}

// Cache PayPal access tokens — they're valid for ~9 h; refresh 5 min early
let _ppTokenCache: { cacheKey: string; token: string; base: string; expiresAt: number } | null = null;

async function getPaypalAccessTokenCached(clientId: string, clientSecret: string, sandbox: boolean) {
  const cacheKey = `${sandbox ? "sb" : "live"}:${clientId}`;
  if (_ppTokenCache && _ppTokenCache.cacheKey === cacheKey && Date.now() < _ppTokenCache.expiresAt) {
    return { token: _ppTokenCache.token, base: _ppTokenCache.base };
  }
  const { token, base, expiresIn } = await getPaypalAccessToken(clientId, clientSecret, sandbox);
  _ppTokenCache = { cacheKey, token, base, expiresAt: Date.now() + (expiresIn - 300) * 1000 };
  return { token, base };
}

// ── Pricing ───────────────────────────────────────────────────────────────────

async function getActivePricing() {
  const [pricing] = await db.select().from(pricingTable).orderBy(desc(pricingTable.id)).limit(1);
  return normalizePricingAmounts(pricing ?? DEFAULT_PRICING);
}

type PricingResponse = { basePrice: number; discountPrice: number; currency: string; discountEnabled: boolean };
type PublicSettingsResponse = {
  recaptchaEnabled: boolean;
  recaptchaSiteKey: string | null;
  paypalClientId: string | null;
  paypalSandbox: boolean;
  paypalEnableCards: boolean;
  googleEnabled: boolean;
  facebookEnabled: boolean;
  linkedinEnabled: boolean;
  freeVinDecoderEnabled: boolean;
  freeVinDecoderRequireSignIn: boolean;
  krwPerUsd: number;
  analyticsGtmEnabled: boolean;
  analyticsGtmContainerId: string | null;
  analyticsGaEnabled: boolean;
  analyticsGaMeasurementId: string | null;
  analyticsClarityEnabled: boolean;
  analyticsClarityProjectId: string | null;
  maintenanceMode: boolean;
  maintenanceRestrictions: string[];
  maintenanceMessage: string | null;
  vinLookupEnabled: boolean;
};

const pricingCache = makeTtlCache<PricingResponse>(30 * 60_000);
const publicSettingsCache = makeTtlCache<PublicSettingsResponse>(5 * 60_000);

export function invalidatePricingCache(): void { pricingCache.invalidate(); }
export function invalidatePublicSettingsCache(): void { publicSettingsCache.invalidate(); }

// GET /payments/current-pricing
router.get("/payments/current-pricing", async (_req, res) => {
  const data = await pricingCache.getOrFetch(async () => {
    const pricing = await getActivePricing();
    return {
      basePrice: pricing.basePrice,
      discountPrice: pricing.discountPrice,
      currency: pricing.currency,
      discountEnabled: pricing.discountEnabled,
    };
  });
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  res.json(data);
});

// GET /payments/public-settings
router.get("/payments/public-settings", async (req, res) => {
  const data = await publicSettingsCache.getOrFetch(async () => {
    const settings = await getEffectiveSystemSettings();
    const envClientId = process.env.PAYPAL_CLIENT_ID?.trim() || null;
    const rawClientId = settings?.paypalClientId?.trim() || envClientId;
    const paypalClientId = rawClientId || null;
    const googleEnabled = isGoogleOAuthConfigured(settings);
    const facebookEnabled = isFacebookOAuthConfigured(settings);
    const linkedinEnabled = isLinkedInOAuthConfigured(settings);
    return {
      recaptchaEnabled: settings?.recaptchaEnabled ?? false,
      recaptchaSiteKey: settings?.recaptchaSiteKey ?? null,
      paypalClientId,
      paypalSandbox: settings?.paypalSandbox ?? true,
      paypalEnableCards: settings?.paypalEnableCards ?? true,
      googleEnabled,
      facebookEnabled,
      linkedinEnabled,
      freeVinDecoderEnabled: settings?.freeVinDecoderEnabled ?? true,
      freeVinDecoderRequireSignIn: settings?.freeVinDecoderRequireSignIn ?? false,
      krwPerUsd: settings?.krwPerUsd && settings.krwPerUsd > 0 ? settings.krwPerUsd : 1537,
      analyticsGtmEnabled: !!(settings?.analyticsGtmEnabled && settings.analyticsGtmContainerId?.trim()),
      analyticsGtmContainerId: settings?.analyticsGtmContainerId?.trim() || null,
      analyticsGaEnabled: !!(settings?.analyticsGaEnabled && settings.analyticsGaMeasurementId?.trim()),
      analyticsGaMeasurementId: settings?.analyticsGaMeasurementId?.trim() || null,
      analyticsClarityEnabled: !!(
        settings?.analyticsClarityEnabled && resolveClarityProjectId(settings)
      ),
      analyticsClarityProjectId: resolveClarityProjectId(settings),
      maintenanceMode: settings?.maintenanceMode ?? false,
      maintenanceRestrictions: normalizeMaintenanceRestrictions(settings?.maintenanceRestrictions),
      maintenanceMessage: settings?.maintenanceMessage?.trim() || null,
      vinLookupEnabled: settings?.vinLookupEnabled !== false,
    };
  });
  const relaxed = isRecaptchaRelaxedForRequest(req);
  res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  res.json({
    ...data,
    recaptchaEnabled: relaxed ? false : data.recaptchaEnabled,
    recaptchaSiteKey: relaxed ? null : data.recaptchaSiteKey,
  });
});

async function verifyRecaptcha(
  token: string,
  secretKey: string,
  minScore = 0.5,
): Promise<boolean> {
  const endpoints = [
    "https://www.google.com/recaptcha/api/siteverify",
    "https://www.recaptcha.net/recaptcha/api/siteverify",
  ];
  for (const endpoint of endpoints) {
    try {
      const body = new URLSearchParams({ secret: secretKey, response: token });
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(5000),
      });
      const data = await resp.json() as { success: boolean; score?: number };
      if (data.success && (data.score ?? 1) >= minScore) return true;
    } catch {
      // try next endpoint
    }
  }
  return false;
}

// ── Coupon validation helper ──────────────────────────────────────────────────

async function resolveCoupon(code: string, basePrice: number): Promise<{
  coupon: typeof couponsTable.$inferSelect;
  finalPrice: number;
  discountAmount: number;
} | { error: string }> {
  const [coupon] = await db.select().from(couponsTable)
    .where(eq(couponsTable.code, code.toUpperCase().trim()))
    .limit(1);

  if (!coupon || !coupon.isActive) return { error: "Invalid or inactive coupon code" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: "Coupon has expired" };
  if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) return { error: "Coupon usage limit reached" };

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = parseFloat((basePrice * (coupon.value / 100)).toFixed(2));
  } else {
    discountAmount = Math.min(coupon.value, basePrice);
  }

  const finalPrice = parseFloat(Math.max(0, basePrice - discountAmount).toFixed(2));
  return { coupon, finalPrice, discountAmount };
}

/** Atomically consume one coupon use; returns false when maxUses is exhausted. */
async function consumeCouponUse(couponId: number, maxUses: number | null): Promise<boolean> {
  const conditions = [eq(couponsTable.id, couponId)];
  if (maxUses != null) {
    conditions.push(lt(couponsTable.uses, maxUses));
  }

  const [updated] = await db
    .update(couponsTable)
    .set({ uses: sql`${couponsTable.uses} + 1`, updatedAt: new Date() })
    .where(and(...conditions))
    .returning({ id: couponsTable.id });

  return !!updated;
}

/** Roll back a reserved coupon use when order creation fails before payment is stored. */
async function releaseCouponUse(couponId: number): Promise<void> {
  await db
    .update(couponsTable)
    .set({ uses: sql`GREATEST(${couponsTable.uses} - 1, 0)`, updatedAt: new Date() })
    .where(eq(couponsTable.id, couponId));
}

// POST /payments/validate-coupon
router.post("/payments/validate-coupon", requireAuth, couponLimiter, async (req, res) => {
  if (await rejectVinLookupIfDisabled(req, res)) return;
  const { code } = req.body as { code?: string };
  if (!code?.trim()) {
    res.status(400).json({ error: "Coupon code is required" });
    return;
  }

  const pricing = await getActivePricing();
  const basePrice = pricing.discountEnabled ? pricing.discountPrice : pricing.basePrice;
  const result = await resolveCoupon(code, basePrice);

  if ("error" in result) {
    res.status(422).json({ error: result.error });
    return;
  }

  res.json({
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    finalPrice: result.finalPrice,
    discountAmount: result.discountAmount,
    isFree: result.finalPrice === 0,
    vin: req.body.vin ?? null,
  });
});

// POST /payments/create-paypal-order — creates a PayPal order and returns orderId
router.post("/payments/create-paypal-order", paypalOrderCreateLimiter, requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { vin, couponCode, recaptchaToken } = req.body as {
    vin: string; couponCode?: string; recaptchaToken?: string;
  };

  const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
  if (!vin || !VIN_RE.test(vin)) { res.status(400).json({ error: "Invalid VIN — must be 17 alphanumeric characters (no I, O, or Q)" }); return; }

  // Coupon code: max 50 chars, alphanumeric + dash/underscore only
  const COUPON_RE = /^[A-Z0-9_-]{1,50}$/i;
  if (couponCode?.trim() && !COUPON_RE.test(couponCode.trim())) {
    res.status(400).json({ error: "Invalid coupon code format" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user[0]?.isBanned) { res.status(403).json({ error: "Account suspended" }); return; }
  if (await rejectVinLookupIfDisabled(req, res)) return;

  const pricing = await getActivePricing();
  const basePrice = pricing.discountEnabled ? pricing.discountPrice : pricing.basePrice;
  const currency = pricing.currency;

  let finalPrice = basePrice;
  let discountAmount = 0;
  let appliedCoupon: typeof couponsTable.$inferSelect | null = null;

  if (couponCode?.trim()) {
    const couponResult = await resolveCoupon(couponCode, basePrice);
    if ("error" in couponResult) { res.status(422).json({ error: couponResult.error }); return; }
    finalPrice = couponResult.finalPrice;
    discountAmount = couponResult.discountAmount;
    appliedCoupon = couponResult.coupon;
  }

  const normalizedVin = vin.toUpperCase();

  const payable = await ensureVinPayableForPayment(userId, normalizedVin);
  if (!payable.ok) {
    if (payable.code === "ALREADY_UNLOCKED") {
      res.status(409).json({ error: "You already have access to this VIN report.", code: "ALREADY_UNLOCKED", alreadyUnlocked: true, lookupId: payable.lookupId ?? null });
      return;
    }
    if (payable.code === "VIN_NO_DATA") {
      res.status(422).json({ error: "No vehicle history data found for this VIN.", code: "VIN_NO_DATA" });
      return;
    }
    res.status(503).json({ error: payable.reason, code: "VIN_CHECK_UNAVAILABLE" });
    return;
  }

  if (finalPrice === 0) {
    const [existingPendingFree] = await db.select().from(paymentsTable)
      .where(and(
        eq(paymentsTable.userId, userId),
        eq(paymentsTable.vin, normalizedVin),
        eq(paymentsTable.status, "pending"),
        eq(paymentsTable.amount, 0),
        sql`${paymentsTable.couponCode} IS NOT NULL`,
      ))
      .orderBy(desc(paymentsTable.id))
      .limit(1);

    if (existingPendingFree) {
      logger.info({
        msg: "payment_reused",
        type: "free_coupon_pending",
        paymentId: existingPendingFree.id,
        userId,
        vin: normalizedVin,
        couponCode: existingPendingFree.couponCode ?? null,
      });
      res.json({ free: true, paymentId: existingPendingFree.id, vin: normalizedVin });
      return;
    }

    if (appliedCoupon) {
      const reserved = await consumeCouponUse(appliedCoupon.id, appliedCoupon.maxUses);
      if (!reserved) {
        res.status(422).json({ error: "Coupon usage limit reached" });
        return;
      }
    }

    const [payment] = await db.insert(paymentsTable).values({
      userId,
      vin: normalizedVin,
      amount: 0,
      currency,
      status: "pending",
      couponCode: appliedCoupon?.code ?? null,
      discountAmount,
    }).returning();
    logger.info({ msg: "payment_created", type: "free_coupon", paymentId: payment.id, userId, vin: normalizedVin, couponCode: appliedCoupon?.code ?? null });
    res.json({ free: true, paymentId: payment.id, vin: normalizedVin });
    return;
  }

  const { clientId, clientSecret, sandbox } = await getPaypalConfig();
  if (!clientId || !clientSecret) {
    res.status(503).json({ error: "Payment system not configured. Contact support." });
    return;
  }

  let reservedCouponId: number | null = null;
  if (appliedCoupon) {
    const reserved = await consumeCouponUse(appliedCoupon.id, appliedCoupon.maxUses);
    if (!reserved) {
      res.status(422).json({ error: "Coupon usage limit reached" });
      return;
    }
    reservedCouponId = appliedCoupon.id;
  }

  try {
    const { token: ppToken, base } = await getPaypalAccessTokenCached(clientId, clientSecret, sandbox);
    const userEmail = user[0]?.email ?? "";

    const orderResp = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ppToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: finalPrice.toFixed(2),
            breakdown: {
              item_total: { currency_code: currency, value: discountAmount > 0 ? basePrice.toFixed(2) : finalPrice.toFixed(2) },
              ...(discountAmount > 0 ? { discount: { currency_code: currency, value: discountAmount.toFixed(2) } } : {}),
            },
          },
          description: `VIN Report — ${normalizedVin}`,
          items: [{
            name: `VIN Report — ${normalizedVin}`,
            quantity: "1",
            unit_amount: { currency_code: currency, value: discountAmount > 0 ? basePrice.toFixed(2) : finalPrice.toFixed(2) },
          }],
          custom_id: `${userId}|${normalizedVin}`,
        }],
        payer: userEmail ? { email_address: userEmail } : undefined,
        application_context: {
          brand_name: "kmcheck.com",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!orderResp.ok) {
      const err = await orderResp.text();
      if (reservedCouponId != null) await releaseCouponUse(reservedCouponId);
      throw new Error(`PayPal order creation failed: ${err.slice(0, 300)}`);
    }

    const order = await orderResp.json() as { id: string };

    await db.insert(paymentsTable).values({
      userId,
      vin: normalizedVin,
      amount: finalPrice,
      currency,
      status: "pending",
      paypalOrderId: order.id,
      couponCode: appliedCoupon?.code ?? null,
      discountAmount: discountAmount > 0 ? discountAmount : null,
    });
    reservedCouponId = null;

    logger.info({ msg: "payment_created", type: "paypal_order", paypalOrderId: order.id, userId, vin: normalizedVin, amount: finalPrice, currency, couponCode: appliedCoupon?.code ?? null });
    res.json({ orderId: order.id, finalPrice, discountAmount, vin: normalizedVin, isFree: false });
  } catch (err) {
    if (reservedCouponId != null) await releaseCouponUse(reservedCouponId);
    logger.error({ err }, "PayPal order creation failed");
    res.status(502).json({ error: "Failed to create payment. Please try again." });
  }
});

// POST /payments/capture-paypal-order
router.post("/payments/capture-paypal-order", paypalCaptureLimiter, requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { orderId } = req.body as { orderId: string };
  if (!orderId || !PAYPAL_ORDER_ID_RE.test(orderId)) {
    res.status(400).json({ error: "Invalid order ID", code: "INVALID_ORDER_ID" });
    return;
  }

  const [payment] = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.paypalOrderId, orderId))
    .limit(1);

  if (!payment || payment.userId !== userId) {
    res.status(404).json({ error: "Payment not found", code: "PAYMENT_NOT_FOUND" });
    return;
  }
  if (payment.status === "completed") {
    res.json({ success: true, vin: payment.vin, paymentId: payment.id });
    return;
  }

  const { clientId, clientSecret, sandbox } = await getPaypalConfig();
  if (!clientId || !clientSecret) {
    res.status(503).json({ error: "Payment system not configured. Contact support.", code: "PAYMENT_NOT_CONFIGURED" });
    return;
  }

  try {
    const { token: ppToken, base } = await getPaypalAccessTokenCached(clientId, clientSecret, sandbox);
    const captureResp = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ppToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    const captureAttempt = await interpretPaypalCaptureResponse(
      captureResp,
      () => fetchPaypalOrderStatus(base, ppToken, orderId),
    );

    if (!captureAttempt.treatedAsCompleted) {
      await db.update(paymentsTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(paymentsTable.paypalOrderId, orderId));
      logger.warn({
        msg: "payment_capture_failed",
        orderId,
        userId,
        vin: payment.vin,
        captureStatus: captureAttempt.orderStatus,
      });
      res.status(402).json({
        error: "Payment was not completed. Please try again.",
        code: "PAYMENT_NOT_COMPLETED",
      });
      return;
    }

    let captured = captureAttempt.capturedAmount != null && captureAttempt.capturedCurrency
      ? { amount: captureAttempt.capturedAmount, currency: captureAttempt.capturedCurrency }
      : null;
    if (!captured) {
      captured = await fetchPaypalOrderCaptureAmount(base, ppToken, orderId);
    }
    if (captured && !paypalAmountsMatch(Number(payment.amount), payment.currency, captured)) {
      await db.update(paymentsTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(paymentsTable.paypalOrderId, orderId));
      logger.error({
        msg: "payment_capture_amount_mismatch",
        orderId,
        paymentId: payment.id,
        expectedAmount: payment.amount,
        expectedCurrency: payment.currency,
        capturedAmount: captured.amount,
        capturedCurrency: captured.currency,
      });
      res.status(402).json({
        error: "Payment amount verification failed. Please contact support.",
        code: "PAYMENT_AMOUNT_MISMATCH",
      });
      return;
    }

    await db.update(paymentsTable)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(paymentsTable.paypalOrderId, orderId));
    logger.info({
      msg: "payment_captured",
      orderId,
      paymentId: payment.id,
      userId,
      vin: payment.vin,
      amount: payment.amount,
      currency: payment.currency,
    });

    res.json({ success: true, vin: payment.vin, paymentId: payment.id });
  } catch (err) {
    logger.error({ err, orderId }, "PayPal capture failed");

    try {
      const { token: ppToken, base } = await getPaypalAccessTokenCached(clientId, clientSecret, sandbox);
      const orderStatus = await fetchPaypalOrderStatus(base, ppToken, orderId);
      if (orderStatus === "COMPLETED") {
        await db.update(paymentsTable)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(paymentsTable.paypalOrderId, orderId));
        logger.info({ msg: "payment_captured_recovered", orderId, paymentId: payment.id, userId, vin: payment.vin });
        res.json({ success: true, vin: payment.vin, paymentId: payment.id });
        return;
      }
    } catch (recoverErr) {
      logger.error({ recoverErr, orderId }, "PayPal capture recovery check failed");
    }

    const [fresh] = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.paypalOrderId, orderId))
      .limit(1);
    if (fresh?.status === "completed") {
      res.json({ success: true, vin: fresh.vin, paymentId: fresh.id });
      return;
    }

    await db.update(paymentsTable)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(paymentsTable.paypalOrderId, orderId));
    res.status(502).json({
      error: "Failed to capture payment. Please try again.",
      code: "PAYMENT_CAPTURE_FAILED",
    });
  }
});

// GET /payments/history
router.get("/payments/history", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const payments = await db.select().from(paymentsTable)
    .where(recordedTransactionWhere(eq(paymentsTable.userId, userId)))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(50);
  res.json(payments);
});

export default router;
