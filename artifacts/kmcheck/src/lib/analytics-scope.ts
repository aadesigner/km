const ADMIN_PATH_RE = /^\/adminx(\/|$)/;

/** Public marketing + signed-in client routes only — never the admin panel. */
export function isPublicAnalyticsPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/$/, "") || "/";
  return !ADMIN_PATH_RE.test(path);
}

/** Remove GTM/GA tags injected by SiteAnalytics (e.g. when leaving the public shell). */
export function removeInjectedAnalytics(): void {
  document
    .querySelectorAll(
      "script[data-kmcheck-gtm-head], script[data-kmcheck-ga-loader], script[data-kmcheck-ga-config]",
    )
    .forEach((el) => el.remove());
  document.querySelectorAll("noscript[data-kmcheck-gtm-body]").forEach((el) => el.remove());
}
