const CACHE_NAME = "kmcheck-vin-images-v1";
const PREFETCH_CONCURRENCY = 3;

function canUseCacheApi(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

function isProxiedVinImage(url: string): boolean {
  return url.includes("/api/vin/image");
}

/** Warm browser cache for VIN gallery URLs (same-origin proxied images). */
export async function prefetchVinImages(urls: string[]): Promise<void> {
  if (!canUseCacheApi()) return;
  const unique = [...new Set(urls.filter(isProxiedVinImage))];
  if (unique.length === 0) return;

  try {
    const cache = await caches.open(CACHE_NAME);

    const warmOne = async (url: string) => {
      if (await cache.match(url)) return;
      try {
        const response = await fetch(url, { credentials: "include" });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // ignore individual prefetch failures
      }
    };

    // Hero photo first — visible immediately on report load.
    await warmOne(unique[0]!);

    const rest = unique.slice(1);
    for (let i = 0; i < rest.length; i += PREFETCH_CONCURRENCY) {
      await Promise.all(rest.slice(i, i + PREFETCH_CONCURRENCY).map(warmOne));
    }
  } catch {
    // ignore cache API errors (private mode, quota, etc.)
  }
}

export async function clearVinImageBrowserCache(): Promise<void> {
  if (!canUseCacheApi()) return;
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // ignore
  }
}
