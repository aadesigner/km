import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ensureDict } from "@/i18n/context";
import type { Language } from "@/i18n/context";
import {
  extractPathLang,
  getStoredLangPreference,
  isGeoLanguageEvaluated,
  isGeoRedirectExemptPath,
  markGeoLanguageEvaluated,
  replacePathLang,
} from "@/lib/lang-preference";
import { fetchGeoLanguageHint, geoRedirectTarget } from "@/lib/geo-language-client";

/**
 * Client-side geo language redirect — SEO-safe:
 * - Runs once per browser after landing on /en/… (localStorage flag)
 * - Skips when user has a stored language preference
 * - Skips root `/` (handled by RootLangRedirect in App.tsx)
 * - Deferred via requestIdleCallback (no render blocking)
 * - Server skips crawlers; no HTTP 302 by IP
 */
export function GeoLanguageRedirect() {
  const [location, setLocation] = useLocation();
  const inFlightForPath = useRef<string | null>(null);

  useEffect(() => {
    const pathname = location.split("?")[0] ?? location;
    if (pathname === "/" || pathname === "") return;
    if (isGeoRedirectExemptPath(pathname)) return;

    const urlLang = extractPathLang(pathname);
    if (!urlLang) return;

    if (getStoredLangPreference()) return;
    if (isGeoLanguageEvaluated()) return;

    if (urlLang !== "en") {
      markGeoLanguageEvaluated();
      return;
    }

    if (inFlightForPath.current === pathname) return;
    inFlightForPath.current = pathname;

    const run = () => {
      void (async () => {
        try {
          const data = await fetchGeoLanguageHint();
          if (!data) {
            inFlightForPath.current = null;
            return;
          }

          const target = geoRedirectTarget(data, urlLang as Language);
          if (!target) {
            markGeoLanguageEvaluated();
            return;
          }

          markGeoLanguageEvaluated();
          await ensureDict(target);
          const newPath = replacePathLang(pathname, urlLang as Language, target);
          const search = typeof window !== "undefined" ? window.location.search : "";
          const hash = typeof window !== "undefined" ? window.location.hash : "";
          setLocation(`${newPath}${search}${hash}`, { replace: true });
        } catch {
          inFlightForPath.current = null;
        }
      })();
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      window.setTimeout(run, 1);
    }
  }, [location, setLocation]);

  return null;
}
