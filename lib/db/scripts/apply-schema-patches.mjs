import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim();
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const statements = [
  "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_gtm_enabled boolean NOT NULL DEFAULT false",
  "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_gtm_container_id text",
  "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_ga_enabled boolean NOT NULL DEFAULT false",
  "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_ga_measurement_id text",
  "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS log_retention_days integer NOT NULL DEFAULT 0",
  "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS failed_txn_retention_days integer NOT NULL DEFAULT 0",
  `CREATE TABLE IF NOT EXISTS pending_vin_checks (
    id serial PRIMARY KEY,
    vin text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    draft_data jsonb NOT NULL DEFAULT '{}',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    published_at timestamp,
    published_by text
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS pending_vin_checks_vin_unique ON pending_vin_checks (vin)",
  "CREATE INDEX IF NOT EXISTS pending_vin_checks_status_idx ON pending_vin_checks (status)",
  "CREATE INDEX IF NOT EXISTS pending_vin_checks_updated_at_idx ON pending_vin_checks (updated_at)",
  `CREATE TABLE IF NOT EXISTS pending_vin_check_requests (
    id serial PRIMARY KEY,
    pending_vin_check_id integer NOT NULL,
    user_id text NOT NULL,
    payment_id integer,
    lookup_id integer NOT NULL,
    notify_on_publish boolean NOT NULL DEFAULT true,
    notified_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  "CREATE INDEX IF NOT EXISTS pending_vin_check_requests_pending_id_idx ON pending_vin_check_requests (pending_vin_check_id)",
  "CREATE INDEX IF NOT EXISTS pending_vin_check_requests_user_id_idx ON pending_vin_check_requests (user_id)",
  "CREATE INDEX IF NOT EXISTS pending_vin_check_requests_lookup_id_idx ON pending_vin_check_requests (lookup_id)",
];

const client = new pg.Client({ connectionString: url });
await client.connect();
for (const statement of statements) {
  await client.query(statement);
  console.log("OK:", statement.slice(0, 72));
}
await client.end();
console.log("Schema patches applied successfully.");
