import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export const CHUNK_RELOAD_KEY = "kmcheck-chunk-reload";

const CHUNK_RETRY_DELAY_MS = 350;
/** Soft full-page reloads after deploy / stale chunks — capped to avoid loops. */
const CHUNK_RELOAD_MAX = 2;
const CHUNK_RELOAD_WINDOW_MS = 120_000;

type ChunkReloadState = { count: number; at: number };

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
      if (shouldAttemptChunkReload()) {
        triggerChunkReload();
        return new Promise(() => {});
      }
      clearChunkReloadState();
      throw error;
    }
  });
}

async function importWithInlineRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  try {
    const result = await factory();
    clearChunkReloadState();
    return result;
  } catch (firstError) {
    if (!isChunkLoadError(firstError)) throw firstError;
    await sleep(CHUNK_RETRY_DELAY_MS);
    const result = await factory();
    clearChunkReloadState();
    return result;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readChunkReloadState(): ChunkReloadState | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!raw) return null;
    if (raw === "1") return { count: 1, at: Date.now() };
    const parsed = JSON.parse(raw) as Partial<ChunkReloadState>;
    if (typeof parsed.count !== "number" || typeof parsed.at !== "number") return null;
    return { count: parsed.count, at: parsed.at };
  } catch {
    return null;
  }
}

function writeChunkReloadState(state: ChunkReloadState): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(state));
  } catch { /* private browsing */ }
}

/** True when a full-page reload may still help recover a stale/missing chunk. */
export function shouldAttemptChunkReload(): boolean {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const state = readChunkReloadState();
  if (!state) {
    writeChunkReloadState({ count: 1, at: now });
    return true;
  }
  if (now - state.at > CHUNK_RELOAD_WINDOW_MS) {
    writeChunkReloadState({ count: 1, at: now });
    return true;
  }
  if (state.count >= CHUNK_RELOAD_MAX) return false;
  writeChunkReloadState({ count: state.count + 1, at: state.at });
  return true;
}

export function clearChunkReloadState(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch { /* private browsing */ }
}

function triggerChunkReload(): void {
  window.location.reload();
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
    // Server returned index.html (SPA fallback) for a missing .js chunk after deploy.
    || lower.includes("unexpected token '<'")
    || lower.includes("expected a javascript")
    || (lower.includes("mime") && lower.includes("text/html"))
    || (lower.includes("failed") && lower.includes("module"))
  );
}

/** One-shot full page reload when a lazy chunk fails outside React.lazy (e.g. dynamic import in charts). */
let chunkRecoveryInstalled = false;

export function installChunkLoadRecovery(): void {
  if (typeof window === "undefined" || chunkRecoveryInstalled) return;
  chunkRecoveryInstalled = true;

  const tryReload = (error: unknown) => {
    if (!isChunkLoadError(error)) return;
    if (!shouldAttemptChunkReload()) return;
    triggerChunkReload();
  };

  window.addEventListener("error", (event) => {
    tryReload(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryReload(event.reason);
  });
}
