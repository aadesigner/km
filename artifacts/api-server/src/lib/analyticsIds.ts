/** Normalize and validate a Google Tag Manager container ID (GTM-XXXXXXX). */
export function normalizeGtmContainerId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const id = raw.trim().toUpperCase();
  if (!id) return null;
  return /^GTM-[A-Z0-9]+$/.test(id) ? id : null;
}

/** Normalize and validate a Google Analytics measurement ID (G-XXX or legacy UA-XXX). */
export function normalizeGaMeasurementId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const id = raw.trim().toUpperCase();
  if (!id) return null;
  if (/^G-[A-Z0-9]+$/.test(id)) return id;
  if (/^UA-\d+-\d+$/.test(id)) return id;
  return null;
}

export function validateAnalyticsSettingsPatch(patch: Record<string, unknown>): string | null {
  if ("analyticsGtmContainerId" in patch) {
    const raw = patch.analyticsGtmContainerId;
    if (raw == null || raw === "") {
      patch.analyticsGtmContainerId = null;
    } else {
      const normalized = normalizeGtmContainerId(String(raw));
      if (!normalized) {
        return "analyticsGtmContainerId must be a valid GTM container ID (e.g. GTM-XXXXXXX)";
      }
      patch.analyticsGtmContainerId = normalized;
    }
  }

  if ("analyticsGaMeasurementId" in patch) {
    const raw = patch.analyticsGaMeasurementId;
    if (raw == null || raw === "") {
      patch.analyticsGaMeasurementId = null;
    } else {
      const normalized = normalizeGaMeasurementId(String(raw));
      if (!normalized) {
        return "analyticsGaMeasurementId must be a valid GA4 (G-XXXXXXXX) or Universal Analytics (UA-XXXXXX-X) ID";
      }
      patch.analyticsGaMeasurementId = normalized;
    }
  }

  if (patch.analyticsGtmEnabled === true && patch.analyticsGtmContainerId === null) {
    return "Enable GTM only when a container ID is set";
  }

  if (patch.analyticsGaEnabled === true && patch.analyticsGaMeasurementId === null) {
    return "Enable Google Analytics only when a measurement ID is set";
  }

  return null;
}

/** Validate enabled flags against final merged settings (patch + existing row). */
export function validateAnalyticsSettingsMerged(
  patch: Record<string, unknown>,
  existing: {
    analyticsGtmEnabled?: boolean;
    analyticsGtmContainerId?: string | null;
    analyticsGaEnabled?: boolean;
    analyticsGaMeasurementId?: string | null;
  } | null | undefined,
): string | null {
  const gtmEnabled = "analyticsGtmEnabled" in patch
    ? patch.analyticsGtmEnabled
    : existing?.analyticsGtmEnabled;
  const gtmId = "analyticsGtmContainerId" in patch
    ? patch.analyticsGtmContainerId
    : existing?.analyticsGtmContainerId;
  const gaEnabled = "analyticsGaEnabled" in patch
    ? patch.analyticsGaEnabled
    : existing?.analyticsGaEnabled;
  const gaId = "analyticsGaMeasurementId" in patch
    ? patch.analyticsGaMeasurementId
    : existing?.analyticsGaMeasurementId;

  if (gtmEnabled && !gtmId) {
    return "Google Tag Manager requires a container ID (GTM-XXXXXXX)";
  }
  if (gaEnabled && !gaId) {
    return "Google Analytics requires a measurement ID (G-XXXXXXXXXX)";
  }
  return null;
}
