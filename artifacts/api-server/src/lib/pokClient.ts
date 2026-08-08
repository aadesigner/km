/**
 * POK Payments REST client — server-only.
 * Credentials resolve from system_settings (admin Payments tab), with env fallback:
 * POK_MERCHANT_ID, POK_KEY_ID, POK_KEY_SECRET, POK_ENV (staging|production).
 * @see https://docs.pokpay.io/docs/rest-api.md
 * @see https://payments.doc.pokpay.io/
 */

import { getEffectiveSystemSettings } from "./systemSettings.js";
import { logger } from "./logger.js";

export type PokEnv = "staging" | "production";

export type PokConfig = {
  merchantId: string;
  keyId: string;
  keySecret: string;
  env: PokEnv;
  baseUrl: string;
};

export type PokSdkOrder = {
  id: string;
  amount?: number;
  finalAmount?: number;
  currencyCode?: string;
  originalAmount?: number;
  originalCurrencyCode?: string;
  isCompleted?: boolean;
  isRefunded?: boolean;
  merchantCustomReference?: string | null;
  description?: string | null;
};

type PokEnvelope<T> = {
  statusCode?: number;
  serverStatusCode?: number;
  data?: T;
  message?: string;
  errors?: unknown[];
};

/** UUID-ish order ids from POK (accept hyphenated UUID or opaque alphanumeric). */
export const POK_ORDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PokCredentialSource = {
  pokMerchantId?: string | null;
  pokKeyId?: string | null;
  pokKeySecret?: string | null;
  pokEnv?: string | null;
};

export function pokEnvFromRaw(raw: string | null | undefined): PokEnv {
  return (raw ?? "").trim().toLowerCase() === "staging" ? "staging" : "production";
}

/** Prefer settings.pokEnv, then POK_ENV, else production. */
export function getPokEnv(settings?: PokCredentialSource | null): PokEnv {
  const fromSettings = settings?.pokEnv?.trim();
  if (fromSettings) return pokEnvFromRaw(fromSettings);
  return pokEnvFromRaw(process.env.POK_ENV);
}

/** Sync resolve from a settings row and/or process.env (settings win when set). */
export function getPokConfig(settings?: PokCredentialSource | null): PokConfig | null {
  const merchantId =
    settings?.pokMerchantId?.trim()
    || process.env.POK_MERCHANT_ID?.trim()
    || "";
  const keyId =
    settings?.pokKeyId?.trim()
    || process.env.POK_KEY_ID?.trim()
    || "";
  const keySecret =
    settings?.pokKeySecret?.trim()
    || process.env.POK_KEY_SECRET?.trim()
    || "";
  if (!merchantId || !keyId || !keySecret) return null;
  const env = getPokEnv(settings);
  const baseUrl = env === "staging" ? "https://api-staging.pokpay.io" : "https://api.pokpay.io";
  return { merchantId, keyId, keySecret, env, baseUrl };
}

export function isPokConfigured(settings?: PokCredentialSource | null): boolean {
  return getPokConfig(settings) != null;
}

/** Load effective system settings then resolve POK credentials. */
let _pokConfigCache: { config: PokConfig | null; expiresAt: number } | null = null;

export async function resolvePokConfig(): Promise<PokConfig | null> {
  if (_pokConfigCache && Date.now() < _pokConfigCache.expiresAt) {
    return _pokConfigCache.config;
  }
  const settings = await getEffectiveSystemSettings();
  const config = getPokConfig(settings);
  _pokConfigCache = { config, expiresAt: Date.now() + 60_000 };
  return config;
}

export function clearPokConfigCache(): void {
  _pokConfigCache = null;
}

export async function isPokConfiguredAsync(): Promise<boolean> {
  return (await resolvePokConfig()) != null;
}

let _tokenCache: { cacheKey: string; token: string; expiresAt: number } | null = null;

export function clearPokTokenCache(): void {
  _tokenCache = null;
}

async function login(config: PokConfig): Promise<string> {
  const cacheKey = `${config.env}:${config.keyId}`;
  if (_tokenCache && _tokenCache.cacheKey === cacheKey && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const resp = await fetch(`${config.baseUrl}/auth/sdk/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: config.keyId, keySecret: config.keySecret }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`POK auth failed (${resp.status}): ${errText.slice(0, 200)}`);
  }

  const body = (await resp.json()) as PokEnvelope<{
    accessToken?: string;
    expiresIn?: number | string;
    expiresAt?: string;
  }>;

  const token = body.data?.accessToken?.trim();
  if (!token) throw new Error("POK auth response missing accessToken");

  let expiresAt = Date.now() + 50 * 60_000;
  const expiresInRaw = body.data?.expiresIn;
  if (typeof expiresInRaw === "number" && Number.isFinite(expiresInRaw)) {
    // Docs sometimes show ms (3600000), sometimes seconds — treat large values as ms.
    const ms = expiresInRaw > 100_000 ? expiresInRaw : expiresInRaw * 1000;
    expiresAt = Date.now() + Math.max(60_000, ms - 60_000);
  } else if (typeof expiresInRaw === "string" && /^\d+$/.test(expiresInRaw)) {
    const n = Number(expiresInRaw);
    const ms = n > 100_000 ? n : n * 1000;
    expiresAt = Date.now() + Math.max(60_000, ms - 60_000);
  } else if (body.data?.expiresAt) {
    const t = Date.parse(body.data.expiresAt);
    if (Number.isFinite(t)) expiresAt = t - 60_000;
  }

  _tokenCache = { cacheKey, token, expiresAt };
  return token;
}

async function pokFetch<T>(
  config: PokConfig,
  path: string,
  init?: RequestInit & { retryAuth?: boolean },
): Promise<T> {
  const token = await login(config);
  const resp = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(5_000),
  });

  if (resp.status === 401 && init?.retryAuth !== false) {
    clearPokTokenCache();
    return pokFetch(config, path, { ...init, retryAuth: false });
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`POK ${init?.method ?? "GET"} ${path} failed (${resp.status}): ${errText.slice(0, 300)}`);
  }

  return (await resp.json()) as T;
}

export type CreatePokOrderInput = {
  amount: number;
  currencyCode: string;
  description: string;
  merchantCustomReference: string;
  webhookUrl?: string;
  /** Optional pre-resolved config — avoids a second settings DB round-trip. */
  config?: PokConfig;
};

export async function createPokSdkOrder(input: CreatePokOrderInput): Promise<PokSdkOrder> {
  const config = input.config ?? (await resolvePokConfig());
  if (!config) throw new Error("POK_NOT_CONFIGURED");

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`POK_INVALID_AMOUNT:${input.amount}`);
  }
  // POK CreateSdkOrderPayload types `amount` as string; send a clean 2-decimal value.
  // Omit `products` — amount alone is valid per docs and matches the path that works for full-price orders.
  const amountValue = amount.toFixed(2);

  const body = await pokFetch<PokEnvelope<{ sdkOrder?: PokSdkOrder; id?: string }>>(
    config,
    `/merchants/${encodeURIComponent(config.merchantId)}/sdk-orders`,
    {
      method: "POST",
      body: JSON.stringify({
        amount: amountValue,
        currencyCode: input.currencyCode,
        autoCapture: true,
        shippingCost: 0,
        description: input.description,
        merchantCustomReference: input.merchantCustomReference,
        expiresAfterMinutes: 60,
        ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
      }),
    },
  );

  const order = body.data?.sdkOrder ?? (body.data as PokSdkOrder | undefined);
  const id = order?.id ?? body.data?.id;
  if (!id) {
    logger.error({ msg: "pok_create_order_missing_id", message: body.message, amount: amountValue });
    throw new Error("POK_ORDER_CREATE_INVALID_RESPONSE");
  }
  return { ...order, id };
}

export async function getPokSdkOrder(orderId: string): Promise<PokSdkOrder> {
  const config = await resolvePokConfig();
  if (!config) throw new Error("POK_NOT_CONFIGURED");

  const body = await pokFetch<PokEnvelope<{ sdkOrder?: PokSdkOrder } | PokSdkOrder>>(
    config,
    `/sdk-orders/${encodeURIComponent(orderId)}`,
    { method: "GET" },
  );

  const data = body.data;
  if (!data) throw new Error("POK_ORDER_NOT_FOUND");
  if ("sdkOrder" in data && data.sdkOrder) return data.sdkOrder;
  if ("id" in data && typeof (data as PokSdkOrder).id === "string") return data as PokSdkOrder;
  throw new Error("POK_ORDER_NOT_FOUND");
}

/**
 * Finish guest checkout on the server if the SDK has not already marked the order complete.
 * Safe to call when already completed (treat non-fatal errors as "check GET instead").
 */
export async function guestConfirmPokOrder(orderId: string): Promise<PokSdkOrder | null> {
  const config = await resolvePokConfig();
  if (!config) throw new Error("POK_NOT_CONFIGURED");

  try {
    const body = await pokFetch<PokEnvelope<{ sdkOrder?: PokSdkOrder }>>(
      config,
      `/sdk-orders/${encodeURIComponent(orderId)}/guest-confirm`,
      { method: "POST", body: "{}" },
    );
    return body.data?.sdkOrder ?? null;
  } catch (err) {
    logger.info({
      msg: "pok_guest_confirm_soft_fail",
      orderId,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function pokAmountsMatch(
  expectedAmount: number,
  expectedCurrency: string,
  order: PokSdkOrder,
): boolean {
  const currency = (order.originalCurrencyCode || order.currencyCode || "").toUpperCase();
  if (currency && currency !== expectedCurrency.toUpperCase()) return false;

  const candidates = [order.originalAmount, order.finalAmount, order.amount]
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (candidates.length === 0) return true; // no amount on payload — rely on isCompleted

  const expected = Number(expectedAmount);
  return candidates.some((got) => Math.abs(got - expected) < 0.02 || Math.abs(got - expected * 100) < 1);
}

/** Ensure order is completed (guest-confirm if needed) and return fresh order. */
export async function ensurePokOrderCompleted(orderId: string): Promise<PokSdkOrder> {
  let order = await getPokSdkOrder(orderId);
  if (order.isCompleted) return order;

  await guestConfirmPokOrder(orderId);
  order = await getPokSdkOrder(orderId);
  return order;
}
