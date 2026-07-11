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

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const admins = await client.query(
  `SELECT email, is_admin, auth_provider, google_id IS NOT NULL AS has_google,
          facebook_id IS NOT NULL AS has_facebook, linkedin_id IS NOT NULL AS has_linkedin
   FROM users WHERE is_admin = true OR lower(email) = $1`,
  [adminEmail ?? ""],
);
console.log("ADMIN_EMAIL env:", adminEmail ?? "(not set)");
console.log("matching users:", JSON.stringify(admins.rows, null, 2));

const cols = await client.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_name='users' AND column_name IN ('last_seen_at','last_seen_path')`,
);
console.log("presence cols:", cols.rows.map((r) => r.column_name));

await client.end();
