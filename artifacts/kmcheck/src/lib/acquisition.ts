/**
 * First-touch marketing acquisition (client).
 * Captures UTM / click ids / referrer once into localStorage (90d) and a short cookie for OAuth.
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

const STORAGE_KEY = "kmcheck_acquisition_v1";
const COOKIE_NAME = "km_acq";
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const COOKIE_MAX_AGE_SEC = 10 * 60;

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

type Stored = { payload: AcquisitionPayload; expiresAt: number };

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

function isSelfHost(referrerHost: string | null): boolean {
  if (!referrerHost || typeof window === "undefined") return false;
  const self = window.location.hostname.replace(/^www\./i, "").toLowerCase();
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

/** Classify current landing URL + document.referrer (+ in-app browser when present). */
export function classifyAcquisition(
  href: string = typeof window !== "undefined" ? window.location.href : "",
  referrerUrl: string = typeof document !== "undefined" ? document.referrer : "",
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
): AcquisitionPayload {
  let sp: URLSearchParams;
  try {
    sp = new URL(href).searchParams;
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
  const extReferrer = isSelfHost(referrer) ? null : referrer;
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

  // Real ad click ids (Google / TikTok / Bing). Do not treat fbclid as paid —
  // Instagram and Facebook add it to every outbound link, including bio and posts.
  if (gclid) {
    return { ...base, bucket: "paid_ads", channel: "google_ads", clickId: gclid };
  }
  if (ttclid) {
    return { ...base, bucket: "paid_ads", channel: "tiktok_ads", clickId: ttclid };
  }
  if (msclkid) {
    return { ...base, bucket: "paid_ads", channel: "bing_ads", clickId: msclkid };
  }

  // Paid UTMs only — a social site by itself is not an ad
  if (isPaidMedium(medium) || medium?.toLowerCase() === "paid_social") {
    const kind = brandToSocial(brand) ?? social;
    return {
      ...base,
      bucket: "paid_ads",
      channel: paidChannel(kind ?? brand, source),
      clickId: fbclid,
    };
  }

  // Referrer or in-app browser (Instagram / Facebook / TikTok / X / …)
  if (social) {
    return { ...base, bucket: "organic_social", channel: organicChannel(social), clickId: fbclid };
  }

  // Tagged social without a paid medium (bio links, stories)
  const tagged = brandToSocial(brand);
  if (tagged) {
    return { ...base, bucket: "organic_social", channel: organicChannel(tagged), clickId: fbclid };
  }

  // fbclid is added to Meta organic links too. Without a referrer/app, we only
  // know it came from Meta — not that it was an ad, and not which app.
  if (fbclid) {
    return { ...base, bucket: "organic_social", channel: "facebook_social", clickId: fbclid };
  }

  // Google organic (referrer or utm without paid)
  if (isGoogleHost(extReferrer) || brand === "google") {
    return { ...base, bucket: "google", channel: "google_organic", clickId: null };
  }

  // Other UTM source without paid → referral-ish tagged traffic
  if (source) {
    return {
      ...base,
      bucket: "referral",
      channel: source.slice(0, 40).toLowerCase(),
      clickId: null,
    };
  }

  // External website
  if (extReferrer) {
    return {
      ...base,
      bucket: "referral",
      channel: "referral",
      clickId: null,
    };
  }

  // Typed URL / bookmark / Chrome link / stripped referrer
  return {
    ...base,
    bucket: "direct",
    channel: "direct",
    clickId: null,
  };
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.payload?.bucket || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(payload: AcquisitionPayload): void {
  try {
    const stored: Stored = { payload, expiresAt: Date.now() + TTL_MS };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // private mode / quota — ignore
  }
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Write short-lived cookie so OAuth callback can read first-touch (SameSite=Lax). */
export function syncAcquisitionCookie(payload?: AcquisitionPayload | null): void {
  if (typeof document === "undefined") return;
  const p = payload ?? getStoredAcquisition();
  if (!p) return;
  try {
    const compact = {
      bucket: p.bucket,
      channel: p.channel,
      source: p.source ?? undefined,
      medium: p.medium ?? undefined,
      campaign: p.campaign ?? undefined,
      clickId: p.clickId ?? undefined,
      referrer: p.referrer ?? undefined,
      capturedAt: p.capturedAt,
    };
    const val = toBase64Url(JSON.stringify(compact));
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${val}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
  } catch {
    // ignore
  }
}

/** Capture first-touch once (idempotent). Safe to call on every app load. */
export function captureAcquisitionOnce(): AcquisitionPayload {
  const existing = readStored();
  if (existing) {
    syncAcquisitionCookie(existing.payload);
    return existing.payload;
  }
  const payload = classifyAcquisition();
  writeStored(payload);
  syncAcquisitionCookie(payload);
  return payload;
}

export function getStoredAcquisition(): AcquisitionPayload | null {
  return readStored()?.payload ?? null;
}
