const CACHE_NAME = "kmcheck-vin-images-v1";
const PREFETCH_CONCURRENCY = 6;
/** Max images warmed per prefetchVinImages() call. */
const MAX_URLS_PER_BATCH = 32;
/** Cap in-memory session tracking to avoid unbounded growth. */
const MAX_SESSION_TRACKED = 120;

/** URLs that finished loading in this session — avoids spinner flash on report refetch. */
const sessionLoadedUrls = new Set<string>();

export function markVinImageSessionLoaded(url: string): void {
  if (!url) return;
  if (sessionLoadedUrls.size >= MAX_SESSION_TRACKED && !sessionLoadedUrls.has(url)) {
    const oldest = sessionLoadedUrls.values().next().value;
    if (oldest) sessionLoadedUrls.delete(oldest);
  }
  sessionLoadedUrls.add(url);
}

export function isVinImageSessionLoaded(url: string): boolean {
  return sessionLoadedUrls.has(url);
}

function canUseCacheApi(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

function isProxiedVinImage(url: string): boolean {
  return url.includes("/api/vin/image");
}

/** Warm browser cache for VIN gallery URLs (same-origin proxied images). */
export async function prefetchVinImages(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(isProxiedVinImage))].slice(0, MAX_URLS_PER_BATCH);
  if (unique.length === 0) return;

  let cache: Cache | null = null;
  if (canUseCacheApi()) {
    try {
      cache = await caches.open(CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  const warmOne = async (url: string) => {
    try {
      if (cache && (await cache.match(url))) {
        markVinImageSessionLoaded(url);
        return;
      }
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) return;
      markVinImageSessionLoaded(url);
      if (cache) {
        try {
          await cache.put(url, response.clone());
        } catch {
          // private mode / quota — session flag still suppresses spinner
        }
      }
    } catch {
      // ignore individual prefetch failures
    }
  };

  await warmOne(unique[0]!);

  const rest = unique.slice(1);
  for (let i = 0; i < rest.length; i += PREFETCH_CONCURRENCY) {
    await Promise.all(rest.slice(i, i + PREFETCH_CONCURRENCY).map(warmOne));
  }
}

export async function clearVinImageBrowserCache(): Promise<void> {
  if (!canUseCacheApi()) return;
  sessionLoadedUrls.clear();
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // ignore
  }
}
