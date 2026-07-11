import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
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
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamp",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_path text",
  "CREATE INDEX IF NOT EXISTS users_last_seen_at_idx ON users (last_seen_at)",
];

const client = new pg.Client({ connectionString: url });
await client.connect();
for (const statement of statements) {
  await client.query(statement);
  console.log("OK:", statement);
}
await client.end();
console.log("Presence schema applied successfully.");
