function appBasePath(): string {
  const raw = import.meta.env?.BASE_URL;
  return typeof raw === "string" ? raw.replace(/\/$/, "") : "";
}

/** Canonical public VIN page path — same as sitemap / share URLs. */
export function publicVinPagePath(vin: string, language = "en"): string {
  const clean = vin.trim().toUpperCase();
  return `${appBasePath()}/${language}/vin/${encodeURIComponent(clean)}`;
}

function hasEntries(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

/** True when catalog data is a published report, not a pending stub. */
export function catalogDataIsPublished(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (d.fulfillmentPending === true) return false;
  const make = typeof d.make === "string" ? d.make.trim() : "";
  const model = typeof d.model === "string" ? d.model.trim() : "";
  if (make && (model || d.year != null && String(d.year).trim() !== "")) return true;
  return (
    hasEntries(d.photos)
    || hasEntries(d.accidents)
    || hasEntries(d.mileageHistory)
    || hasEntries(d.ownerHistory)
    || hasEntries(d.insuranceClaims)
    || hasEntries(d.registryHistory)
    || hasEntries(d.auctionHistory)
    || hasEntries(d.serviceHistory)
  );
}
