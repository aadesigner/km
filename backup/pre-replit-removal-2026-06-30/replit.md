# kmcheck

VIN history lookup SaaS — users pay to instantly check mileage, accidents, and salvage records for any vehicle.

## Run & Operate

```bash
pnpm --filter @workspace/api-server run dev   # API server (port 8080)
pnpm --filter @workspace/kmcheck run dev      # frontend dev server
pnpm --filter @workspace/db run push          # push DB schema (dev only — after schema changes)
pnpm run typecheck                            # full typecheck across all packages
pnpm run typecheck:libs                       # rebuild lib declarations (run after any lib/* change)
pnpm --filter @workspace/api-spec run codegen # regenerate API hooks from OpenAPI spec
```

## Where things live

- `artifacts/api-server/src/routes/` — Express route handlers (auth, vin, payments, admin, user, countries)
- `artifacts/api-server/src/lib/` — auth (JWT/bcrypt), emailService, vinService, vinDecoder, logger
- `artifacts/kmcheck/src/` — React frontend (pages in `pages/`, auth context in `lib/auth-context.tsx`)
- `lib/db/src/schema/` — Drizzle ORM schema (source of truth for DB shape)
- `lib/api-spec/` — OpenAPI spec; run codegen after changes
- Admin panel: `/adminx` (not `/admin`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, esbuild bundle
- DB: PostgreSQL + Drizzle ORM
- Auth: Custom JWT HS256, httpOnly cookie `km_session`, bcrypt cost 12
- Payments: PayPal (admin-panel configurable)
- VIN data: Carstat API + NHTSA fallback

## Architecture decisions

- No third-party auth (Clerk/Auth0) — custom JWT to avoid vendor lock-in and keep cookie-based auth simple
- All sensitive config (PayPal, SMTP, reCAPTCHA, Carstat API key) lives in the DB (`system_settings` / `providers` tables), not env vars — lets admins reconfigure without redeploying
- `ADMIN_EMAIL` env var grants isAdmin at login time — switching admin doesn't require a DB query
- VIN results are cached in `vin_lookups` table — repeat lookups for the same VIN are served from cache, saving API credits

## User preferences

- README and docs: concise, no filler text
- Admin route obscured as `/adminx` to reduce automated scanning

## Gotchas

- **Always run `pnpm --filter @workspace/db run push` after any schema change** before starting the server
- **Run `pnpm run typecheck:libs` after editing anything in `lib/`** — the api-server reads compiled `.d.ts` files, not source; stale declarations cause type errors
- The `cp -r src/` command does NOT merge into existing subdirectories — always verify `routes/`, `lib/`, `middlewares/` individually after copying api-server source files
- `PORT` is injected by the host (Replit/Railway) — never hardcode it

## Pointers

- See `README.md` for Railway deploy instructions and first-run checklist
- See `.env.example` for all environment variables
- See the `pnpm-workspace` skill for workspace structure details
