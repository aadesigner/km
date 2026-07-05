import type { SystemSettings } from "@workspace/db";

function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function isGoogleOAuthConfigured(settings: SystemSettings | null | undefined): boolean {
  if (!settings || settings.googleLoginEnabled === false) return false;
  return !!trimmed(settings.googleClientId) && !!trimmed(settings.googleClientSecret);
}

export function isFacebookOAuthConfigured(settings: SystemSettings | null | undefined): boolean {
  if (!settings || settings.facebookLoginEnabled === false) return false;
  return !!trimmed(settings.facebookAppId) && !!trimmed(settings.facebookAppSecret);
}

export function isLinkedInOAuthConfigured(settings: SystemSettings | null | undefined): boolean {
  if (!settings) return false;
  const row = settings as SystemSettings & {
    linkedinLoginEnabled?: boolean;
    linkedinClientId?: string | null;
    linkedinClientSecret?: string | null;
  };
  if (row.linkedinLoginEnabled === false) return false;
  return !!trimmed(row.linkedinClientId) && !!trimmed(row.linkedinClientSecret);
}

export function getLinkedInOAuthCredentials(
  settings: SystemSettings | null | undefined,
): { clientId: string; clientSecret: string } | null {
  if (!isLinkedInOAuthConfigured(settings)) return null;
  const row = settings as SystemSettings & {
    linkedinClientId?: string | null;
    linkedinClientSecret?: string | null;
  };
  return {
    clientId: trimmed(row.linkedinClientId),
    clientSecret: trimmed(row.linkedinClientSecret),
  };
}

/** Inherit missing OAuth / payment credentials from an older settings row. */
export function mergeMissingCredentials(
  target: SystemSettings,
  donor: SystemSettings,
): SystemSettings {
  const pick = (current: string | null | undefined, fallback: string | null | undefined): string | null => {
    const value = trimmed(current) || trimmed(fallback);
    return value || null;
  };

  return {
    ...target,
    paypalClientId: pick(target.paypalClientId, donor.paypalClientId),
    paypalClientSecret: pick(target.paypalClientSecret, donor.paypalClientSecret),
    googleClientId: pick(target.googleClientId, donor.googleClientId),
    googleClientSecret: pick(target.googleClientSecret, donor.googleClientSecret),
    facebookAppId: pick(target.facebookAppId, donor.facebookAppId),
    facebookAppSecret: pick(target.facebookAppSecret, donor.facebookAppSecret),
    linkedinClientId: pick((target as SystemSettings & { linkedinClientId?: string | null }).linkedinClientId, (donor as SystemSettings & { linkedinClientId?: string | null }).linkedinClientId),
    linkedinClientSecret: pick((target as SystemSettings & { linkedinClientSecret?: string | null }).linkedinClientSecret, (donor as SystemSettings & { linkedinClientSecret?: string | null }).linkedinClientSecret),
    recaptchaSecretKey: pick(target.recaptchaSecretKey, donor.recaptchaSecretKey),
    smtpPass: pick(target.smtpPass, donor.smtpPass),
    paypalSandbox: target.paypalSandbox ?? donor.paypalSandbox,
    paypalEnableCards: target.paypalEnableCards ?? donor.paypalEnableCards,
  };
}
