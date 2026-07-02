import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export const CHUNK_RELOAD_KEY = "kmcheck-chunk-reload";

const CHUNK_RETRY_DELAY_MS = 350;

/**
 * React.lazy wrapper that retries once and reloads the page on stale chunk errors
 * (common after deploy when the user still has an old bundle open).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importWithInlineRetry(factory);
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

async function importWithInlineRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (firstError) {
    if (!isChunkLoadError(firstError)) throw firstError;
    await sleep(CHUNK_RETRY_DELAY_MS);
    return await factory();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();
  const name = error instanceof Error ? error.name : "";
  return (
    name === "ChunkLoadError"
    || lower.includes("failed to fetch dynamically imported module")
    || lower.includes("importing a module script failed")
    || lower.includes("error loading dynamically imported module")
    || lower.includes("unable to preload css")
    || lower.includes("loading chunk")
    || lower.includes("loading css chunk")
  );
}

/** One-shot full page reload when a lazy chunk fails outside React.lazy (e.g. dynamic import in charts). */
export function installChunkLoadRecovery(): void {
  if (typeof window === "undefined") return;

  const tryReload = (error: unknown) => {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
    if (!isChunkLoadError(error)) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryReload(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryReload(event.reason);
  });
}
