/**
 * Carstat USA API (Carfax / AutoCheck) — PDF/HTML report URLs.
 * Docs: https://telegra.ph/API-carfax--autocheck-08-04
 * Auth: same Carstat x-api-key. Free check-records; paid /api/reports/{type}/{vin}.
 */
import { and, eq } from "drizzle-orm";
import { db, providersTable } from "@workspace/db";
import { logger } from "./logger.js";
import { assertValidProviderBaseUrl } from "./providerUrl.js";
import type { NormalizedVinData } from "./vinService.js";
import {
  ensureCarstatUsaApiEnabledLoaded,
  isCarstatUsaApiEnabledCached,
} from "./carstatUsaApiSettingsCache.js";

const DEFAULT_BASE = "https://carstat.dev";

function normalizeCarstatBaseUrl(baseUrl: string): string {
  try {
    return assertValidProviderBaseUrl(baseUrl)
      .replace(/\/$/, "")
      .replace("://api.carstat.dev", "://carstat.dev");
  } catch {
    return DEFAULT_BASE;
  }
}

export const CARSTAT_USA_PROVIDER_NAME = "carstat_usa";
export const CARSTAT_USA_DATA_SOURCE = "carstat_usa" as const;

/** Carstat is still generating the HTML/PDF — wait/poll, do not hard-fail. */
export const PROVIDER_GENERATION_IN_PROGRESS = "PROVIDER_GENERATION_IN_PROGRESS";
/** Single attempt timed out — wait before the next poll (do not immediate re-fetch). */
export const PROVIDER_USA_TIMEOUT = "PROVIDER_USA_TIMEOUT";

/**
 * Per-attempt HTTP timeout for /api/reports/{type}/{vin}.
 * Docs warn +40–60s only for ?pdf=1 — we never send that (HTML + exclude_base_64).
 * Keep this short; slow generation is handled by wait/poll, not one long hang.
 */
const USA_REPORT_ATTEMPT_TIMEOUT_MS = Math.max(
  8_000,
  Number(process.env.CARSTAT_USA_REPORT_ATTEMPT_TIMEOUT_MS ?? 20_000) || 20_000,
);
/** Total time to keep lookup fulfilling while Carstat generates. */
const USA_REPORT_MAX_WAIT_MS = Math.max(
  60_000,
  Number(process.env.CARSTAT_USA_REPORT_MAX_WAIT_MS ?? 180_000) || 180_000,
);
/** First backoff after timeout / "already in progress" (then increases). */
const USA_REPORT_INITIAL_POLL_MS = Math.max(
  5_000,
  Number(process.env.CARSTAT_USA_REPORT_POLL_MS ?? 15_000) || 15_000,
);

export function isCarstatUsaGenerationInProgressMessage(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("already in progress")
    || (t.includes("request rejected") && t.includes("generation"))
  );
}

function isTimeoutOrAbort(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "TimeoutError"
    || err.name === "AbortError"
    || msg.includes("timeout")
    || msg.includes("aborted")
    || msg.includes("abort")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isCarstatUsaRetryableWaitError(err: unknown): boolean {
  const code = err && typeof err === "object" && "code" in err
    ? String((err as { code?: unknown }).code ?? "")
    : "";
  return code === PROVIDER_GENERATION_IN_PROGRESS || code === PROVIDER_USA_TIMEOUT;
}

export type CarstatUsaReportType = "carfax" | "autocheck";

export type CarstatUsaPdfReport = {
  type: CarstatUsaReportType;
  pdfUrl: string | null;
  htmlUrl: string | null;
  reportId: number | null;
  vehicle: string | null;
  fetchedAt: string;
};

export type CarstatUsaCheckRecords = {
  vin: string;
  carfax: number;
  autocheck: number;
  sticker: boolean;
  vehicle: string | null;
};

export type CarstatUsaCheckResult =
  | { status: "exists"; records: CarstatUsaCheckRecords; preferredType: CarstatUsaReportType }
  | { status: "not_found" }
  | { status: "unavailable"; reason: string };

const PUBLIC_UNAVAILABLE = "VIN check temporarily unavailable. Please try again shortly.";

function providerHeaders(apiKey: string): HeadersInit {
  return { Accept: "application/json", "x-api-key": apiKey };
}

export function checkRecordsUrl(base: string, vin: string): string {
  return `${base.replace(/\/$/, "")}/api/reports/check-records/${encodeURIComponent(vin)}`;
}

export function reportUrl(
  base: string,
  type: CarstatUsaReportType,
  vin: string,
  opts?: { excludeBase64?: boolean; days?: number },
): string {
  const u = new URL(
    `${base.replace(/\/$/, "")}/api/reports/${type}/${encodeURIComponent(vin)}`,
  );
  if (opts?.excludeBase64 !== false) u.searchParams.set("exclude_base_64", "1");
  if (opts?.days != null && opts.days > 0) u.searchParams.set("days", String(opts.days));
  return u.toString();
}

export function balanceUrl(base: string): string {
  return `${base.replace(/\/$/, "")}/api/reports/balance`;
}

/** Prefer carfax when it has records; else autocheck. */
export function pickPreferredReportType(records: {
  carfax: number;
  autocheck: number;
}): CarstatUsaReportType | null {
  if (records.carfax > 0) return "carfax";
  if (records.autocheck > 0) return "autocheck";
  return null;
}

export function stripBase64FromReportBody(body: Record<string, unknown>): Record<string, unknown> {
  const { base64: _drop, ...rest } = body;
  return rest;
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

/** Best-effort parse of "HONDA CR-V EX 2018" → make/model/year. */
export function parseVehicleLabel(vehicle: string | null | undefined): {
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
} {
  if (!vehicle?.trim()) return { make: null, model: null, year: null, trim: null };
  const parts = vehicle.trim().split(/\s+/);
  let year: number | null = null;
  if (/^\d{4}$/.test(parts[parts.length - 1] ?? "")) {
    year = Number(parts.pop());
  }
  const make = parts[0] ?? null;
  const model = parts[1] ?? null;
  const trim = parts.length > 2 ? parts.slice(2).join(" ") : null;
  return { make, model, year, trim };
}

export type CarstatUsaConfig = { apiKey: string; baseUrl: string };

async function loadCarstatCredentials(): Promise<CarstatUsaConfig | null> {
  const [row] = await db
    .select({
      apiKey: providersTable.apiKey,
      baseUrl: providersTable.baseUrl,
    })
    .from(providersTable)
    .where(and(eq(providersTable.name, "Carstat"), eq(providersTable.isActive, true)))
    .orderBy(providersTable.id)
    .limit(1);

  const apiKey = row?.apiKey?.trim();
  if (!apiKey) {
    // Fall back to any Carstat row with a key (even inactive) so enable can work after key save.
    const [anyRow] = await db
      .select({
        apiKey: providersTable.apiKey,
        baseUrl: providersTable.baseUrl,
      })
      .from(providersTable)
      .where(eq(providersTable.name, "Carstat"))
      .orderBy(providersTable.id)
      .limit(1);
    const key = anyRow?.apiKey?.trim();
    if (!key) return null;
    const baseUrl = normalizeCarstatBaseUrl(anyRow?.baseUrl || DEFAULT_BASE);
    return { apiKey: key, baseUrl };
  }
  const baseUrl = normalizeCarstatBaseUrl(row?.baseUrl || DEFAULT_BASE);
  return { apiKey, baseUrl };
}

export async function resolveCarstatUsaApiConfig(): Promise<CarstatUsaConfig | null> {
  await ensureCarstatUsaApiEnabledLoaded();
  if (!isCarstatUsaApiEnabledCached()) return null;
  return loadCarstatCredentials();
}

/** Sync peek — only valid after ensure/resolve; used in tests with cache write-through. */
export function getCarstatUsaApiConfigSync(
  credentials: CarstatUsaConfig | null,
): CarstatUsaConfig | null {
  if (!isCarstatUsaApiEnabledCached()) return null;
  return credentials;
}

export async function checkCarstatUsaRecords(vin: string): Promise<CarstatUsaCheckResult> {
  const cfg = await resolveCarstatUsaApiConfig();
  if (!cfg) {
    return { status: "unavailable", reason: "Carstat USA API disabled or Carstat key missing" };
  }

  const normalized = vin.trim().toUpperCase();
  const url = checkRecordsUrl(cfg.baseUrl, normalized);

  try {
    const res = await fetch(url, {
      headers: providerHeaders(cfg.apiKey),
      signal: AbortSignal.timeout(12_000),
    });
    const text = await res.text();

    if (res.status === 404) {
      return { status: "not_found" };
    }
    if (!res.ok) {
      logger.warn({
        msg: "carstat_usa_check_records_error",
        vin: normalized,
        status: res.status,
        body: text.slice(0, 160),
      });
      return { status: "unavailable", reason: PUBLIC_UNAVAILABLE };
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { status: "unavailable", reason: PUBLIC_UNAVAILABLE };
    }

    const records: CarstatUsaCheckRecords = {
      vin: str(body.vin) ?? normalized,
      carfax: num(body.carfax),
      autocheck: num(body.autocheck),
      sticker: body.sticker === true,
      vehicle: str(body.vehicle),
    };
    const preferredType = pickPreferredReportType(records);
    if (!preferredType) return { status: "not_found" };

    return { status: "exists", records, preferredType };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ msg: "carstat_usa_check_records_failed", vin: normalized, err: msg });
    return { status: "unavailable", reason: PUBLIC_UNAVAILABLE };
  }
}

/** One Carstat USA report attempt — no backoff. Prefer {@link fetchCarstatUsaReport}. */
export async function fetchCarstatUsaReportOnce(
  vin: string,
  type: CarstatUsaReportType,
): Promise<NormalizedVinData> {
  const cfg = await resolveCarstatUsaApiConfig();
  if (!cfg) {
    throw Object.assign(new Error("Carstat USA API is not configured"), {
      code: "VIN_CHECK_UNAVAILABLE",
    });
  }

  const normalized = vin.trim().toUpperCase();
  const url = reportUrl(cfg.baseUrl, type, normalized, { excludeBase64: true });

  try {
    const res = await fetch(url, {
      headers: providerHeaders(cfg.apiKey),
      // HTML URL JSON only (no ?pdf=1). Slow generation → poll, not a long hang.
      signal: AbortSignal.timeout(USA_REPORT_ATTEMPT_TIMEOUT_MS),
    });
    const text = await res.text();

    if (res.status === 404) {
      throw Object.assign(new Error("No vehicle history data found for this VIN in our database."), {
        code: "VIN_NO_DATA",
      });
    }
    if (res.status === 403) {
      throw Object.assign(new Error("Provider credits exhausted or access denied"), {
        code: "PROVIDER_CREDITS",
      });
    }
    if (res.status === 429) {
      throw Object.assign(new Error("Provider rate limited"), { code: "PROVIDER_RATE_LIMIT" });
    }
    if (!res.ok) {
      logger.warn({
        msg: "carstat_usa_report_error",
        vin: normalized,
        type,
        status: res.status,
        body: text.slice(0, 200),
      });
      if (isCarstatUsaGenerationInProgressMessage(text)) {
        throw Object.assign(
          new Error("Carstat USA report generation is already in progress"),
          { code: PROVIDER_GENERATION_IN_PROGRESS },
        );
      }
      throw Object.assign(new Error(PUBLIC_UNAVAILABLE), { code: "VIN_CHECK_UNAVAILABLE" });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw Object.assign(new Error(PUBLIC_UNAVAILABLE), { code: "VIN_CHECK_UNAVAILABLE" });
    }

    const clean = stripBase64FromReportBody(body);
    const pdfUrl = str(clean.pdf);
    const htmlUrl = str(clean.html);
    // Customer delivery is HTML-only (proxied + sanitized). PDF URL may still be stored server-side.
    if (!htmlUrl) {
      // Empty HTML often means generation not finished yet — wait/poll instead of hard NO_DATA.
      if (isCarstatUsaGenerationInProgressMessage(JSON.stringify(clean))) {
        throw Object.assign(
          new Error("Carstat USA report generation is already in progress"),
          { code: PROVIDER_GENERATION_IN_PROGRESS },
        );
      }
      throw Object.assign(new Error("No vehicle history data found for this VIN in our database."), {
        code: "VIN_NO_DATA",
      });
    }

    const vehicle = str(clean.vehicle);
    const parsed = parseVehicleLabel(vehicle);
    const reportId =
      typeof clean.id === "number" && Number.isFinite(clean.id) ? clean.id : null;

    const pdfReport: CarstatUsaPdfReport = {
      type,
      pdfUrl,
      htmlUrl,
      reportId,
      vehicle,
      fetchedAt: new Date().toISOString(),
    };

    logger.info({
      msg: "carstat_usa_report_ok",
      vin: normalized,
      type,
      hasPdf: !!pdfUrl,
      hasHtml: !!htmlUrl,
      reportId,
    });

    return {
      dataSource: CARSTAT_USA_DATA_SOURCE,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      trim: parsed.trim,
      country: "us",
      pdfReport,
    } as NormalizedVinData & { pdfReport: CarstatUsaPdfReport };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) throw err;
    if (isTimeoutOrAbort(err)) {
      logger.warn({
        msg: "carstat_usa_report_timeout",
        vin: normalized,
        type,
        timeoutMs: USA_REPORT_ATTEMPT_TIMEOUT_MS,
      });
      throw Object.assign(new Error("Carstat USA report timed out"), {
        code: PROVIDER_USA_TIMEOUT,
      });
    }
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ msg: "carstat_usa_report_failed", vin: normalized, type, err: msg });
    throw Object.assign(new Error(PUBLIC_UNAVAILABLE), { code: "VIN_CHECK_UNAVAILABLE" });
  }
}

/**
 * Fetch USA HTML report, waiting/polling while Carstat generates.
 * Keeps the caller (fulfillment) in `fulfilling` — does not immediate-retry after timeout.
 */
export async function fetchCarstatUsaReport(
  vin: string,
  type: CarstatUsaReportType,
): Promise<NormalizedVinData> {
  const normalized = vin.trim().toUpperCase();
  const started = Date.now();
  let delayMs = USA_REPORT_INITIAL_POLL_MS;
  let attempt = 0;

  for (;;) {
    attempt += 1;
    try {
      return await fetchCarstatUsaReportOnce(normalized, type);
    } catch (err) {
      if (!isCarstatUsaRetryableWaitError(err)) throw err;

      const elapsed = Date.now() - started;
      const code = err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code ?? "")
        : "";

      if (elapsed + delayMs >= USA_REPORT_MAX_WAIT_MS) {
        logger.error({
          msg: "carstat_usa_report_wait_exhausted",
          vin: normalized,
          type,
          attempt,
          elapsedMs: elapsed,
          lastCode: code,
        });
        throw Object.assign(new Error(PUBLIC_UNAVAILABLE), { code: "VIN_CHECK_UNAVAILABLE" });
      }

      logger.warn({
        msg: "carstat_usa_report_wait_poll",
        vin: normalized,
        type,
        attempt,
        delayMs,
        elapsedMs: elapsed,
        code,
      });
      await sleep(delayMs);
      delayMs = Math.min(Math.round(delayMs * 1.4), 30_000);
    }
  }
}

export async function fetchCarstatUsaBalance(): Promise<number | null> {
  const cfg = await resolveCarstatUsaApiConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(balanceUrl(cfg.baseUrl), {
      headers: providerHeaders(cfg.apiKey),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { balance?: unknown };
    return typeof body.balance === "number" ? body.balance : null;
  } catch {
    return null;
  }
}

export function isCarstatUsaPdfPayload(data: unknown): data is NormalizedVinData & {
  dataSource: typeof CARSTAT_USA_DATA_SOURCE;
  pdfReport: CarstatUsaPdfReport;
} {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (d.dataSource !== CARSTAT_USA_DATA_SOURCE) return false;
  const pr = d.pdfReport;
  if (!pr || typeof pr !== "object" || Array.isArray(pr)) return false;
  const p = pr as Record<string, unknown>;
  return typeof p.htmlUrl === "string" && p.htmlUrl.trim().length > 0;
}
