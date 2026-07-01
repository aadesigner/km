import type { systemSettingsTable } from "@workspace/db";

type SettingsRow = typeof systemSettingsTable.$inferSelect;

/** Strip secret fields from settings rows before sending to the admin UI. */
export function sanitizeAdminSettings(settings: SettingsRow) {
  const {
    paypalClientSecret,
    recaptchaSecretKey,
    googleClientSecret,
    facebookAppSecret,
    smtpPass,
    ...safe
  } = settings;
  return {
    ...safe,
    hasPaypalSecret: !!paypalClientSecret?.trim(),
    hasRecaptchaSecret: !!recaptchaSecretKey?.trim(),
    hasGoogleSecret: !!googleClientSecret?.trim(),
    hasFacebookSecret: !!facebookAppSecret?.trim(),
    hasSmtpPass: !!smtpPass?.trim(),
  };
}
