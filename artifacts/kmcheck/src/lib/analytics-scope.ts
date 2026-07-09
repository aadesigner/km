const ADMIN_PATH_RE = /^\/adminx(\/|$)/;

function normalizePathname(pathname: string): string {
  const raw = (pathname.split("?")[0] ?? pathname).split("#")[0] ?? pathname;
  return raw.replace(/\/$/, "") || "/";
}

/** Public marketing + signed-in client routes only — never the admin panel. */
export function isPublicAnalyticsPath(pathname: string): boolean {
  return !ADMIN_PATH_RE.test(normalizePathname(pathname));
}

/** Remove GTM/GA tags injected by SiteAnalytics (e.g. when leaving the public shell). */
export function removeInjectedAnalytics(): void {
  document
    .querySelectorAll(
      [
        "script[data-kmcheck-gtm-head]",
        "script[data-kmcheck-ga-loader]",
        "script[data-kmcheck-ga-config]",
        'script[src*="googletagmanager.com"]',
        'script[src*="google-analytics.com"]',
      ].join(", "),
    )
    .forEach((el) => el.remove());
  document.querySelectorAll("noscript[data-kmcheck-gtm-body]").forEach((el) => el.remove());
  document.querySelectorAll('iframe[src*="googletagmanager.com"]').forEach((el) => el.remove());

  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  delete w.dataLayer;
  delete w.gtag;
}
