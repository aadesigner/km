import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { AnimatePresence, motion } from "framer-motion";

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
  { path: "api-b2b", labelKey: "footer_api_b2b" },
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
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });

  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];

  usePrefetchPickerFlags(langOpen);

  useEffect(() => {
    prefetchFlags(FOOTER_FLAG_CODES);
  }, []);

  useEffect(() => {
    if (!langOpen || !langBtnRef.current) return;
    const place = () => {
      const rect = langBtnRef.current!.getBoundingClientRect();
      setPos({
        bottom: window.innerHeight - rect.top + 10,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 18 * 16 - 12)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [langOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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
    <footer className="relative mt-auto overflow-hidden border-t border-white/[0.07] bg-[#060a12] text-white print:hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-sky-500/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-11 md:py-14">
        <div className="grid gap-11 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 lg:col-span-3">
            <PrefetchLink href={`/${language}`} className="inline-flex group">
              <KmcheckLogo variant="dark" className="h-9 md:h-10 transition-opacity group-hover:opacity-90" />
            </PrefetchLink>
            <p className="max-w-[260px] text-[12.5px] leading-relaxed text-white/40">
              {t("footer_tagline")}
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
                {t("footer_language")}
              </p>
              <button
                ref={langBtnRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label={current.label}
                onClick={() => setLangOpen((v) => !v)}
                className={cn(
                  "inline-flex min-w-[12rem] items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all",
                  langOpen
                    ? "border-primary/45 bg-primary/15 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
                    : "border-white/12 bg-white/[0.04] text-white/75 hover:border-white/22 hover:bg-white/[0.06]",
                )}
              >
                <FlagImg code={current.img} size={16} priority />
                <span className="flex-1 truncate text-left font-medium">{current.label}</span>
                <ChevronUp
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 opacity-55 transition-transform duration-200",
                    langOpen && "translate-y-px",
                  )}
                />
              </button>

              {typeof document !== "undefined"
                ? createPortal(
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div
                        className="fixed inset-0 z-[90]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onMouseDown={() => setLangOpen(false)}
                      >
                        <motion.div
                          role="listbox"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="absolute w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/12 bg-[#0c121c] p-1.5 shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.65)]"
                          style={{ bottom: pos.bottom, left: pos.left }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="max-h-[min(20rem,50vh)] overflow-y-auto">
                            <LangPickerList
                              language={language}
                              tone="footer"
                              onSelect={handleLanguageChange}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body,
                )
                : null}
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
                  <FlagImg code={code} size={18} className="shrink-0 rounded-[2px] shadow-sm" />
                  <span className="truncate text-sm font-semibold text-white/80 transition-colors group-hover:text-white">
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

          <nav aria-label={t("footer_company")} className="space-y-3 lg:col-span-2 lg:min-w-[9.5rem] lg:justify-self-end">
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

        <div className="mt-11 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 sm:flex-row">
          <p className="text-[11px] text-white/30">
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
