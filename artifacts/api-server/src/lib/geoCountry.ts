import type { Request } from "express";
import geoip from "geoip-lite";
import { clientIpKey } from "./trustedClient.js";

const COUNTRY_RE = /^[A-Z]{2}$/;

function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const upper = raw.trim().toUpperCase();
  if (!COUNTRY_RE.test(upper)) return null;
  if (upper === "XX" || upper === "T1") return null;
  return upper;
}

function headerCountry(req: Request, name: string): string | null {
  const value = req.headers[name.toLowerCase()];
  if (typeof value !== "string" || value.length !== 2) return null;
  return normalizeCountryCode(value);
}

function stripIpv4Mapped(ip: string): string {
  return ip.replace(/^::ffff:/i, "");
}

/** True for loopback / LAN — not usable for geo lookup. */
export function isPrivateOrLoopbackIp(ip: string): boolean {
  const clean = stripIpv4Mapped(ip.trim());
  if (!clean || clean === "unknown") return true;
  if (clean === "::1" || clean === "127.0.0.1") return true;
  if (clean.startsWith("10.")) return true;
  if (clean.startsWith("192.168.")) return true;
  if (clean.startsWith("169.254.")) return true;
  if (clean.startsWith("100.")) {
    const octet = Number(clean.split(".")[1]);
    if (octet >= 64 && octet <= 127) return true;
  }
  if (clean.startsWith("172.")) {
    const octet = Number(clean.split(".")[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  if (clean.includes(":")) {
    const lower = clean.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
  }
  return false;
}

function countryFromIp(ip: string): string | null {
  const clean = stripIpv4Mapped(ip);
  const hit = geoip.lookup(clean);
  return normalizeCountryCode(hit?.country ?? null);
}

let devEgressCache: { country: string | null; expiresAt: number } | null = null;

/** Dev-only: when the request IP is loopback, infer country from the machine's public egress IP. */
async function devEgressCountry(): Promise<string | null> {
  const forced = normalizeCountryCode(process.env.GEO_DEV_DEFAULT_COUNTRY);
  if (forced) return forced;

  if (devEgressCache && Date.now() < devEgressCache.expiresAt) {
    return devEgressCache.country;
  }

  try {
    const resp = await fetch("http://ip-api.com/json/?fields=countryCode", {
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { countryCode?: string };
    const country = normalizeCountryCode(data.countryCode);
    devEgressCache = { country, expiresAt: Date.now() + 60 * 60_000 };
    return country;
  } catch {
    return null;
  }
}

/**
 * Resolve ISO 3166-1 alpha-2 country for the request.
 * CDN edge headers first, then GeoIP on the client IP, then dev egress fallback.
 */
export function resolveRequestCountryCode(req: Request): string | null {
  const debugHeader = normalizeCountryCode(req.headers["x-kmcheck-debug-country"]);
  if (process.env.NODE_ENV !== "production" && debugHeader) return debugHeader;

  const debugQuery = normalizeCountryCode(
    typeof req.query.debug_country === "string" ? req.query.debug_country : null,
  );
  if (process.env.NODE_ENV !== "production" && debugQuery) return debugQuery;

  const fromHeaders = [
    "cf-ipcountry",
    "cloudfront-viewer-country",
    "x-vercel-ip-country",
    "x-country-code",
    "fastly-geo-country-code",
  ];
  for (const name of fromHeaders) {
    const code = headerCountry(req, name);
    if (code) return code;
  }

  const ip = clientIpKey(req);
  if (!isPrivateOrLoopbackIp(ip)) {
    const fromIp = countryFromIp(ip);
    if (fromIp) return fromIp;
  }

  return null;
}

/** Async fallback — used for localhost dev when sync resolution returns null. */
export async function resolveRequestCountryCodeAsync(req: Request): Promise<string | null> {
  const sync = resolveRequestCountryCode(req);
  if (sync) return sync;

  if (process.env.NODE_ENV === "production") return null;

  const ip = clientIpKey(req);
  if (!isPrivateOrLoopbackIp(ip)) return null;

  return devEgressCountry();
}
