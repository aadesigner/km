import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export type CachedVinImage = {
  contentType: string;
  body: Buffer;
};

const CACHE_DIR =
  process.env.VIN_IMAGE_CACHE_DIR?.trim() ||
  path.join(process.cwd(), ".cache", "vin-images");

const inflight = new Map<string, Promise<CachedVinImage>>();

function cacheKeyForUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex");
}

function pathsForUrl(url: string): { bodyPath: string; metaPath: string } {
  const key = cacheKeyForUrl(url);
  return {
    bodyPath: path.join(CACHE_DIR, `${key}.bin`),
    metaPath: path.join(CACHE_DIR, `${key}.json`),
  };
}

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

/** Raw upstream photo URLs stored on VIN lookup / catalog rows. */
export function extractVinPhotoUrls(data: unknown): string[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const record = data as Record<string, unknown>;
  const urls = new Set<string>();
  if (typeof record.thumbnailUrl === "string" && record.thumbnailUrl) {
    urls.add(record.thumbnailUrl);
  }
  if (Array.isArray(record.photos)) {
    for (const photo of record.photos) {
      if (typeof photo === "string" && photo) urls.add(photo);
    }
  }
  return [...urls];
}

export function mediaVersionFromUpdatedAt(
  updatedAt: Date | string | null | undefined,
): number | undefined {
  if (!updatedAt) return undefined;
  const ms = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

export async function readVinImageCache(url: string): Promise<CachedVinImage | null> {
  try {
    const { bodyPath, metaPath } = pathsForUrl(url);
    const [metaRaw, body] = await Promise.all([
      fs.readFile(metaPath, "utf8"),
      fs.readFile(bodyPath),
    ]);
    const meta = JSON.parse(metaRaw) as { contentType?: string };
    if (!meta.contentType || !Buffer.isBuffer(body) || body.length === 0) return null;
    return { contentType: meta.contentType, body };
  } catch {
    return null;
  }
}

export async function writeVinImageCache(
  url: string,
  contentType: string,
  body: Buffer,
): Promise<void> {
  if (!body.length) return;
  await ensureCacheDir();
  const { bodyPath, metaPath } = pathsForUrl(url);
  const tmpBody = `${bodyPath}.${process.pid}.tmp`;
  const tmpMeta = `${metaPath}.${process.pid}.tmp`;
  await fs.writeFile(tmpBody, body);
  await fs.writeFile(tmpMeta, JSON.stringify({ contentType, upstreamUrl: url }));
  await fs.rename(tmpBody, bodyPath);
  await fs.rename(tmpMeta, metaPath);
}

export async function invalidateVinImageCache(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  await Promise.all(unique.map(async (url) => {
    inflight.delete(url);
    const { bodyPath, metaPath } = pathsForUrl(url);
    await Promise.allSettled([fs.unlink(bodyPath), fs.unlink(metaPath)]);
  }));
}

export async function invalidateVinImagesFromData(data: unknown): Promise<void> {
  await invalidateVinImageCache(extractVinPhotoUrls(data));
}

/** Disk cache with in-flight dedupe — one upstream fetch per URL at a time. */
export async function getOrFetchVinImage(
  url: string,
  fetcher: () => Promise<CachedVinImage>,
): Promise<CachedVinImage> {
  const cached = await readVinImageCache(url);
  if (cached) return cached;

  const existing = inflight.get(url);
  if (existing) return existing;

  const promise = fetcher()
    .then(async (image) => {
      await writeVinImageCache(url, image.contentType, image.body);
      return image;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, promise);
  return promise;
}
