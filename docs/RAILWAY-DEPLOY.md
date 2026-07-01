# Kmcheck — local dev & Railway deploy

One guide for running the app on your PC and putting it live on [Railway](https://railway.com).

**Other docs:** [DATABASE-SETUP.md](./DATABASE-SETUP.md) (PostgreSQL) · [README.md](../README.md) (stack & env reference)

---

## Start here

| I want to… | Go to |
|------------|--------|
| Run the site on my Windows PC | [Local development](#local-development) |
| Deploy to Railway / kmcheck.com | [Railway deployment](#railway-deployment) |
| Fix something broken | [Troubleshooting](#troubleshooting) |

### Three places you will work

| Place | Used for |
|-------|----------|
| **PowerShell** (Cursor terminal) | Install, build, `db push`, local servers |
| **GitHub Desktop** | Commit & push code (no secrets) |
| **Railway website** | Production secrets, deploy logs, Postgres |

### One folder for almost every command

```
C:\Users\Pc\Desktop\Kmcheck-Setup
```

That folder has `package.json`, `artifacts/`, and `.env`. Open **Terminal → New Terminal** in Cursor — it starts here.

**Secrets:** `.env` on your PC · **Variables** tab on Railway · never in GitHub.

---

## Local development

### What runs where

| What | Terminal | URL |
|------|----------|-----|
| API (Node) | Terminal 1 | `http://localhost:8080` (or `8081`) |
| Website (Vite) | Terminal 2 | **http://localhost:5173** ← open this in the browser |

Vite proxies `/api/*` to the API. You do **not** browse to port 8080 for the UI.

### Step 1 — One-time setup

**Folder:** project root

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup
pnpm install
Copy-Item .env.example .env
notepad .env
```

In `.env`, set at minimum:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/kmcheck
JWT_SECRET=<random string>
ADMIN_EMAIL=your@email.com
```

Generate `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Create tables:

```powershell
pnpm run db:push
```

If asked to truncate tables → answer **No**.

> PostgreSQL not installed? See [DATABASE-SETUP.md](./DATABASE-SETUP.md).

### Step 2 — Start API (Terminal 1)

> On Windows, do **not** use `pnpm run dev` in `api-server` — it fails. Use **build + start**.

**Folder:** `artifacts\api-server`

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup\artifacts\api-server
pnpm run build
pnpm run start
```

Wait for `Server listening` on port **8080**.

**Port 8080 busy?** (common with XAMPP/Apache) use **8081** instead:

```powershell
$env:PORT=8081; pnpm run start
```

### Step 3 — Start frontend (Terminal 2)

**Folder:** project root

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup
pnpm --filter @workspace/kmcheck run dev
```

If API is on **8081**, you must match:

```powershell
$env:API_PORT=8081; pnpm --filter @workspace/kmcheck run dev
```

Open **http://localhost:5173**

### Step 4 — Quick check

```powershell
Invoke-WebRequest http://localhost:5173/api/healthz -UseBasicParsing
```

Should return `{"status":"ok"}`.

### Step 5 — First login

1. Sign up at `http://localhost:5173/en/sign-up` with your `ADMIN_EMAIL`
2. Admin panel: `http://localhost:5173/adminx`

### After you change API code

Rebuild Terminal 1 — API does not hot-reload:

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup\artifacts\api-server
pnpm run build
pnpm run start
```

---

## Railway deployment

Follow these steps **in order**. You can test locally first (above), but you don't have to.

### How production works (one picture)

```
https://kmcheck.com
        │
        ▼
   Railway (HTTPS)
        │
        ▼
   One Node process (PORT set by Railway)
     • /api/*  → Express API
     • /*      → React static files
        │
        ▼
   PostgreSQL (DATABASE_URL)
```

Locally you run **two** processes (API + Vite). On Railway it's **one** process that serves both.

---

### Railway step 1 — Push code to GitHub

Use [GitHub Desktop](https://desktop.github.com/):

1. **File → Add local repository** → `C:\Users\Pc\Desktop\Kmcheck-Setup`
2. Commit changes → **Push origin**

Create the repo at [github.com/new](https://github.com/new) if needed (private recommended).

Do **not** commit `.env` — it's gitignored.

---

### Railway step 2 — Create Railway project

1. [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**
2. Pick your repo
3. **+ New → Database → PostgreSQL**

---

### Railway step 3 — Connect database to app

1. Open the **app** service (not Postgres)
2. **Variables → + New Variable → Add reference** → select Postgres → `DATABASE_URL`

---

### Railway step 4 — Build & start commands

On the **app** service → **Settings**:

| Setting | Value |
|---------|--------|
| Root Directory | *(leave empty)* |
| Build Command | `node scripts/railway-build.mjs` |
| Start Command | `node --import ./artifacts/api-server/load-env.mjs --enable-source-maps ./artifacts/api-server/dist/index.mjs` |
| Healthcheck Path | `/api/healthz` |

These are also in `railway.toml`. **Do not set `PORT`** — Railway sets it automatically.

---

### Railway step 5 — Environment variables

On the **app** service → **Variables** tab.

**Required** (set all of these before first deploy):

| Variable | What to put |
|----------|-------------|
| `DATABASE_URL` | Reference from Postgres (step 3) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Long random string |
| `ADMIN_EMAIL` | Your email |
| `CLIENT_GUARD_TOKEN` | Long random string |
| `VITE_CLIENT_GUARD_TOKEN` | **Same value** as `CLIENT_GUARD_TOKEN` |
| `SITE_URL` | `https://kmcheck.com` (or your `*.up.railway.app` URL while testing) |
| `CORS_ORIGIN` | `https://kmcheck.com,https://www.kmcheck.com` |

Generate secrets in PowerShell (project root):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

First output → `JWT_SECRET`. Second → `CLIENT_GUARD_TOKEN` **and** `VITE_CLIENT_GUARD_TOKEN` (identical).

**Optional:** `LOG_LEVEL=info`, `PG_POOL_MAX=20`, `CARSTAT_API_KEY` (or set in admin later).

> `VITE_*` vars are baked in at **build** time. If you change `VITE_CLIENT_GUARD_TOKEN`, trigger a **redeploy**.

---

### Railway step 6 — Create database tables

Run **once** from your PC (project root), using Railway's public Postgres URL:

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup

$env:DATABASE_URL = "postgresql://USER:PASS@HOST:PORT/railway?sslmode=require"
pnpm run db:push:prod
```

Copy the URL from Railway → Postgres service → **Connect**. Add `?sslmode=require` if it's missing.

Run again after any schema change in `lib/db/`.

Details: [DATABASE-SETUP.md](./DATABASE-SETUP.md)

---

### Railway step 7 — Custom domain (kmcheck.com)

1. App service → **Settings → Networking → Custom Domain** → add `kmcheck.com` and `www.kmcheck.com`
2. Add the **CNAME** records at your domain registrar (Railway shows what to add)
3. Update Variables: `SITE_URL` and `CORS_ORIGIN` to `https://kmcheck.com`

---

### Railway step 8 — Deploy & verify

1. Push to `main` (GitHub Desktop)
2. Railway → **Deployments** → wait for build + deploy logs → `Server listening`
3. Test:

| URL | Expected |
|-----|----------|
| `https://yoursite.com/api/healthz` | `{"status":"ok"}` |
| `https://yoursite.com/en` | Homepage |
| `https://yoursite.com/adminx` | Admin (after signup with `ADMIN_EMAIL`) |

Configure PayPal, SMTP, Carstat in **Admin** after first login.

### OAuth callbacks (when you enable social login)

| Provider | Redirect URI |
|----------|----------------|
| Google | `https://kmcheck.com/api/auth/google/callback` |
| Facebook | `https://kmcheck.com/api/auth/facebook/callback` |

---

## Troubleshooting

### Local

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` on 8080 | Apache/XAMPP owns 8080. Use API on **8081** + `$env:API_PORT=8081` on Vite (see [Local step 2–3](#step-2--start-api-terminal-1)) |
| `export` not recognized | Don't use `pnpm run dev` in api-server. Use `build` + `start` |
| `/api/healthz` returns 404 | API not running, or wrong port. Check Terminal 1 shows `Server listening` |
| API changes don't apply | Run `pnpm run build` again in `artifacts\api-server` |
| Login/API errors on 5173 | API terminal closed? `API_PORT` mismatch? Test `localhost:5173/api/healthz` |
| Database errors | Check `.env` `DATABASE_URL`, Postgres running, `pnpm run db:push` done |

**Who uses port 8080?**

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Get-Process -Id $_.OwningProcess | Select-Object Id, ProcessName }
```

### Railway

| Problem | Fix |
|---------|-----|
| Build: `CLIENT_GUARD_TOKEN required` | Set `CLIENT_GUARD_TOKEN` + `VITE_CLIENT_GUARD_TOKEN` (same value), redeploy |
| `503` on `/api/healthz` | Run `db:push:prod` with Railway `DATABASE_URL`; link Postgres reference |
| API returns 403 | Runtime `CLIENT_GUARD_TOKEN` must match build-time `VITE_CLIENT_GUARD_TOKEN` — redeploy |
| CORS errors | `CORS_ORIGIN` must match exact site URL (`https://`, no typo) |
| Blank page on refresh | Check build logs for errors; `artifacts/kmcheck/dist/public` must exist |

**Logs:** Railway → service → **Deployments** → latest → **View logs**

---

## Command cheat sheet

```powershell
# ── Project root ─────────────────────────────────
cd C:\Users\Pc\Desktop\Kmcheck-Setup

# One-time
pnpm install
pnpm run db:push

# Frontend (Terminal 2)
pnpm --filter @workspace/kmcheck run dev
$env:API_PORT=8081; pnpm --filter @workspace/kmcheck run dev   # if API on 8081

# ── API folder (Terminal 1) ────────────────────
cd artifacts\api-server
pnpm run build
pnpm run start
$env:PORT=8081; pnpm run start

# Health
Invoke-WebRequest http://localhost:5173/api/healthz -UseBasicParsing

# Railway DB schema
$env:DATABASE_URL = "postgresql://...?sslmode=require"
pnpm run db:push:prod
```

---

## Checklists

### Local ✓

- [ ] `pnpm install` + `.env` + `pnpm run db:push`
- [ ] API running (`build` + `start`) on 8080 or 8081
- [ ] Vite on 5173 (`API_PORT` matches if not 8080)
- [ ] `localhost:5173/api/healthz` → ok
- [ ] Sign up with `ADMIN_EMAIL` → `/adminx`

### Railway ✓

- [ ] Code on GitHub
- [ ] Railway app + Postgres, `DATABASE_URL` referenced
- [ ] All required Variables set
- [ ] `pnpm run db:push:prod`
- [ ] Deploy green, `/api/healthz` ok
- [ ] Domain + DNS (if using kmcheck.com)
- [ ] Admin configured (PayPal, SMTP, etc.)
