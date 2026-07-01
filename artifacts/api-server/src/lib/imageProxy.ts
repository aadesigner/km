import crypto from "crypto";

function deriveKey(): Buffer {
  const secret = process.env.JWT_SECRET ?? "dev-insecure-secret-change-in-production";
  return crypto.createHash("sha256").update(secret).digest();
}

/** Stable IV per URL so proxy URLs stay cacheable across API responses. */
function ivForUrl(url: string): Buffer {
  return crypto.createHash("sha256").update(`vin-img:${url}`).digest().subarray(0, 12);
}

const IMAGE_TOKEN_TTL_SEC = 24 * 60 * 60;

/** Same upstream URL → same token for the rest of the UTC day (stable across report refetches). */
function tokenExpirySec(): number {
  const now = Math.floor(Date.now() / 1000);
  const dayStart = Math.floor(now / 86400) * 86400;
  return dayStart + 86400 * 2;
}

export function signImageToken(url: string): string {
  const key = deriveKey();
  const iv = ivForUrl(url);
  const plaintext = JSON.stringify({
    url,
    exp: tokenExpirySec(),
  });
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function verifyImageToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const key = deriveKey();
    const iv = Buffer.from(parts[0], "base64url");
    const encrypted = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
    const { url, exp } = JSON.parse(plaintext) as { url?: string; exp?: number };
    if (!url || typeof url !== "string") return null;
    if (typeof exp === "number" && exp < Math.floor(Date.now() / 1000)) return null;
    return url;
  } catch {
    return null;
  }
}

export function buildImageProxyUrl(
  upstreamUrl: string,
  opts?: { baseApiUrl?: string; mediaVersion?: number },
): string {
  const base = (opts?.baseApiUrl ?? "").replace(/\/$/, "");
  const token = encodeURIComponent(signImageToken(upstreamUrl));
  let url = `${base}/api/vin/image?token=${token}`;
  if (opts?.mediaVersion != null && Number.isFinite(opts.mediaVersion)) {
    url += `&v=${opts.mediaVersion}`;
  }
  return url;
}

export function proxyPhotos(
  photos: unknown,
  baseApiUrl: string,
  mediaVersion?: number,
): string[] {
  if (!Array.isArray(photos)) return [];
  return (photos as unknown[]).flatMap((p) => {
    if (typeof p !== "string" || !p) return [];
    if (p.startsWith("/api/vin/image")) return [p];
    return [buildImageProxyUrl(p, { baseApiUrl, mediaVersion })];
  });
}

export function transformVinPhotoData(
  data: unknown,
  mediaVersion?: number,
): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const record = data as Record<string, unknown>;
  const result: Record<string, unknown> = { ...record };
  if (Array.isArray(record.photos)) {
    result.photos = (record.photos as unknown[])
      .filter((p): p is string => typeof p === "string" && p.length > 0)
      .map((p) =>
        p.startsWith("/api/vin/image")
          ? p
          : buildImageProxyUrl(p, { mediaVersion }),
      );
  }
  if (typeof record.thumbnailUrl === "string" && record.thumbnailUrl) {
    result.thumbnailUrl = record.thumbnailUrl.startsWith("/api/vin/image")
      ? record.thumbnailUrl
      : buildImageProxyUrl(record.thumbnailUrl, { mediaVersion });
  }
  return result;
}
