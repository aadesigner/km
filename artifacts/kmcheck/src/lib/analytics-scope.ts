const ADMIN_PATH_RE = /^\/adminx(\/|$)/;
/** Signed-in client area — skip heavy third-party scripts (GTM/Clarity). Checkout stays tracked. */
const CLIENT_AREA_PATH_RE = /^\/[a-z]{2}\/(dashboard|purchases)(\/|$)/;

function normalizePathname(pathname: string): string {
  const raw = (pathname.split("?")[0] ?? pathname).split("#")[0] ?? pathname;
  return raw.replace(/\/$/, "") || "/";
}

/** Public marketing (+ checkout/auth) only — never admin panel or client dashboard shell. */
export function isPublicAnalyticsPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (ADMIN_PATH_RE.test(path)) return false;
  if (CLIENT_AREA_PATH_RE.test(path)) return false;
  return true;
}

/** Remove GTM/GA/Clarity tags injected by SiteAnalytics (e.g. when leaving the public shell). */
export function removeInjectedAnalytics(): void {
  try {
    document
      .querySelectorAll(
        [
          "script[data-kmcheck-gtm-head]",
          "script[data-kmcheck-ga-loader]",
          "script[data-kmcheck-ga-config]",
          "script[data-kmcheck-clarity]",
          'script[src*="googletagmanager.com"]',
          'script[src*="google-analytics.com"]',
          'script[src*="clarity.ms"]',
        ].join(", "),
      )
      .forEach((el) => el.remove());
    document.querySelectorAll("noscript[data-kmcheck-gtm-body]").forEach((el) => el.remove());
    document.querySelectorAll('iframe[src*="googletagmanager.com"]').forEach((el) => el.remove());
  } catch {
    // DOM may be locked by extensions — never crash navigation for cleanup.
  }

  const w = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  };
  try {
    // Clarity/GTM may define non-configurable props — assign undefined instead of delete.
    w.dataLayer = undefined;
    w.gtag = undefined;
    w.clarity = undefined;
  } catch {
    /* ignore */
  }
}
