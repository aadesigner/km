/**
 * Paths the SPA can legitimately render. Unknown HTML routes should get a real 404
 * instead of the English home soft-404 shell.
 *
 * Keep aligned with App.tsx public/admin routes + seo-inject PATH_TO_SEO_KEY.
 */

const LANG_ALT =
  "en|de|es|fr|sq|pl|ro|bg|ar|uk|ru|zh";

/** Exact rest segments under /:lang (no leading slash on empty home). */
const KNOWN_LANG_RESTS = new Set([
  "",
  "pricing",
  "free-vin-decoder",
  "how-it-works",
  "faq",
  "terms",
  "privacy",
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "set-password",
  "dashboard",
  "dashboard/account",
  "dashboard/help",
  "checkout",
  "purchases",
  "maintenance",
  "vin/processing",
]);

const VALID_COUNTRY = new Set(["usa", "korea", "canada", "china", "uae"]);

/** Exact B2B marketing routes (keep aligned with kmcheck INDEXABLE_PATHS / App.tsx). */
const KNOWN_API_B2B_RESTS = new Set([
  "api-b2b",
  "api-b2b/plans",
  "api-b2b/contact",
  "api-b2b/vin-decoder",
  "api-b2b/usa-cars",
  "api-b2b/canada-cars",
  "api-b2b/korea-cars",
  "api-b2b/dubai-cars",
  "api-b2b/china-cars",
]);

const LEGACY_COUNTRY_RE = /^\/(usa|korea|canada)-cars\/?$/i;
const VIN_17_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const LOOKUP_ID_RE = /^\d{1,12}$/;

function stripQuery(pathname: string): string {
  return (pathname.split("?")[0] ?? pathname).replace(/\/+$/, "") || "/";
}

function isKnownApiB2bRest(rest: string): boolean {
  return KNOWN_API_B2B_RESTS.has(rest);
}

/**
 * True when the request path should fall through to the SPA (200).
 * False → respond with HTTP 404 (do not serve English home as soft-404).
 */
export function isKnownSpaPath(pathname: string): boolean {
  const p = stripQuery(pathname);

  if (p === "/" || p === "/index.html") return true;

  if (p === "/adminx" || p.startsWith("/adminx/")) return true;

  if (LEGACY_COUNTRY_RE.test(p)) return true;

  const langHome = p.match(new RegExp(`^/(${LANG_ALT})$`, "i"));
  if (langHome) return true;

  const withLang = p.match(new RegExp(`^/(${LANG_ALT})/(.+)$`, "i"));
  if (withLang) {
    const rest = withLang[2]!.toLowerCase();
    if (KNOWN_LANG_RESTS.has(rest)) return true;
    if (isKnownApiB2bRest(rest)) return true;

    const car = rest.match(/^cars\/([a-z]+)$/);
    if (car && VALID_COUNTRY.has(car[1]!)) return true;

    // Auth catch-all from wouter: /:lang/sign-in/*?
    if (rest.startsWith("sign-in/") || rest.startsWith("sign-up/")) return true;

    const vin = rest.match(/^vin\/([^/]+)$/);
    if (vin) {
      const id = vin[1]!;
      if (id === "processing") return true;
      if (VIN_17_RE.test(id)) return true;
      if (LOOKUP_ID_RE.test(id)) return true;
    }

    return false;
  }

  // Unprefixed paths that the client redirects to /:lang/...
  const unprefixed = p.replace(/^\//, "").toLowerCase();
  if (KNOWN_LANG_RESTS.has(unprefixed)) return true;
  if (isKnownApiB2bRest(unprefixed)) return true;
  const unprefixedCar = unprefixed.match(/^cars\/([a-z]+)$/);
  if (unprefixedCar && VALID_COUNTRY.has(unprefixedCar[1]!)) return true;
  const unprefixedVin = unprefixed.match(/^vin\/([^/]+)$/);
  if (unprefixedVin) {
    const id = unprefixedVin[1]!;
    if (id === "processing") return true;
    if (VIN_17_RE.test(id)) return true;
    if (LOOKUP_ID_RE.test(id)) return true;
  }

  return false;
}
