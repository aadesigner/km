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
const MEMORY_CACHE_MAX = 128;
const memoryCache = new Map<string, CachedVinImage>();

function rememberInMemory(url: string, image: CachedVinImage): void {
  if (memoryCache.has(url)) {
    memoryCache.delete(url);
  }
  memoryCache.set(url, image);
  while (memoryCache.size > MEMORY_CACHE_MAX) {
    const oldest = memoryCache.keys().next().value;
    if (!oldest) break;
    memoryCache.delete(oldest);
  }
}

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

const MAX_DISK_BYTES = Number(process.env.VIN_IMAGE_CACHE_MAX_BYTES ?? 400 * 1024 * 1024);

type DiskCacheEntry = {
  bodyPath: string;
  metaPath: string;
  size: number;
  mtimeMs: number;
};

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function listDiskCacheEntries(): Promise<DiskCacheEntry[]> {
  await ensureCacheDir();
  let files: string[];
  try {
    files = await fs.readdir(CACHE_DIR);
  } catch {
    return [];
  }

  const entries: DiskCacheEntry[] = [];
  for (const file of files) {
    if (!file.endsWith(".bin")) continue;
    const bodyPath = path.join(CACHE_DIR, file);
    const metaPath = path.join(CACHE_DIR, file.replace(/\.bin$/, ".json"));
    try {
      const [bodyStat, metaStat] = await Promise.all([fs.stat(bodyPath), fs.stat(metaPath)]);
      entries.push({
        bodyPath,
        metaPath,
        size: bodyStat.size + metaStat.size,
        mtimeMs: Math.max(bodyStat.mtimeMs, metaStat.mtimeMs),
      });
    } catch {
      // skip incomplete pairs
    }
  }
  return entries;
}

async function evictDiskCacheIfNeeded(): Promise<void> {
  if (!Number.isFinite(MAX_DISK_BYTES) || MAX_DISK_BYTES <= 0) return;
  let entries = await listDiskCacheEntries();
  let total = entries.reduce((sum, entry) => sum + entry.size, 0);
  if (total <= MAX_DISK_BYTES) return;

  entries.sort((a, b) => a.mtimeMs - b.mtimeMs);
  for (const entry of entries) {
    if (total <= MAX_DISK_BYTES) break;
    await Promise.allSettled([fs.unlink(entry.bodyPath), fs.unlink(entry.metaPath)]);
    total -= entry.size;
  }
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
  const mem = memoryCache.get(url);
  if (mem) return mem;
  try {
    const { bodyPath, metaPath } = pathsForUrl(url);
    const [metaRaw, body] = await Promise.all([
      fs.readFile(metaPath, "utf8"),
      fs.readFile(bodyPath),
    ]);
    const meta = JSON.parse(metaRaw) as { contentType?: string };
    if (!meta.contentType || !Buffer.isBuffer(body) || body.length === 0) return null;
    const image = { contentType: meta.contentType, body };
    rememberInMemory(url, image);
    return image;
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
  await fs.writeFile(tmpMeta, JSON.stringify({ contentType, upstreamUrl: url, savedAt: Date.now() }));
  await fs.rename(tmpBody, bodyPath);
  await fs.rename(tmpMeta, metaPath);
  await evictDiskCacheIfNeeded();
}

export async function invalidateVinImageCache(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  await Promise.all(unique.map(async (url) => {
    inflight.delete(url);
    memoryCache.delete(url);
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
      rememberInMemory(url, image);
      return image;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, promise);
  return promise;
}
