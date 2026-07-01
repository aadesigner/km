# Kmcheck — Security, Performance & QA Suggestions

Consolidated audit of the web app (`artifacts/kmcheck`), API server (`artifacts/api-server`), client area, and admin panel.  
Generated from codebase review — use as a remediation backlog.

---

## What’s Already Solid

| Area | Notes |
|------|--------|
| **HTTP hardening** | Helmet, strict CORS, `httpOnly` + `SameSite=strict` cookies |
| **Admin API** | All `/api/admin/*` routes use `requireAdmin` |
| **Secrets** | Settings GET strips PayPal/SMTP keys; provider `apiKey` stripped |
| **Frontend architecture** | Lazy routes, code splitting, prefetch, scoped error boundaries on key flows |
| **VIN normalization** | Good unit test coverage for Carstat/Korea/free decode |
| **Free coupon flow** | Atomic `consumeCouponUse` at payment time |
| **External calls** | Most Carstat/PayPal fetches use timeouts (8–15s) |

---

## 1. Web App (Public + Authenticated)

### Critical bugs (user-facing)

| # | Issue | Impact |
|---|--------|--------|
| **W1** | ~~OAuth errors redirect to `/en/auth/sign-in` but SPA only has `/:lang/sign-in`~~ **Fixed** — OAuth redirects use `/:lang/sign-in`; lang passed via `?lang=` + cookie | Failed Google/Facebook login → **404**, no error message |
| **W2** | ~~Post-payment VIN failure clears `pending_vin` with no retry~~ **Fixed** — VIN kept in session; retry button on processing page | Paid user can lose context; support nightmare |
| **W3** | ~~Banned users stay “signed in” in UI (`isBanned` never checked)~~ **Fixed** — `/auth/me` + `requireAuth` revoke banned sessions; UI redirects to sign-in with suspension message | Banned users browse dashboard until checkout 403 |

### High

| # | Issue | Impact |
|---|--------|--------|
| **W4** | ~~Dashboard/purchases ignore React Query errors~~ **Fixed** — error UI with retry | 401/500 → **empty state** (“no reports”) instead of error |
| **W5** | ~~`refreshUser()` treats network blip as logged-out~~ **Fixed** — only 401/403 clear session; network errors keep user | Brief outage → false logout + redirect |
| **W6** | ~~VIN public/result pages label all errors as “not found”~~ **Fixed** — distinct messages for 404/403/401/5xx + SEO on errors | Wrong copy; bad SEO on 500 |
| **W7** | ~~Purchases summary stats computed from current page only~~ **Fixed** — global totals from `/user/stats` | Wrong “total spent” / “completed” when paginated |
| **W8** | No `AUTH_RETURN_PATH_KEY` written on session expiry | After re-login, user doesn’t return to purchases etc. |
| **W9** | Checkout shows blank screen while auth loads | White flash before redirect |

### Medium

- ~~Mobile client nav omits **Purchases** (desktop has it)~~ **Fixed**
- ~~Guest VIN funnel inconsistent: home → sign-up, pricing → sign-in~~ **Fixed** — unified `redirectGuestForVinCheckout` → sign-in
- ~~Free decoder title highlight breaks non-English word order~~ **Fixed** — `free_decoder_title_lead` / `free_decoder_title_highlight` i18n keys
- ~~`VinNumericRedirect` failure sends guests to dashboard~~ **Fixed** — guests → homepage; signed-in → dashboard
- ~~Partial error boundary coverage (admin, auth, home, purchases unwrapped)~~ **Fixed** — `RouteErrorBoundary` on auth, admin, home, purchases, free-decoder

---

## 2. Client Area

**Layout:** Desktop top nav is fine; mobile bottom nav missing Purchases.

**Auth guards:** Pattern is consistent (`isLoaded` → redirect), but:

- No banned-user screen
- No query error UI
- Dashboard history capped at 50 with no pagination
- Delete failed lookup has no error toast

**Warm cache:** ~~Prefetches 50 full report JSON blobs~~ **Fixed** — prefetches summary history (`?view=summary`); full reports load on link hover only.

---

## 3. API Exposure, Security & Limits

### Critical (production / abuse)

| # | Issue | Risk |
|---|--------|------|
| **A1** | ~~`CLIENT_GUARD_TOKEN` not required at startup in production~~ **Fixed** — `assertProductionConfig()` fails startup when missing | API open to direct scraping; rate limits skipped for “trusted” bypass |
| **A2** | Admin can PATCH user email to `ADMIN_EMAIL` → victim becomes admin on next `/auth/me` | **Privilege escalation** |
| **A3** | ~~First registrant with `ADMIN_EMAIL` wins admin if env email is predictable~~ **Fixed** — admin only on empty DB bootstrap via `shouldBootstrapAdmin` | Bootstrap takeover |
| **A4** | ~~`GET /vin/public/resolve-id/:id` unauthenticated~~ **Fixed** — endpoint removed; legacy URLs use auth’d `GET /vin/resolve/:id` | Sequential ID scan → **VIN harvest** |
| **A5** | ~~Paid coupon race: validate at order create, non-atomic consume at capture~~ **Fixed** — atomic reserve at PayPal order create; capture no longer increments | Double-use / over `maxUses` |
| **A6** | ~~Ban/unban admin responses return raw user row including `passwordHash`~~ **Fixed** — responses use `toAdminUser()` | Secret leak to admin UI/logs |

### High

| # | Issue | Risk |
|---|--------|------|
| **A7** | `requireAuth` doesn’t check `isBanned` | Banned session still calls peek, coupons, history |
| **A8** | `GET /vin/peek/:vin` hits provider with no dedicated rate limit | **Token burn / cost DoS** for logged-in users |
| **A9** | `create-paypal-order` / `capture` lack rate limits; each create calls `local-exists` | Provider cost + PayPal spam |
| **A10** | Share tokens default to **5 years**; no revocation | Leaked `?s=` = long-lived full report |
| **A11** | PayPal capture doesn’t verify captured amount vs order | Defense-in-depth gap |
| **A12** | `POST /vin/lookup` not idempotent on retry | Duplicate provider fetches until failure |

### Medium

- `uncaughtException` / `unhandledRejection` log but **don’t exit** → corrupted in-memory state
- In-memory rate limits don’t scale horizontally; `FREE_DECODE_IP_MAP` grows per IP/day
- reCAPTCHA fail-open on free decoder network errors (auth is fail-closed)
- Image proxy fetches any URL in signed token — SSRF if bad catalog data
- Minimal Zod validation outside health check — manual `typeof` checks everywhere
- OAuth initiation endpoints unrated

**Key files:** `artifacts/api-server/src/app.ts`, `src/index.ts`, `src/lib/auth.ts`, `src/lib/clientGuard.ts`, `src/lib/trustedClient.ts`, `src/routes/vin.ts`, `src/routes/payments.ts`, `src/routes/admin.ts`

---

## 4. Admin Panel — Limits & Security

**Frontend:** `/adminx/*` is UX-only (`isAdmin` check). Real boundary is API — correctly enforced.

### High

| # | Issue | Risk |
|---|--------|------|
| **M1** | ~~Provider `baseUrl` unconstrained~~ **Fixed** — HTTPS + blocked private/metadata hosts | **SSRF** to internal/metadata URLs |
| **M3** | ~~`bulk-delete` catalog `all: true` with no confirmation token~~ **Fixed** — requires `confirmPhrase: DELETE ALL CATALOG` | Entire cache wiped |
| **M4** | ~~`DELETE /admin/transactions/:id` hard-deletes payments~~ **Fixed** — soft-void (`status: voided`) | Audit/revenue trail loss |
| **M5** | ~~Grant/refresh VIN uncapped provider fetches~~ **Fixed** — 20 provider actions/hour per admin | Token spend by admin action |

### Medium

- ~~`PATCH /admin/settings` — only `krwPerUsd` bounded~~ **Fixed** — bounded validation on rate/lockout/session fields
- ~~`PUT /admin/security/settings` — `maxFailedLogins: 0`~~ **Fixed** — min 1 enforced server-side
- ~~`DELETE /admin/security/lockouts` resets all brute-force counters~~ **Fixed** — requires `confirmPhrase: CLEAR ALL LOCKOUTS`
- ~~Announcement `linkUrl` no scheme allowlist~~ **Fixed** — http/https only
- ~~Catalog PATCH by VIN propagates to all user lookups~~ **Fixed** — opt-in `propagateToLookups: true`
- ~~User import up to 5,000 accounts~~ **Fixed** — 500-row cap + 5 imports/hour
- ~~200 MB catalog upload limit~~ **Fixed** — 50 MB cap
- Admin can PATCH another admin’s password

**Key files:** `artifacts/api-server/src/routes/admin.ts`, `artifacts/kmcheck/src/pages/admin/layout.tsx`

---

## 5. Performance

### P0 — Can cause outage under load

| Issue | Where |
|-------|--------|
| Sync `POST /vin/lookup` blocks worker up to ~15s Carstat call | `routes/vin.ts`, `vinService.ts` |
| Catalog import → unbounded parallel `UPDATE` per lookup row | `routes/admin.ts` |
| VIN image disk cache: **no size cap / TTL** | `vinImageCache.ts` |
| Process continues after fatal uncaught errors | `api-server/src/index.ts` |

### P1 — Serious degradation

| Issue | Where |
|-------|--------|
| `getCachedVin` runs `JSON.stringify` on full report every read | `vinService.ts` |
| ~~`/user/history` returns 50 **full** report JSON blobs~~ **Fixed** — `?view=summary` strips payload for list/warm-cache | `routes/user.ts` + `warm-cache.tsx` |
| Admin exports up to 50k rows into memory | `routes/admin.ts` |
| Admin stats full-table scans on `vin_lookups` | `routes/admin.ts` |
| Migrations run after `listen()` — traffic before schema ready | `index.ts` |
| Maintenance mode API-only — SPA shows broken empty UI | `maintenanceMiddleware.ts` |

### P2 — UX / cost

- `framer-motion` heavy on home (~45) and vin-result; unbounded accidents list
- i18n: `en.json` eager-loaded; idle preload of all locales (~5k keys retained)
- Image proxy: full body in memory, no max bytes
- Pre-payment `local-exists` on every PayPal order create
- Admin reCAPTCHA test fetch has no timeout

---

## 6. Future Crashes & Failure Modes

| Scenario | What happens |
|----------|----------------|
| **Promotion traffic spike** | Sync lookups pile up → 502s; payments captured, clients timeout |
| **Popular VIN catalog import** | Thousands of parallel DB updates → pool exhaustion |
| **Disk fills (image cache)** | Image proxy writes fail → broken report photos |
| **Fatal async bug** | Process keeps serving with bad in-memory rate-limit/cache state |
| **Provider outage + free decoder** | reCAPTCHA fail-open → more abuse |
| **Render error on home/checkout** | No route boundary → possible white screen |
| **Network blip on page load** | `/auth/me` fails → user kicked to sign-in |
| **Paid lookup retry** | Extra Carstat charges until payment marked failed |
| **Admin sets lockout max to 0** | Nobody can log in |

---

## 7. Prioritized Action List

### P0 — Do first (security + outage risk)

1. ~~**Require `CLIENT_GUARD_TOKEN` in production** (fail startup if missing)~~ ✅ Done
2. **Block email PATCH to `ADMIN_EMAIL`**; separate audited admin promotion flow
3. ~~**Fix admin ban/unban** to strip `passwordHash` from responses~~ ✅ Done
4. ~~**Atomic paid coupon** reserve/consume at order create + capture with `maxUses` check~~ ✅ Done
5. **Check `isBanned` in `requireAuth`** (and optionally revoke sessions on ban)
6. ~~**Protect or remove** `GET /vin/public/resolve-id/:id` (auth, HMAC, or aggressive rate limit)~~ ✅ Done
7. **Exit process on `uncaughtException`** after log (or use graceful restart)
8. **Async VIN fulfillment** after payment (queue/job) — stop blocking HTTP worker on Carstat
9. **Cap/batch catalog→lookup propagation** (no unbounded `Promise.all`)
10. **VIN image cache** — max disk size + LRU/TTL eviction

### P1 — Next sprint (money, trust, scale)

11. ~~**Fix OAuth error redirect** → `/:lang/sign-in?error=...`~~ ✅ Done
12. ~~**Post-payment failure UX** — keep VIN, retry path, support reference~~ ✅ Done
13. ~~**Banned user handling** in frontend + force logout on ban~~ ✅ Done
14. ~~**Dashboard/purchases error states** — don’t show empty on API failure~~ ✅ Done
15. **Rate-limit** `create-paypal-order`, `capture`, `GET /vin/peek`
16. **Slim `/user/history`** — metadata only; full report on drill-down
17. **Provider `baseUrl` allowlist** — block private IPs / metadata
18. **Confirmation tokens** for bulk-delete, transaction delete, full catalog wipe
19. **Integration tests** for PayPal capture → lookup → failure rollback
20. **Validate security settings PATCH** — min 1 for lockout thresholds, sane caps
21. **Share token** shorter TTL + optional revocation
22. **Maintenance mode** surfaced in SPA (banner or dedicated page)

### P2 — Important polish (UX, cost, hygiene)

23. Mobile nav: add **Purchases**
24. Preserve **return path** on session expiry
25. VIN public/result: distinguish 404 vs 500 vs auth errors
26. ~~Fix purchases **summary stats** to use API totals~~ ✅ Done
27. Remove `JSON.stringify` stale-blob check in `getCachedVin` (use DB flag)
28. Announcement `linkUrl` — `https:` only or relative site paths
29. Image proxy — max body size + CDN host allowlist
30. Reduce `framer-motion` on home/vin-result; cap accidents list like other sections
31. Lazy-load `en.json` like other locales
32. Zod (or shared schemas) on auth, payments, admin writes
33. Redis-backed rate limits for multi-instance deploys

### P3 — Backlog

34. MFA / step-up for destructive admin actions
35. Error boundaries on auth, home, purchases, admin
36. Dashboard history pagination beyond 50
37. OAuth initiation rate limits
38. Frontend tests for checkout/VIN flows
39. PayPal amount verification at capture
40. Session invalidation on password change / ban (all devices)

---

## 8. Manual QA Matrix

1. OAuth Google failure → lands on correct sign-in page with translated error
2. Ban user mid-session → blocked everywhere, clear message
3. Pay → processing fails → VIN preserved, retry works
4. `/user/history` 500 → error UI, not “no reports”
5. Mobile signed-in → Purchases discoverable
6. Free decoder in `ar`/`sq` → title renders correctly
7. Direct API without `X-Kmcheck-Client` in prod → blocked or rate-limited
8. Two PayPal orders with same coupon → only one succeeds
9. Admin provider test → confirm token cost is visible and limited
10. Catalog import for high-traffic VIN → no timeout/OOM

---

## Summary

The stack has a **good security baseline** (Helmet, CORS, layered limits, admin gating, secret sanitization). The biggest gaps are **deployment config** (`CLIENT_GUARD_TOKEN`), **admin privilege escalation via email**, **payment/coupon races**, **provider cost abuse** (peek/checkout), and **sync VIN delivery under load**. On the frontend, **OAuth redirect**, **post-payment failure**, and **silent API errors in the client area** are the highest-impact user bugs.

**Recommended fix order:** 1 → 2 → 4 → 8 → 11 → 12 → 13
