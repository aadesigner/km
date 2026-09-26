/**
 * Pure first-touch classification. Used by the HTML cookie stamp and the browser.
 * fbclid is not treated as a paid click — Meta adds it to organic links too.
 */

export type AcquisitionBucket =
  | "paid_ads"
  | "organic_social"
  | "google"
  | "referral"
  | "direct"
  | "unknown";

export type AcquisitionPayload = {
  bucket: AcquisitionBucket;
  channel: string;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  clickId?: string | null;
  referrer?: string | null;
  capturedAt: string;
};

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsocial",
  "paid_social",
  "paid-social",
  "display",
  "retargeting",
  "remarketing",
]);

type SocialKind =
  | "instagram"
  | "facebook"
  | "messenger"
  | "tiktok"
  | "x"
  | "linkedin"
  | "whatsapp"
  | "youtube"
  | "pinterest"
  | "reddit"
  | "snapchat";

function hostOnly(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./i, "").toLowerCase().slice(0, 200) || null;
  } catch {
    return null;
  }
}

function param(sp: URLSearchParams, key: string): string | null {
  const v = sp.get(key)?.trim();
  return v ? v.slice(0, 128) : null;
}

function isPaidMedium(medium: string | null): boolean {
  if (!medium) return false;
  return PAID_MEDIUMS.has(medium.toLowerCase());
}

function socialKind(host: string | null): SocialKind | null {
  if (!host) return null;
  if (
    /(^|\.)instagram\.com$/i.test(host)
    || host === "ig.me"
    || /(^|\.)threads\.net$/i.test(host)
    || /(^|\.)threads\.com$/i.test(host)
  ) {
    return "instagram";
  }
  if (
    /(^|\.)messenger\.com$/i.test(host)
    || host === "m.me"
    || host === "l.messenger.com"
  ) {
    return "messenger";
  }
  if (
    /(^|\.)facebook\.com$/i.test(host)
    || /(^|\.)fb\.com$/i.test(host)
    || host === "fb.me"
    || host.endsWith(".fb.me")
  ) {
    return "facebook";
  }
  if (/(^|\.)tiktok\.com$/i.test(host)) return "tiktok";
  if (/(^|\.)(twitter|x)\.com$/i.test(host) || host === "t.co") return "x";
  if (/(^|\.)linkedin\.com$/i.test(host) || host === "lnkd.in" || host.endsWith(".lnkd.in")) return "linkedin";
  if (/(^|\.)whatsapp\.com$/i.test(host) || host === "wa.me") return "whatsapp";
  if (/(^|\.)youtube\.com$/i.test(host) || host === "youtu.be") return "youtube";
  if (/(^|\.)pinterest\.com$/i.test(host) || host === "pin.it") return "pinterest";
  if (/(^|\.)reddit\.com$/i.test(host)) return "reddit";
  if (/(^|\.)snapchat\.com$/i.test(host)) return "snapchat";
  return null;
}

function inAppSocial(userAgent: string): SocialKind | null {
  if (!userAgent) return null;
  if (/Instagram|Threads/i.test(userAgent)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(userAgent)) return "facebook";
  if (/Messenger/i.test(userAgent)) return "messenger";
  if (/TikTok/i.test(userAgent)) return "tiktok";
  if (/\bTwitter/i.test(userAgent)) return "x";
  if (/LinkedIn/i.test(userAgent)) return "linkedin";
  if (/WhatsApp/i.test(userAgent)) return "whatsapp";
  return null;
}

function organicChannel(kind: SocialKind): string {
  switch (kind) {
    case "instagram": return "instagram_social";
    case "facebook": return "facebook_social";
    case "messenger": return "messenger";
    case "tiktok": return "tiktok_social";
    case "x": return "x_social";
    case "linkedin": return "linkedin_social";
    case "whatsapp": return "whatsapp_social";
    case "youtube": return "youtube_social";
    case "pinterest": return "pinterest_social";
    case "reddit": return "reddit_social";
    case "snapchat": return "snapchat_social";
  }
}

function paidChannel(kind: SocialKind | "meta" | "google" | string | null, source: string | null): string {
  if (kind === "instagram") return "instagram_ads";
  if (kind === "facebook" || kind === "meta" || kind === "messenger") return "meta_ads";
  if (kind === "tiktok") return "tiktok_ads";
  if (kind === "x") return "x_ads";
  if (kind === "linkedin") return "linkedin_ads";
  if (kind === "google") return "google_ads";
  if (source) return `${source.slice(0, 24)}_ads`;
  return "paid_ads";
}

function isGoogleHost(host: string | null): boolean {
  if (!host) return false;
  return /(^|\.)google\./i.test(host) || host === "google.com" || host.endsWith(".googleusercontent.com");
}

function isSelfHost(referrerHost: string | null, selfHost: string | null | undefined): boolean {
  if (!referrerHost || !selfHost) return false;
  const self = selfHost.replace(/^www\./i, "").toLowerCase();
  return referrerHost === self || referrerHost.endsWith(`.${self}`);
}

function sourceBrand(source: string | null): SocialKind | "meta" | "google" | null {
  if (!source) return null;
  const s = source.toLowerCase();
  if (/^(ig|instagram|insta|threads)$/.test(s)) return "instagram";
  if (/^(messenger|msg)$/.test(s)) return "messenger";
  if (/^(meta|facebook|fb)$/.test(s)) return "meta";
  if (/^tiktok$/.test(s)) return "tiktok";
  if (/^(google|adwords|adsense)$/.test(s)) return "google";
  if (/^(twitter|x)$/.test(s)) return "x";
  if (/^linkedin$/.test(s)) return "linkedin";
  if (/^(whatsapp|wa)$/.test(s)) return "whatsapp";
  if (/^(youtube|yt)$/.test(s)) return "youtube";
  if (/^pinterest$/.test(s)) return "pinterest";
  if (/^reddit$/.test(s)) return "reddit";
  if (/^snapchat$/.test(s)) return "snapchat";
  return null;
}

function brandToSocial(brand: SocialKind | "meta" | "google" | null): SocialKind | null {
  if (!brand || brand === "google") return null;
  if (brand === "meta") return "facebook";
  return brand;
}

export function classifyAcquisition(
  href: string,
  referrerUrl = "",
  userAgent = "",
  selfHost?: string | null,
): AcquisitionPayload {
  let pageHost = selfHost ? selfHost.replace(/^www\./i, "").toLowerCase() : null;
  let sp: URLSearchParams;
  try {
    const u = new URL(href);
    sp = u.searchParams;
    pageHost = pageHost ?? u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    sp = new URLSearchParams();
  }

  const source = param(sp, "utm_source");
  const medium = param(sp, "utm_medium");
  const campaign = param(sp, "utm_campaign");
  const fbclid = param(sp, "fbclid");
  const gclid = param(sp, "gclid");
  const ttclid = param(sp, "ttclid");
  const msclkid = param(sp, "msclkid");
  const referrer = hostOnly(referrerUrl);
  const extReferrer = isSelfHost(referrer, pageHost) ? null : referrer;
  const brand = sourceBrand(source);
  const social = socialKind(extReferrer) ?? inAppSocial(userAgent);
  const capturedAt = new Date().toISOString();

  const base = {
    source,
    medium,
    campaign,
    referrer: extReferrer,
    capturedAt,
  };

  if (gclid) {
    return { ...base, bucket: "paid_ads", channel: "google_ads", clickId: gclid };
  }
  if (ttclid) {
    return { ...base, bucket: "paid_ads", channel: "tiktok_ads", clickId: ttclid };
  }
  if (msclkid) {
    return { ...base, bucket: "paid_ads", channel: "bing_ads", clickId: msclkid };
  }

  if (isPaidMedium(medium) || medium?.toLowerCase() === "paid_social") {
    const kind = brandToSocial(brand) ?? social;
    return {
      ...base,
      bucket: "paid_ads",
      channel: paidChannel(kind ?? brand, source),
      clickId: fbclid,
    };
  }

  if (social) {
    return { ...base, bucket: "organic_social", channel: organicChannel(social), clickId: fbclid };
  }

  const tagged = brandToSocial(brand);
  if (tagged) {
    return { ...base, bucket: "organic_social", channel: organicChannel(tagged), clickId: fbclid };
  }

  if (fbclid) {
    return { ...base, bucket: "organic_social", channel: "facebook_social", clickId: fbclid };
  }

  if (isGoogleHost(extReferrer) || brand === "google") {
    return { ...base, bucket: "google", channel: "google_organic", clickId: null };
  }

  if (source) {
    return {
      ...base,
      bucket: "referral",
      channel: source.slice(0, 40).toLowerCase(),
      clickId: null,
    };
  }

  if (extReferrer) {
    return {
      ...base,
      bucket: "referral",
      channel: "referral",
      clickId: null,
    };
  }

  return {
    ...base,
    bucket: "direct",
    channel: "direct",
    clickId: null,
  };
}

export function isStrongerAcquisition(
  existing: AcquisitionPayload,
  incoming: AcquisitionPayload,
): boolean {
  const existingWeak = existing.bucket === "direct" || existing.bucket === "unknown";
  const incomingWeak = incoming.bucket === "direct" || incoming.bucket === "unknown";
  if (existingWeak && !incomingWeak) return true;
  if (existing.channel === "facebook_social" && incoming.channel === "instagram_social") return true;
  if (existing.channel === "facebook_social" && incoming.channel === "messenger") return true;
  return false;
}

export function pickStrongerAcquisition(
  a: AcquisitionPayload | null,
  b: AcquisitionPayload | null,
): AcquisitionPayload | null {
  if (!a) return b;
  if (!b) return a;
  return isStrongerAcquisition(a, b) ? b : a;
}
