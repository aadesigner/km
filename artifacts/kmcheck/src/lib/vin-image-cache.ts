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

function hintPreloadImage(url: string): void {
  if (typeof document === "undefined" || !url) return;
  const attr = "data-vin-img-preload";
  if (document.querySelector(`link[${attr}="${CSS.escape(url)}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  link.setAttribute(attr, url);
  document.head.appendChild(link);
}

/** Decode a URL through the browser image pipeline (uses HTTP cache when warm). */
export function warmVinImage(url: string): Promise<void> {
  if (!url || typeof window === "undefined") return Promise.resolve();
  if (isVinImageSessionLoaded(url)) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    const finish = () => {
      markVinImageSessionLoaded(url);
      resolve();
    };
    img.onload = finish;
    img.onerror = () => resolve();
    img.src = url;
    if (img.complete && img.naturalWidth > 0) finish();
  });
}

/** Warm a small set of gallery neighbors (hero slider / lightbox). */
export async function warmVinImageNeighbors(urls: string[], centerIndex: number, radius = 2): Promise<void> {
  if (urls.length === 0) return;
  const n = urls.length;
  const indices = new Set<number>();
  for (let offset = 0; offset <= radius; offset++) {
    indices.add(((centerIndex + offset) % n + n) % n);
    if (offset > 0) indices.add(((centerIndex - offset) % n + n) % n);
  }
  const targets = [...indices].map((i) => urls[i]).filter((u): u is string => !!u);
  await warmVinImages(targets);
}

export async function warmVinImages(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter((u) => typeof u === "string" && u.length > 0))];
  if (unique.length === 0) return;

  const priority = unique.slice(0, 2);
  const rest = unique.slice(2);
  await Promise.all(priority.map((url) => warmVinImage(url)));

  for (let i = 0; i < rest.length; i += PREFETCH_CONCURRENCY) {
    await Promise.all(rest.slice(i, i + PREFETCH_CONCURRENCY).map((url) => warmVinImage(url)));
  }
}

/** Warm browser cache for VIN gallery URLs (same-origin proxied images). */
export async function prefetchVinImages(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter((u) => typeof u === "string" && u.length > 0))].slice(0, MAX_URLS_PER_BATCH);
  if (unique.length === 0) return;

  hintPreloadImage(unique[0]!);
  void warmVinImage(unique[0]!);

  const proxied = unique.filter(isProxiedVinImage);
  if (proxied.length === 0) {
    await warmVinImages(unique.slice(1));
    return;
  }

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
        await warmVinImage(url);
        return;
      }
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) return;
      if (cache) {
        try {
          await cache.put(url, response.clone());
        } catch {
          // private mode / quota
        }
      }
      await warmVinImage(url);
    } catch {
      // ignore individual prefetch failures
    }
  };

  const priority = proxied.slice(0, 3);
  const rest = proxied.slice(3);
  await Promise.all(priority.map(warmOne));

  for (let i = 0; i < rest.length; i += PREFETCH_CONCURRENCY) {
    await Promise.all(rest.slice(i, i + PREFETCH_CONCURRENCY).map(warmOne));
  }

  const nonProxied = unique.filter((u) => !isProxiedVinImage(u));
  if (nonProxied.length) await warmVinImages(nonProxied);
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
