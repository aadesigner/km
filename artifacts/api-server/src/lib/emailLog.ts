import { db, emailLogsTable, EMAIL_LOG_TYPES } from "@workspace/db";
import type { EmailLogType, EmailLogStatus } from "@workspace/db";
import { logger } from "./logger.js";

/** Logs older than this are removed when auto-cleanup is enabled. */
export const EMAIL_LOG_RETENTION_DAYS = 7;

const VALID_TYPES = new Set<string>(EMAIL_LOG_TYPES);

export function normalizeEmailLogType(value: string | null | undefined): EmailLogType {
  const v = value?.trim().toLowerCase() ?? "";
  return VALID_TYPES.has(v) ? (v as EmailLogType) : "other";
}

/** Subjects are rendered from admin templates — keep the column bounded. */
const MAX_SUBJECT = 300;
const MAX_ERROR = 500;

export type RecordEmailLogInput = {
  type: EmailLogType;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  error?: string | null;
  meta?: Record<string, unknown> | null;
};

/**
 * Never throws and never blocks the caller — a logging failure must not stop an
 * email from being considered sent.
 */
export function recordEmailLog(input: RecordEmailLogInput): void {
  const recipient = input.recipient.trim().toLowerCase();
  if (!recipient) return;

  void db
    .insert(emailLogsTable)
    .values({
      type: normalizeEmailLogType(input.type),
      recipient: recipient.slice(0, 320),
      subject: (input.subject ?? "").slice(0, MAX_SUBJECT),
      status: input.status,
      error: input.error ? String(input.error).slice(0, MAX_ERROR) : null,
      meta: input.meta ?? null,
    })
    .catch((err) => {
      logger.warn({ err }, "email log insert failed");
    });
}
