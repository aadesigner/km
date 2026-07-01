import { db, systemSettingsTable, type SystemSettings } from "@workspace/db";
import { desc, isNotNull, and, ne, eq } from "drizzle-orm";

/** Latest settings row (highest id). */
export async function getLatestSystemSettings(): Promise<SystemSettings | null> {
  const [row] = await db
    .select()
    .from(systemSettingsTable)
    .orderBy(desc(systemSettingsTable.id))
    .limit(1);
  return row ?? null;
}

/**
 * Prefer the newest row, but inherit PayPal credentials from an older row when a
 * partial insert left the latest row without them (e.g. email-template-only row).
 */
export async function getEffectiveSystemSettings(): Promise<SystemSettings | null> {
  const latest = await getLatestSystemSettings();
  if (!latest) return null;

  const hasPaypal =
    !!latest.paypalClientId?.trim() && !!latest.paypalClientSecret?.trim();
  if (hasPaypal) return latest;

  const [donor] = await db
    .select()
    .from(systemSettingsTable)
    .where(
      and(
        isNotNull(systemSettingsTable.paypalClientId),
        ne(systemSettingsTable.paypalClientId, ""),
        isNotNull(systemSettingsTable.paypalClientSecret),
        ne(systemSettingsTable.paypalClientSecret, ""),
        ne(systemSettingsTable.id, latest.id),
      ),
    )
    .orderBy(desc(systemSettingsTable.id))
    .limit(1);

  if (!donor) return latest;

  return {
    ...latest,
    paypalClientId: latest.paypalClientId?.trim() || donor.paypalClientId,
    paypalClientSecret: latest.paypalClientSecret?.trim() || donor.paypalClientSecret,
    paypalSandbox: latest.paypalSandbox ?? donor.paypalSandbox,
    paypalEnableCards: latest.paypalEnableCards ?? donor.paypalEnableCards,
  };
}

/** Merge orphan settings rows into the canonical row and delete duplicates. */
export async function consolidateSystemSettingsRows(): Promise<void> {
  const rows = await db
    .select()
    .from(systemSettingsTable)
    .orderBy(desc(systemSettingsTable.id));

  if (rows.length <= 1) return;

  const [canonical, ...older] = rows;
  const merged: SystemSettings = { ...canonical };

  for (const row of older) {
    if (!merged.paypalClientId?.trim() && row.paypalClientId?.trim()) {
      merged.paypalClientId = row.paypalClientId;
    }
    if (!merged.paypalClientSecret?.trim() && row.paypalClientSecret?.trim()) {
      merged.paypalClientSecret = row.paypalClientSecret;
    }
    if (!merged.recaptchaSecretKey?.trim() && row.recaptchaSecretKey?.trim()) {
      merged.recaptchaSecretKey = row.recaptchaSecretKey;
    }
    if (!merged.googleClientSecret?.trim() && row.googleClientSecret?.trim()) {
      merged.googleClientSecret = row.googleClientSecret;
    }
    if (!merged.facebookAppSecret?.trim() && row.facebookAppSecret?.trim()) {
      merged.facebookAppSecret = row.facebookAppSecret;
    }
    if (!merged.smtpPass?.trim() && row.smtpPass?.trim()) {
      merged.smtpPass = row.smtpPass;
    }
  }

  await db
    .update(systemSettingsTable)
    .set({
      paypalClientId: merged.paypalClientId,
      paypalClientSecret: merged.paypalClientSecret,
      paypalSandbox: merged.paypalSandbox,
      paypalEnableCards: merged.paypalEnableCards,
      recaptchaSecretKey: merged.recaptchaSecretKey,
      googleClientSecret: merged.googleClientSecret,
      facebookAppSecret: merged.facebookAppSecret,
      smtpPass: merged.smtpPass,
      updatedAt: new Date(),
    })
    .where(eq(systemSettingsTable.id, canonical.id));

  for (const row of older) {
    await db.delete(systemSettingsTable).where(eq(systemSettingsTable.id, row.id));
  }
}
