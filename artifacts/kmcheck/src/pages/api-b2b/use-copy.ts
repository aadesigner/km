/**
 * B2B copy helpers — always prefer URL lang over i18n state lag.
 */
import { useLocation } from "wouter";
import { useTranslation } from "@/i18n/context";
import { isSupportedLang, LANG_PATH_ALT, type Language } from "@/lib/languages";
import { getB2bCopy, type B2bCopy } from "./copy";

export function useApiB2bLang(): Language {
  const [location] = useLocation();
  const pathname = location.split("?")[0] ?? location;
  const m = pathname.match(new RegExp(`^/(${LANG_PATH_ALT})(/|$)`));
  if (m?.[1] && isSupportedLang(m[1])) return m[1];
  const { language } = useTranslation();
  if (isSupportedLang(language)) return language;
  return "en";
}

export function useApiB2bCopy(): { lang: Language; c: B2bCopy; base: string; decoderHref: string } {
  const lang = useApiB2bLang();
  return {
    lang,
    c: getB2bCopy(lang),
    base: `/${lang}/api-b2b`,
    decoderHref: `/${lang}/free-vin-decoder`,
  };
}
