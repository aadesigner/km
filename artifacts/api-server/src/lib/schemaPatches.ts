import { db, systemSettingsTable } from "@workspace/db";
import { sql, desc, isNull } from "drizzle-orm";
import { logger } from "./logger.js";
import { DEFAULT_PLUGIN_SETTINGS } from "./pluginSettings.js";

const SYSTEM_SETTINGS_PATCHES = [
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS krw_per_usd real NOT NULL DEFAULT 1537`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_templates jsonb`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_gtm_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_gtm_container_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_ga_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_ga_measurement_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS log_retention_days integer NOT NULL DEFAULT 0`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS failed_txn_retention_days integer NOT NULL DEFAULT 0`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS maintenance_restrictions jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS maintenance_message text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS vin_lookup_enabled boolean NOT NULL DEFAULT true`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS plugin_settings jsonb`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS smtp_security text NOT NULL DEFAULT 'starttls'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip text`,
  `ALTER TABLE vin_lookups ADD COLUMN IF NOT EXISTS data_corrupt boolean NOT NULL DEFAULT false`,
];

const TABLE_PATCHES = [
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
  `CREATE UNIQUE INDEX IF NOT EXISTS pending_vin_checks_vin_unique ON pending_vin_checks (vin)`,
  `CREATE INDEX IF NOT EXISTS pending_vin_checks_status_idx ON pending_vin_checks (status)`,
  `CREATE INDEX IF NOT EXISTS pending_vin_checks_updated_at_idx ON pending_vin_checks (updated_at)`,
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
  `CREATE INDEX IF NOT EXISTS pending_vin_check_requests_pending_id_idx ON pending_vin_check_requests (pending_vin_check_id)`,
  `CREATE INDEX IF NOT EXISTS pending_vin_check_requests_user_id_idx ON pending_vin_check_requests (user_id)`,
  `CREATE INDEX IF NOT EXISTS pending_vin_check_requests_lookup_id_idx ON pending_vin_check_requests (lookup_id)`,
  `CREATE TABLE IF NOT EXISTS access_blocks (
    id serial PRIMARY KEY,
    block_type text NOT NULL,
    block_value text NOT NULL,
    reason text,
    source text NOT NULL DEFAULT 'manual',
    user_id text,
    created_by text,
    created_at timestamp NOT NULL DEFAULT now(),
    expires_at timestamp
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS access_blocks_type_value_idx ON access_blocks (block_type, block_value)`,
  `CREATE INDEX IF NOT EXISTS access_blocks_user_id_idx ON access_blocks (user_id)`,
  `CREATE INDEX IF NOT EXISTS access_blocks_created_at_idx ON access_blocks (created_at)`,
  `CREATE INDEX IF NOT EXISTS vin_lookups_user_created_idx ON vin_lookups (user_id, created_at DESC)`,
];

const PRICING_DATA_PATCHES = [
  `UPDATE pricing SET discount_price = 14.9 WHERE discount_price = 9.9`,
  `UPDATE pricing SET discount_price = 14.9 WHERE ABS(discount_price - 14.99) < 0.001`,
  `UPDATE pricing SET discount_price = 14.9 WHERE ABS(discount_price - 15) < 0.001`,
  `UPDATE pricing SET base_price = 29.9 WHERE ABS(base_price - 29.90) < 0.001`,
  `UPDATE pricing SET base_price = 29.9 WHERE ABS(base_price - 29.99) < 0.001`,
  `UPDATE pricing SET base_price = 29.9 WHERE ABS(base_price - 30) < 0.001`,
  `UPDATE pricing SET discount_price = 14.99 WHERE ABS(discount_price - 14.9) < 0.001`,
  `UPDATE pricing SET base_price = 29.99 WHERE ABS(base_price - 29.9) < 0.001`,
];

/** Idempotent schema adds for DBs that predate newer fields/tables. */
export async function patchSystemSettingsSchema(): Promise<void> {
  for (const statement of [...SYSTEM_SETTINGS_PATCHES, ...TABLE_PATCHES, ...PRICING_DATA_PATCHES]) {
    await db.execute(sql.raw(statement));
  }

  const [missingPlugins] = await db
    .select({ id: systemSettingsTable.id })
    .from(systemSettingsTable)
    .where(isNull(systemSettingsTable.pluginSettings))
    .orderBy(desc(systemSettingsTable.id))
    .limit(1);

  if (missingPlugins) {
    await db
      .update(systemSettingsTable)
      .set({ pluginSettings: DEFAULT_PLUGIN_SETTINGS, updatedAt: new Date() })
      .where(isNull(systemSettingsTable.pluginSettings));
    logger.info("seeded default plugin_settings (geo language redirect enabled)");
  }

  logger.info("database schema patches applied");
}
