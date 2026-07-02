import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_RELOAD_KEY = "kmcheck-chunk-reload";

/**
 * React.lazy wrapper that retries once and reloads the page on stale chunk errors
 * (common after deploy when the user still has an old bundle open).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      const reloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
      if (!reloaded && isChunkLoadError(error)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }
  });
}

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module")
    || msg.includes("importing a module script failed")
    || msg.includes("error loading dynamically imported module")
  );
}
