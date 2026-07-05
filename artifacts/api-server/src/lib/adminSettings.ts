import type { systemSettingsTable } from "@workspace/db";
import {
  isFacebookOAuthConfigured,
  isGoogleOAuthConfigured,
  isLinkedInOAuthConfigured,
} from "./oauthSettings.js";

type SettingsRow = typeof systemSettingsTable.$inferSelect;

/** Strip secret fields from settings rows before sending to the admin UI. */
export function sanitizeAdminSettings(settings: SettingsRow) {
  const {
    paypalClientSecret,
    recaptchaSecretKey,
    googleClientSecret,
    facebookAppSecret,
    linkedinClientSecret,
    smtpPass,
    ...safe
  } = settings;
  return {
    ...safe,
    hasPaypalSecret: !!paypalClientSecret?.trim(),
    hasRecaptchaSecret: !!recaptchaSecretKey?.trim(),
    hasGoogleSecret: !!googleClientSecret?.trim(),
    hasFacebookSecret: !!facebookAppSecret?.trim(),
    hasLinkedInSecret: !!linkedinClientSecret?.trim(),
    hasSmtpPass: !!smtpPass?.trim(),
    googleButtonVisible: isGoogleOAuthConfigured(settings),
    facebookButtonVisible: isFacebookOAuthConfigured(settings),
    linkedinButtonVisible: isLinkedInOAuthConfigured(settings),
  };
}
