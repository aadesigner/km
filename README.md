# kmcheck

VIN history lookup SaaS — instant mileage, accident, and salvage records for any vehicle.

## Stack

- **API** — Node.js 24, Express 5, TypeScript, esbuild
- **Frontend** — React 19, Vite, Tailwind CSS, wouter
- **Database** — PostgreSQL + Drizzle ORM
- **Auth** — Custom JWT (HS256), httpOnly cookie
- **Payments** — PayPal (admin-configurable)
- **VIN data** — Carstat API + NHTSA fallback
- **Monorepo** — pnpm workspaces

---

## Local development

> **Windows setup & Railway deploy:** [docs/RAILWAY-DEPLOY.md](docs/RAILWAY-DEPLOY.md) — start with **“Start here”** (local vs deploy paths).  
> **Database:** [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md)

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- [pnpm](https://pnpm.io/installation) — `npm install -g pnpm`
- PostgreSQL 14 or newer running locally

### 1 — Clone and install

```bash
git clone https://github.com/yourname/kmcheck.git
cd kmcheck
pnpm install
```

### 2 — Create your environment file

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgres://user:pass@localhost:5432/kmcheck` |
| `JWT_SECRET` | Long random string — see generator below |
| `ADMIN_EMAIL` | Your email — gets admin access on first login |

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 3 — Push the database schema

**Full guide:** [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md) (PostgreSQL install, Railway, troubleshooting).

Quick version — create the database, set `DATABASE_URL` in `.env`, then:

```bash
# Create the database first if it doesn't exist
createdb kmcheck

# Push all tables
pnpm run db:push
```

> `drizzle-kit push` may prompt interactively. Answer **n** (no truncate) if asked — existing rows are safe.

### 4 — Run the API server

**Windows (PowerShell)** — from `artifacts\api-server` (the `dev` script uses Unix `export` and fails on Windows):

```powershell
cd artifacts\api-server
pnpm run build
pnpm run start
```

API listens on **http://localhost:8080** by default. If port 8080 is busy (Apache/XAMPP), use `$env:PORT=8081; pnpm run start` and set `API_PORT=8081` when starting Vite (see deploy doc).

**macOS / Linux:**

```bash
pnpm --filter @workspace/api-server run dev
```

The API will be available at `http://localhost:8080` (or the port you set).

### 5 — Run the frontend

In a **second** terminal, from the **project root**:

```powershell
# Windows — project root
pnpm --filter @workspace/kmcheck run dev

# If API runs on 8081:
# $env:API_PORT=8081; pnpm --filter @workspace/kmcheck run dev
```

```bash
# macOS / Linux
pnpm --filter @workspace/kmcheck run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api/*` to `http://localhost:8080` (or `API_PORT`).

> See [docs/RAILWAY-DEPLOY.md](docs/RAILWAY-DEPLOY.md) for health checks, rebuild-after-code-change, and port conflict fixes.

### First login and admin setup

1. Open `http://localhost:5173/en/auth/sign-up` and register with the email you put in `ADMIN_EMAIL`.
2. Navigate to `http://localhost:5173/adminx` — you now have admin access.
3. In the admin panel, configure:
   - **Payments tab** — PayPal credentials, Google Sign-In, Facebook Sign-In
   - **Auth tab** — SMTP email settings
   - **VIN providers** — Carstat API key (or set `CARSTAT_API_KEY` env var to auto-seed on startup)

---

## Production build

Build the frontend into static files:

```bash
BASE_PATH=/ pnpm --filter @workspace/kmcheck run build
# Output: artifacts/kmcheck/dist/public/
```

Build the API:

```bash
pnpm --filter @workspace/api-server run build
# Output: artifacts/api-server/dist/index.mjs
```

Start the API in production:

```bash
NODE_ENV=production PORT=8080 node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Serve the frontend static files (e.g. nginx, Caddy, or any static host) and proxy `/api/*` to the API.

### nginx example

```nginx
server {
    listen 80;
    server_name kmcheck.com;

    root /var/www/kmcheck/dist/public;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback — prerendered /{lang}/…/index.html files are served first
    location / {
        try_files $uri $uri/index.html /index.html;
    }
}
```

---

## Railway deployment

**Full step-by-step guide:** [docs/RAILWAY-DEPLOY.md](docs/RAILWAY-DEPLOY.md) — local Windows setup, where to run commands, GitHub Desktop, Railway, `kmcheck.com` DNS, env vars, port conflicts, and troubleshooting.

**Database (Postgres + tables):** [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md)

Quick summary: push code with **GitHub Desktop**, one Railway service builds frontend + API (`pnpm run build:railway`), serves both on `$PORT`, Postgres via `DATABASE_URL`, custom domain `kmcheck.com`.

---

## Schema changes

After editing any file in `lib/db/src/schema/`:

```bash
# Push schema to database (reads DATABASE_URL from .env)
pnpm run db:push
```

For Railway, see [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md) (`pnpm run db:push:prod`).

---

## OAuth setup

### Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID (Web application).
2. Add **Authorized redirect URI**: `https://your-domain.com/api/auth/google/callback`
3. Enter the **Client ID** and **Client Secret** in the admin panel → Payments tab → Google Sign-In card.

### Facebook Sign-In

1. Go to [Facebook Developer Portal](https://developers.facebook.com/apps/) → Create App → Add Facebook Login.
2. Under Facebook Login → Settings, add **Valid OAuth Redirect URI**: `https://your-domain.com/api/auth/facebook/callback`
3. Enter the **App ID** and **App Secret** in the admin panel → Payments tab → Facebook Sign-In card.

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Signs JWT session tokens |
| `ADMIN_EMAIL` | ✅ | — | Email that receives admin access on login |
| `PORT` | — | `8080` | API server port |
| `NODE_ENV` | — | `development` | Set to `production` in prod |
| `CORS_ORIGIN` | — | `http://localhost:3000,http://localhost:5173` | Allowed frontend origins (comma-separated) |
| `CARSTAT_API_KEY` | — | — | Seeds Carstat VIN provider on first start |
| `PAYPAL_CLIENT_ID` | — | — | Bootstrap PayPal (can also set via admin panel) |
| `PAYPAL_CLIENT_SECRET` | — | — | Bootstrap PayPal (can also set via admin panel) |
| `SITE_URL` | — | `https://kmcheck.com` | Used in password-reset emails |
| `LOG_LEVEL` | — | `info` | Pino log level (`trace` `debug` `info` `warn` `error`) |
| `PG_POOL_MAX` | — | `20` | PostgreSQL connection pool size |
| `SMTP_INSECURE` | — | `false` | Skip TLS cert check for SMTP (never use in prod) |

Frontend dev only (not needed in production):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5173` | Vite dev server port |
| `API_PORT` | `8080` | Port the Vite dev proxy forwards `/api` calls to |

---

## Useful commands

```bash
# Full typecheck
pnpm run typecheck

# Rebuild lib declarations (run after any change in lib/)
pnpm run typecheck:libs

# Regenerate API client hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Run API tests
pnpm --filter @workspace/api-server run test
```

---

## Admin panel

The admin panel is at `/adminx` (not `/admin`). The non-obvious path reduces automated scanning.

All sensitive credentials (PayPal, SMTP, reCAPTCHA, Carstat, Google/Facebook OAuth) are stored in the `system_settings` database table — not in env vars. This lets you reconfigure without redeploying.
