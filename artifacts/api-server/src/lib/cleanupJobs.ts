import { db, systemLogsTable, loginAttemptsTable, systemSettingsTable, paymentsTable } from "@workspace/db";
import { lt, desc, and, eq, inArray } from "drizzle-orm";
import { logger } from "./logger.js";

async function getSettings() {
  const [s] = await db
    .select({
      logRetentionDays: systemSettingsTable.logRetentionDays,
      failedTxnRetentionDays: systemSettingsTable.failedTxnRetentionDays,
    })
    .from(systemSettingsTable)
    .orderBy(desc(systemSettingsTable.id))
    .limit(1);
  return s ?? { logRetentionDays: 0, failedTxnRetentionDays: 0 };
}

async function purgeLogs(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400 * 1000);
  let total = 0;
  for (;;) {
    const rows = await db
      .select({ id: systemLogsTable.id })
      .from(systemLogsTable)
      .where(lt(systemLogsTable.createdAt, cutoff))
      .limit(500);
    if (rows.length === 0) break;
    await db.delete(systemLogsTable).where(
      inArray(systemLogsTable.id, rows.map((r) => r.id)),
    );
    total += rows.length;
    if (rows.length < 500) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  return total;
}

async function purgeFailedTransactions(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400 * 1000);
  let total = 0;
  for (;;) {
    const rows = await db
      .select({ id: paymentsTable.id })
      .from(paymentsTable)
      .where(and(eq(paymentsTable.status, "failed"), lt(paymentsTable.createdAt, cutoff)))
      .limit(500);
    if (rows.length === 0) break;
    await db.delete(paymentsTable).where(
      inArray(paymentsTable.id, rows.map((r) => r.id)),
    );
    total += rows.length;
    if (rows.length < 500) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  return total;
}

async function purgeOldLoginAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 86400 * 1000);
  await db.delete(loginAttemptsTable).where(lt(loginAttemptsTable.attemptedAt, cutoff));
}

export async function runCleanupJobs(): Promise<void> {
  try {
    const settings = await getSettings();

    void purgeOldLoginAttempts().catch((e) =>
      logger.warn({ err: e }, "cleanup: login_attempts purge failed"),
    );

    if (settings.logRetentionDays > 0) {
      const n = await purgeLogs(settings.logRetentionDays);
      if (n > 0) logger.info({ count: n, days: settings.logRetentionDays }, "cleanup: system_logs purged");
    }

    if (settings.failedTxnRetentionDays > 0) {
      const n = await purgeFailedTransactions(settings.failedTxnRetentionDays);
      if (n > 0) logger.info({ count: n, days: settings.failedTxnRetentionDays }, "cleanup: failed payments purged");
    }
  } catch (err) {
    logger.warn({ err }, "cleanup jobs failed");
  }
}

export function scheduleCleanupJobs(): void {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setTimeout(() => {
    void runCleanupJobs();
    setInterval(() => void runCleanupJobs(), SIX_HOURS);
  }, 30_000);
}
