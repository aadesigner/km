# Database setup — simple guide

Kmcheck stores users, payments, VIN reports, and settings in **PostgreSQL**. You only need to do this **once** when setting up the project (and again after you change database tables in code).

---

## What you need

| Thing | What it is |
|-------|------------|
| **PostgreSQL** | The database program (like a folder of spreadsheets for the app) |
| **DATABASE_URL** | One connection string in `.env` that tells the app how to connect |
| **db push** | A command that creates/updates tables from the code |

---

## Part A — Local computer (development)

### Step 1 — Install PostgreSQL

1. Download **PostgreSQL** for Windows from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer — remember the **password** you set for user `postgres`
3. Keep the default port **5432**

> Already have Postgres? Skip to Step 2.

### Step 2 — Create the `kmcheck` database

Open **pgAdmin** (installed with PostgreSQL) or any SQL tool and run:

```sql
CREATE DATABASE kmcheck;
```

Or from a terminal (if `psql` is on your PATH):

```powershell
psql -U postgres -c "CREATE DATABASE kmcheck;"
```

### Step 3 — Put the connection string in `.env`

In the project folder, copy the example file if you have not already:

- Copy `.env.example` → `.env`

Edit `.env` and set `DATABASE_URL` (change the password to yours):

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/kmcheck
```

Also set these (required):

```
JWT_SECRET=any-long-random-string
ADMIN_EMAIL=your@email.com
```

Generate a random `JWT_SECRET` once in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Step 4 — Create the tables (`db push`)

Open PowerShell in the project folder (`Kmcheck-Setup`) and run:

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup
pnpm run db:push
```

You should see something like **“Changes applied”** at the end.

**If it asks to truncate tables**, answer **No** — you do not want to delete existing data.

### Step 5 — Check it works

Start the API (see main README). Then open:

[http://localhost:8080/api/healthz](http://localhost:8080/api/healthz)

You should see: `{"status":"ok"}`

If you see an error about the database, double-check `DATABASE_URL` in `.env` and that PostgreSQL is running.

---

## Part B — Railway (production / online)

### Step 1 — Add PostgreSQL on Railway

1. Open your project on [railway.com](https://railway.com)
2. Click **+ New** → **Database** → **PostgreSQL**
3. Railway creates a database for you automatically

### Step 2 — Connect the database to your app

1. Click your **app** service (not the database)
2. Go to **Variables**
3. Click **+ New Variable** → **Add reference**
4. Choose the Postgres service → variable **`DATABASE_URL`**

Now the live app can talk to the database.

### Step 3 — Push tables to Railway (from your PC)

You run this **once** before first use, and again when database tables change in code.

1. In Railway, open the **PostgreSQL** service
2. Click **Connect** → copy the **public** connection URL  
   (it looks like `postgresql://postgres:...@...railway.app:5432/railway`)
3. If the URL does not end with `?sslmode=require`, add it:

```
postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require
```

4. In PowerShell on your PC:

```powershell
cd C:\Users\Pc\Desktop\Kmcheck-Setup

$env:DATABASE_URL = "postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require"
pnpm run db:push:prod
```

Wait for **“Changes applied”**.

5. Redeploy or refresh your site — `/api/healthz` should return `{"status":"ok"}`

> **Tip:** You never paste `DATABASE_URL` into GitHub. Only in `.env` (local) or Railway Variables (online).

---

## When do I run `db push` again?

Run it when someone changes files in `lib/db/src/schema/` (new columns, new tables).

| Where | Command |
|-------|---------|
| Local `.env` database | `pnpm run db:push` |
| Railway database | `pnpm run db:push:prod` (with Railway `DATABASE_URL` in the command) |

---

## Quick troubleshooting

| Problem | What to try |
|---------|-------------|
| `connection refused` | PostgreSQL not running — start it in Windows Services or pgAdmin |
| `password authentication failed` | Wrong password in `DATABASE_URL` |
| `database "kmcheck" does not exist` | Run `CREATE DATABASE kmcheck;` (Step A2) |
| `DATABASE_URL is required` | Set the variable in `.env` or in the PowerShell line before the command |
| Health check fails on Railway | Run `db:push:prod` with the **public** Railway URL + `?sslmode=require` |
| Drizzle / schema error on Windows | Run the command from the project root: `pnpm run db:push` |

---

## Related guides

- **Run the app locally** — [README.md](../README.md)
- **Deploy to Railway + domain** — [RAILWAY-DEPLOY.md](./RAILWAY-DEPLOY.md)
