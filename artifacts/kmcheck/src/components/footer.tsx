import { useEffect, useRef, useState } from "react";
import { PrefetchLink } from "@/components/prefetch-link";
import { useTranslation, ensureDict } from "@/i18n/context";
import { KmcheckLogo } from "@/components/logo";
import { ChevronUp } from "lucide-react";
import { setStoredLangPreference } from "@/lib/lang-preference";
import { LANG_PICKER_OPTIONS, isSupportedLang, type Language } from "@/lib/languages";
import { FlagImg, prefetchFlags } from "@/components/flag-img";
import { LangPickerList, usePrefetchPickerFlags } from "@/components/lang-picker-list";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const LANGS = LANG_PICKER_OPTIONS.map((l) => ({
  code: l.code,
  label: l.label,
  img: l.flag,
}));

const COUNTRY_FOOTER_COLUMNS = [
  {
    code: "us",
    slug: "usa",
    headingKey: "footer_usa_heading",
    linkKeys: [
      "footer_usa_link_1",
      "footer_usa_link_2",
      "footer_usa_link_3",
      "footer_usa_link_4",
    ],
  },
  {
    code: "kr",
    slug: "korea",
    headingKey: "footer_korea_heading",
    linkKeys: [
      "footer_korea_link_1",
      "footer_korea_link_2",
      "footer_korea_link_3",
      "footer_korea_link_4",
    ],
  },
  {
    code: "ca",
    slug: "canada",
    headingKey: "footer_canada_heading",
    linkKeys: [
      "footer_canada_link_1",
      "footer_canada_link_2",
      "footer_canada_link_3",
      "footer_canada_link_4",
    ],
  },
  {
    code: "cn",
    slug: "china",
    headingKey: "footer_china_heading",
    linkKeys: [
      "footer_china_link_1",
      "footer_china_link_2",
      "footer_china_link_3",
      "footer_china_link_4",
    ],
  },
  {
    code: "ae",
    slug: "uae",
    headingKey: "footer_uae_heading",
    linkKeys: [
      "footer_uae_link_1",
      "footer_uae_link_2",
      "footer_uae_link_3",
      "footer_uae_link_4",
    ],
  },
] as const;

const COMPANY_LINKS = [
  { path: "how-it-works", labelKey: "nav_how_it_works" },
  { path: "pricing", labelKey: "pricing" },
  { path: "faq", labelKey: "nav_faq" },
  { path: "free-vin-decoder", labelKey: "free_decoder_nav_link" },
  { path: "dashboard", labelKey: "my_reports" },
] as const;

const LEGAL_LINKS = [
  { href: (lang: string) => `/${lang}/terms`, labelKey: "terms" },
  { href: (lang: string) => `/${lang}/privacy`, labelKey: "privacy" },
  { href: (lang: string) => `/${lang}/privacy#cookies`, labelKey: "cookies" },
] as const;

const FOOTER_FLAG_CODES = COUNTRY_FOOTER_COLUMNS.map((c) => c.code);

export function Footer() {
  const { t, language, setLanguage } = useTranslation();
  const [location, setLocation] = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];

  usePrefetchPickerFlags(langOpen);

  useEffect(() => {
    prefetchFlags(FOOTER_FLAG_CODES);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (langRef.current?.contains(e.target as Node)) return;
      setLangOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [langOpen]);

  const handleLanguageChange = (lang: string) => {
    if (!isSupportedLang(lang)) return;
    const next: Language = lang;
    const newPath = location.replace(new RegExp(`^/${language}(/|$)`), `/${next}$1`);
    const target = newPath === location ? `/${next}` : newPath;
    void ensureDict(next).then(() => {
      setStoredLangPreference(next);
      setLanguage(next);
      setLocation(target);
      setLangOpen(false);
    });
  };

  const seoLinkCls =
    "text-[13px] leading-snug text-white/45 transition-colors hover:text-white/90";

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#060a12] text-white print:hidden">
      <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 lg:col-span-3">
            <PrefetchLink href={`/${language}`} className="inline-flex group">
              <KmcheckLogo variant="dark" className="h-8 transition-opacity group-hover:opacity-90" />
            </PrefetchLink>
            <p className="max-w-[240px] text-[12px] leading-relaxed text-white/38">
              {t("footer_tagline")}
            </p>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                {t("footer_language")}
              </p>
              <div ref={langRef} className="relative inline-block">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={langOpen}
                  aria-label={current.label}
                  onClick={() => setLangOpen((v) => !v)}
                  className={cn(
                    "inline-flex min-w-[11rem] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    langOpen
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20",
                  )}
                >
                  <FlagImg code={current.img} size={14} priority />
                  <span className="flex-1 truncate text-left font-medium">{current.label}</span>
                  <ChevronUp
                    className={cn("h-3 w-3 opacity-50 transition-transform", langOpen && "rotate-180")}
                  />
                </button>
                {langOpen && (
                  <div
                    role="listbox"
                    className="absolute bottom-full right-0 z-30 mb-2 w-[18rem] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#0b1019] p-1.5 shadow-xl"
                  >
                    <LangPickerList language={language} tone="footer" onSelect={handleLanguageChange} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav
            aria-label={t("footer_countries")}
            className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-5 md:gap-x-6 lg:col-span-7 lg:gap-x-8 xl:gap-x-10"
          >
            {COUNTRY_FOOTER_COLUMNS.map(({ code, slug, headingKey, linkKeys }) => (
              <div key={slug} className="min-w-0 space-y-3.5">
                <PrefetchLink
                  href={`/${language}/cars/${slug}`}
                  className="group inline-flex max-w-full items-center gap-2.5"
                >
                  <FlagImg code={code} size={18} className="shrink-0 rounded-[2px]" />
                  <span className="truncate text-sm font-semibold text-white/78 transition-colors group-hover:text-white">
                    {t(headingKey)}
                  </span>
                </PrefetchLink>
                <ul className="space-y-2.5">
                  {linkKeys.map((labelKey) => (
                    <li key={labelKey}>
                      <PrefetchLink href={`/${language}/cars/${slug}`} className={seoLinkCls}>
                        {t(labelKey)}
                      </PrefetchLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <nav aria-label={t("footer_company")} className="space-y-3 lg:col-span-2 lg:justify-self-end lg:min-w-[9.5rem]">
            <p className="text-[13px] font-semibold text-white/72">{t("footer_company")}</p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map(({ path, labelKey }) => (
                <li key={path}>
                  <PrefetchLink href={`/${language}/${path}`} className={seoLinkCls}>
                    {t(labelKey)}
                  </PrefetchLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row">
          <p className="text-[11px] text-white/28">
            © {new Date().getFullYear()} kmcheck.com · {t("footer_rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map(({ href, labelKey }) => (
              <PrefetchLink
                key={labelKey}
                href={href(language)}
                className="text-[11px] text-white/35 transition-colors hover:text-white/75"
              >
                {t(labelKey)}
              </PrefetchLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
