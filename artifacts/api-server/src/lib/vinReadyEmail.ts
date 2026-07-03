import { db, systemSettingsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { logger } from "./logger.js";
import { claimEmailDelivery, vinReadyEmailDeliveryKey } from "./emailDeliveryGuard.js";

/** Fire-and-forget VIN report ready email after catalog publish or instant fulfillment. */
export async function fireVinReadyEmailForUser(
  lookupId: number,
  vin: string,
  data: Record<string, unknown> | null,
  user: { name: string | null; email: string } | undefined,
): Promise<boolean> {
  if (!user?.email) return false;

  const deliveryKey = vinReadyEmailDeliveryKey(lookupId, user.email);
  if (!claimEmailDelivery(deliveryKey)) {
    logger.info({ vin, lookupId, email: user.email }, "VIN ready email skipped — duplicate guard");
    return false;
  }

  try {
    const [settings] = await db
      .select({
        emailSendVinReady: systemSettingsTable.emailSendVinReady,
        siteUrl: systemSettingsTable.siteUrl,
        emailTemplates: systemSettingsTable.emailTemplates,
      })
      .from(systemSettingsTable)
      .orderBy(desc(systemSettingsTable.id))
      .limit(1);
    if (settings?.emailSendVinReady === false) return false;
    const siteUrl = settings?.siteUrl?.replace(/\/$/, "") ?? "https://kmcheck.com";
    const templates = (settings?.emailTemplates ?? {}) as import("@workspace/db").EmailTemplatesConfig;
    const { sendEmail, buildVinReadyEmail } = await import("./emailService.js");
    const d = data ?? {};
    const result = await sendEmail({
      to: user.email,
      ...buildVinReadyEmail({
        name: user.name ?? user.email.split("@")[0],
        vin,
        reportUrl: `${siteUrl}/en/report/${lookupId}`,
        make: (d.make as string | null) ?? null,
        model: (d.model as string | null) ?? null,
        year: (d.year as number | null) ?? null,
        mileage: (d.mileage as number | null) ?? (d.odometer as number | null) ?? null,
        accidents: (d.accidentCount as number | null) ?? (Array.isArray(d.accidents) ? (d.accidents as unknown[]).length : null),
        siteUrl,
      }, templates.vinready),
    });
    if (!result.ok) {
      logger.warn({ vin, err: result.error }, "VIN ready email failed");
      return false;
    }
    return true;
  } catch (err) {
    logger.warn({ vin, err }, "VIN ready email threw");
    return false;
  }
}
