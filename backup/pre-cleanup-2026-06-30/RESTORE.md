# Pre-cleanup backup (2026-06-30)

## What was removed

| Item | Notes |
|------|--------|
| `.local/` | Replit/pnpm cache — safe to delete locally; not in git |
| `artifacts/mockup-sandbox/` | Dev-only UI sandbox; not used in production build |
| `artifacts/kmcheck/src/assets/demo-cars/` | Duplicate of `public/demo-cars/` (unused in code) |
| `artifacts/kmcheck/dist/` | Rebuild with `pnpm --filter @workspace/kmcheck run build` |
| `artifacts/api-server/dist/` | Rebuild with `pnpm --filter @workspace/api-server run build` |
| npm deps | `stripe`, `@types/stripe`, `cors`, `@types/cors`, `http-proxy-middleware` (api-server); `react-icons` (kmcheck) |

## Restore deleted folders

From repo root:

```powershell
Copy-Item -Recurse backup\pre-cleanup-2026-06-30\copies\mockup-sandbox artifacts\mockup-sandbox
Copy-Item -Recurse backup\pre-cleanup-2026-06-30\copies\demo-cars artifacts\kmcheck\src\assets\demo-cars
```

## Restore package.json / lockfile

```powershell
Copy-Item backup\pre-cleanup-2026-06-30\manifests\package.json .
Copy-Item backup\pre-cleanup-2026-06-30\manifests\pnpm-lock.yaml .
Copy-Item backup\pre-cleanup-2026-06-30\manifests\pnpm-workspace.yaml .
Copy-Item backup\pre-cleanup-2026-06-30\manifests\api-server.package.json artifacts\api-server\package.json
Copy-Item backup\pre-cleanup-2026-06-30\manifests\kmcheck.package.json artifacts\kmcheck\package.json
pnpm install
```

## Size before cleanup

See `SIZE_BEFORE.txt` in this folder.
