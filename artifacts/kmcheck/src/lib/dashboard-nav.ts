export type DashboardView = "reports" | "account" | "help";

export type ClientAreaSection = DashboardView | "purchases" | "offers";

/** Strip trailing slash for stable path comparisons. */
export function normalizeClientPath(path: string): string {
  const trimmed = path.split("?")[0]?.split("#")[0]?.trim() ?? "";
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "");
}

export function dashboardPath(lang: string, view: DashboardView = "reports"): string {
  const base = `/${lang}/dashboard`;
  return view === "reports" ? base : `${base}/${view}`;
}

export function parseDashboardView(location: string, lang: string): DashboardView {
  const path = normalizeClientPath(location);
  const base = `/${lang}/dashboard`;
  if (path === `${base}/account`) return "account";
  if (path === `${base}/help`) return "help";
  return "reports";
}

export function isDashboardLocation(location: string, lang: string): boolean {
  const path = normalizeClientPath(location);
  const base = `/${lang}/dashboard`;
  return path === base || path.startsWith(`${base}/`);
}

export function isPurchasesLocation(location: string, lang: string): boolean {
  const path = normalizeClientPath(location);
  return path === `/${lang}/purchases` || path.startsWith(`/${lang}/purchases/`);
}

export function isOffersLocation(location: string, lang: string): boolean {
  const path = normalizeClientPath(location);
  return path === `/${lang}/pricing` || path.startsWith(`/${lang}/pricing/`)
    || path === `/${lang}/credits/checkout` || path.startsWith(`/${lang}/credits/`);
}

export function parseClientAreaSection(location: string, lang: string): ClientAreaSection {
  if (isOffersLocation(location, lang)) return "offers";
  if (isPurchasesLocation(location, lang)) return "purchases";
  return parseDashboardView(location, lang);
}
