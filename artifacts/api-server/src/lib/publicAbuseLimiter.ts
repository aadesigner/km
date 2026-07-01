import rateLimit from "express-rate-limit";
import { clientIpKey, shouldSkipPublicRateLimit } from "./trustedClient.js";

const windowMs = Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const max = Number(process.env.PUBLIC_RATE_LIMIT_MAX ?? 40);

/**
 * Strict rate limit for direct / untrusted API access (curl, scrapers, spoofed clients).
 * Requests from the kmcheck web app are skipped entirely.
 */
export const publicAbuseLimiter = rateLimit({
  windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 15 * 60 * 1000,
  max: Number.isFinite(max) && max > 0 ? max : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please use the website or try again later." },
  keyGenerator: clientIpKey,
  skip: (req) => shouldSkipPublicRateLimit(req) || req.isAdmin === true,
});
