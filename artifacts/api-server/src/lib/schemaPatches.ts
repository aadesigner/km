import { db, systemSettingsTable } from "@workspace/db";
import { sql, desc, isNull, eq } from "drizzle-orm";
import { logger } from "./logger.js";
import {
  DEFAULT_PLUGIN_SETTINGS,
  normalizePluginSettings,
  mergeMissingChineseGeoRule,
  mergeMissingGeorgianGeoRule,
} from "./pluginSettings.js";

const SYSTEM_SETTINGS_PATCHES = [
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS krw_per_usd real NOT NULL DEFAULT 1537`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_templates jsonb`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_gtm_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_gtm_container_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_ga_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_ga_measurement_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_clarity_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_clarity_project_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_meta_pixel_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS analytics_meta_pixel_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS log_retention_days integer NOT NULL DEFAULT 4`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS failed_txn_retention_days integer NOT NULL DEFAULT 0`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS maintenance_restrictions jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS maintenance_message text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS vin_lookup_enabled boolean NOT NULL DEFAULT true`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS plugin_settings jsonb`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS smtp_security text NOT NULL DEFAULT 'starttls'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_path text`,
  `CREATE INDEX IF NOT EXISTS users_last_seen_at_idx ON users (last_seen_at)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_linkedin_id_unique ON users (linkedin_id) WHERE linkedin_id IS NOT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS country_change_day text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS country_change_count integer NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_prefix text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_national text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_change_day text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_change_count integer NOT NULL DEFAULT 0`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS linkedin_login_enabled boolean NOT NULL DEFAULT true`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS linkedin_client_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS linkedin_client_secret text`,
  `ALTER TABLE vin_lookups ADD COLUMN IF NOT EXISTS data_corrupt boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_log_retention_enabled boolean NOT NULL DEFAULT true`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_send_admin_pending_vin boolean NOT NULL DEFAULT false`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_send_noinfo boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance integer NOT NULL DEFAULT 0`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'vin_report'`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS credits integer`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS pok_order_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS payments_pok_order_id_idx ON payments (pok_order_id)`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pok_merchant_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pok_key_id text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pok_key_secret text`,
  `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pok_env text NOT NULL DEFAULT 'production'`,
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
  `CREATE TABLE IF NOT EXISTS email_logs (
    id serial PRIMARY KEY,
    type text NOT NULL DEFAULT 'other',
    recipient text NOT NULL,
    subject text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'sent',
    error text,
    meta jsonb,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS email_logs_type_created_at_idx ON email_logs (type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs (status)`,
  `CREATE INDEX IF NOT EXISTS email_logs_recipient_idx ON email_logs (recipient)`,
];

/**
 * The payment-confirmation and report-ready emails were merged into a single
 * `vinready` template with a single `email_send_vin_ready` trigger. Carry the
 * old settings forward so admins keep their customisation and don't silently
 * lose the email if they had only the confirmation half switched on.
 */
const EMAIL_MERGE_PATCHES = [
  `UPDATE system_settings
     SET email_send_vin_ready = true
   WHERE email_send_vin_ready = false AND email_send_report_confirm = true`,
  `UPDATE system_settings
     SET email_templates = jsonb_set(email_templates, '{vinready}', email_templates->'confirm', true)
   WHERE email_templates ? 'confirm' AND NOT (email_templates ? 'vinready')`,
];

const PRICING_DATA_PATCHES = [
  // Migrate catalog sale price €14.99 → €15.99 (list/UI base stays €29.99). Does not touch payments rows.
  `UPDATE pricing SET discount_price = 15.99 WHERE ABS(discount_price - 14.99) < 0.001`,
  `UPDATE pricing SET discount_price = 15.99 WHERE ABS(discount_price - 14.9) < 0.001`,
  `UPDATE pricing SET discount_price = 15.99 WHERE ABS(discount_price - 15) < 0.001`,
  `UPDATE pricing SET discount_price = 15.99 WHERE ABS(discount_price - 15.9) < 0.001`,
  `UPDATE pricing SET discount_price = 15.99 WHERE ABS(discount_price - 9.9) < 0.001`,
  `UPDATE pricing SET base_price = 29.9 WHERE ABS(base_price - 29.90) < 0.001`,
  `UPDATE pricing SET base_price = 29.9 WHERE ABS(base_price - 29.99) < 0.001`,
  `UPDATE pricing SET base_price = 29.9 WHERE ABS(base_price - 30) < 0.001`,
  `UPDATE pricing SET base_price = 29.99 WHERE ABS(base_price - 29.9) < 0.001`,
];

/** Idempotent schema adds for DBs that predate newer fields/tables. */
export async function patchSystemSettingsSchema(): Promise<void> {
  for (const statement of [
    ...SYSTEM_SETTINGS_PATCHES,
    ...TABLE_PATCHES,
    ...EMAIL_MERGE_PATCHES,
    ...PRICING_DATA_PATCHES,
  ]) {
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

  const [pluginRow] = await db
    .select({ id: systemSettingsTable.id, pluginSettings: systemSettingsTable.pluginSettings })
    .from(systemSettingsTable)
    .orderBy(desc(systemSettingsTable.id))
    .limit(1);

  if (pluginRow?.pluginSettings) {
    const current = normalizePluginSettings(pluginRow.pluginSettings);
    const withChinese = mergeMissingChineseGeoRule(current);
    const withGeorgian = mergeMissingGeorgianGeoRule(withChinese);
    if (JSON.stringify(withGeorgian) !== JSON.stringify(current)) {
      await db
        .update(systemSettingsTable)
        .set({ pluginSettings: withGeorgian, updatedAt: new Date() })
        .where(eq(systemSettingsTable.id, pluginRow.id));
      logger.info("patched plugin_settings with missing geo redirect rules");
    }
  }

  logger.info("database schema patches applied");
}
