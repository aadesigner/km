import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

/** Per-user when authenticated, else per-IP — never skipped for trusted clients. */
export function userOrIpKey(req: Request): string {
  if (req.userId) return `u:${req.userId}`;
  const raw = (String(req.headers["x-forwarded-for"] ?? "")).split(",")[0]?.trim()
    || req.socket.remoteAddress
    || "unknown";
  return raw === "unknown" ? raw : `ip:${ipKeyGenerator(raw)}`;
}

/** Pre-checkout VIN peek — calls local-exists when catalog is cold. */
export const vinPeekLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.VIN_PEEK_RATE_MAX ?? 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many VIN preview requests. Please wait a moment." },
  keyGenerator: userOrIpKey,
});

/** PayPal order creation — each call may hit local-exists. */
export const paypalOrderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PAYPAL_ORDER_RATE_MAX ?? 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout attempts. Please wait before trying again." },
  keyGenerator: userOrIpKey,
});

/** PayPal capture — defense in depth. */
export const paypalCaptureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PAYPAL_CAPTURE_RATE_MAX ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment confirmations. Please wait before trying again." },
  keyGenerator: userOrIpKey,
});

/** Post-payment lookup — provider path is async but still bounded per user. */
export const vinLookupUserLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.VIN_LOOKUP_USER_RATE_MAX ?? 15),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many report requests. Please wait before trying again." },
  keyGenerator: userOrIpKey,
});

/** OAuth initiation — redirect spam guard. */
export const oauthInitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.OAUTH_INIT_RATE_MAX ?? 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please wait and try again." },
  keyGenerator: (req) => {
    const raw = (String(req.headers["x-forwarded-for"] ?? "")).split(",")[0]?.trim()
      || req.socket.remoteAddress
      || "unknown";
    return raw === "unknown" ? raw : ipKeyGenerator(raw);
  },
});
