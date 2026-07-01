# Replit config backup (2026-06-30)

Removed from the active repo — **not used** for local Windows dev or Railway deploy.

## What was removed

| Item | Purpose (Replit only) |
|------|------------------------|
| `.replit` | Replit project config, ports, workflows |
| `.replitignore` | Replit deploy image exclusions |
| `replit.md` | Replit-oriented dev notes |
| `scripts/post-merge.sh` | Replit post-merge hook (`pnpm install` + db push) |
| `artifacts/kmcheck/.replit-artifact/` | Replit web artifact manifest |
| `artifacts/api-server/.replit-artifact/` | Replit API artifact manifest |
| `.agents/memory/` | Replit workspace migration notes for agents |

**Warning:** The backed-up `.replit` may contain old `JWT_SECRET` / `ADMIN_EMAIL` values. Do not commit restored secrets to GitHub.

## Restore (only if you use Replit again)

From repo root:

```powershell
Copy-Item backup\pre-replit-removal-2026-06-30\.replit .
Copy-Item backup\pre-replit-removal-2026-06-30\.replitignore .
Copy-Item backup\pre-replit-removal-2026-06-30\replit.md .
Copy-Item backup\pre-replit-removal-2026-06-30\scripts\post-merge.sh scripts\
New-Item -ItemType Directory -Force -Path artifacts\kmcheck\.replit-artifact, artifacts\api-server\.replit-artifact | Out-Null
Copy-Item backup\pre-replit-removal-2026-06-30\artifacts\kmcheck\.replit-artifact\artifact.toml artifacts\kmcheck\.replit-artifact\
Copy-Item backup\pre-replit-removal-2026-06-30\artifacts\api-server\.replit-artifact\artifact.toml artifacts\api-server\.replit-artifact\
New-Item -ItemType Directory -Force -Path .agents\memory | Out-Null
Copy-Item backup\pre-replit-removal-2026-06-30\.agents\memory\* .agents\memory\
```

For Kmcheck on **Windows + Railway**, you do **not** need to restore any of this.
