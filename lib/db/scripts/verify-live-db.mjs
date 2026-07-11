import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && process.env[m[1].trim()] === undefined) process.env[m[1].trim()] = m[2].trim();
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const tables = ["users", "vin_lookups", "payments", "providers", "system_settings"];
for (const table of tables) {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  console.log(`count_${table}:`, rows[0].n);
}

const { rows: userCols } = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`,
);
console.log("users_columns:", userCols.map((r) => r.column_name).join(", "));

const { rows: presenceCols } = await client.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users' AND column_name IN ('last_seen_at', 'last_seen_path')`,
);
console.log("presence_columns:", presenceCols.map((r) => r.column_name).join(", ") || "(none)");

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const { rows: adminRows } = await client.query(
  `SELECT email, is_admin, auth_provider,
          google_id IS NOT NULL AS has_google,
          facebook_id IS NOT NULL AS has_facebook,
          linkedin_id IS NOT NULL AS has_linkedin
   FROM users
   WHERE is_admin = true OR lower(email) = $1`,
  [adminEmail],
);
console.log("admin_users:", JSON.stringify(adminRows, null, 2));

const { rows: completeVins } = await client.query(
  `SELECT COUNT(*)::int AS n FROM vin_lookups WHERE status = 'complete'`,
);
console.log("complete_vin_lookups:", completeVins[0].n);

const { rows: authProbe } = await client.query(
  `SELECT id, email, is_admin, is_banned, password_hash IS NOT NULL AS has_password
   FROM users ORDER BY created_at DESC LIMIT 5`,
);
console.log("recent_users_auth_shape:", JSON.stringify(authProbe, null, 2));

// Full-row select (what old code did) vs narrow select (what auth uses now)
const { rows: fullSelect } = await client.query(`SELECT * FROM users LIMIT 1`);
console.log("full_select_users_ok:", Boolean(fullSelect[0]?.id));

const { rows: narrowSelect } = await client.query(
  `SELECT id, email, name, avatar_url, password_hash, is_admin, is_banned, created_at
   FROM users LIMIT 1`,
);
console.log("narrow_auth_select_ok:", Boolean(narrowSelect[0]?.id));

await client.end();
console.log("verify-live-db: OK");
