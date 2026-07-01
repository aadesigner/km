---
name: kmcheck migration
description: Steps and gotchas for copying the kmcheck GitHub repo into this Replit workspace
---

## Sequence that worked

1. `git clone https://github.com/aadesigner/kmcheck.git /tmp/kmcheck`
2. Copy root config: `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`
3. Copy lib files (use top-level `src/`, NOT `src/src/` — the repo has a duplicate directory from a prior failed copy):
   - `lib/api-spec/openapi.yaml`, `orval.config.ts`, `package.json`
   - `lib/api-client-react/src/custom-fetch.ts`, `src/index.ts`, `src/generated/api.ts`, `src/generated/api.schemas.ts`, `package.json`, `tsconfig.json`
   - `lib/api-zod/src/generated/api.ts`, `src/index.ts`, `package.json`, `tsconfig.json`
   - `lib/db/src/schema/*.ts` (all 12 files), `src/index.ts`, `package.json`, `tsconfig.json`, `drizzle.config.ts`
4. Call `createArtifact({ artifactType: "react-vite", slug: "kmcheck", previewPath: "/", title: "kmcheck" })`
5. Copy frontend: `artifacts/kmcheck/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `components.json`, then `cp -r src/pages src/components src/lib src/hooks src/i18n src/data` and individual `App.tsx`, `main.tsx`, `index.css`
6. Copy api-server: `src/app.ts`, `src/index.ts`, `src/routes/*.ts`, `src/lib/*.ts`, `src/middlewares/*.ts`, `package.json`, `tsconfig.json`, `build.mjs`, `vitest.config.ts`
7. `pnpm install`
8. `pnpm --filter @workspace/api-spec run codegen`
9. Generate JWT_SECRET via `crypto.randomBytes(48).toString('base64url')` and `setEnvVars`
10. `pnpm --filter @workspace/db run push` — DATABASE_URL already provisioned by Replit
11. Request ADMIN_EMAIL from user via `requestEnvVar`
12. Restart both workflows

**Why:** The repo contains `src/src/` duplicate directories in api-server, lib/api-client-react, lib/api-zod, and lib/db — artifacts of a previous failed copy. Always use the top-level `src/` files.

**How to apply:** When integrating this repo again (e.g. after a rollback), follow this exact sequence and skip `src/src/` directories entirely.
