import React from "react";
import { Link, useLocation } from "wouter";
import { PrefetchLink } from "@/components/prefetch-link";
import { useTranslation, ensureDict } from "@/i18n/context";
import { KmcheckLogo } from "@/components/logo";
import { ShieldCheck, Zap, RotateCcw, Star, Car } from "lucide-react";
import { setStoredLangPreference } from "@/lib/lang-preference";
import { cn } from "@/lib/utils";

function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  const height = Math.max(8, Math.round(size * 0.75));
  return (
    <img
      src={`https://flagcdn.com/${size}x${height}/${code}.png`}
      width={size}
      height={height}
      alt=""
      loading="lazy"
      decoding="async"
      className="rounded-[2px] object-cover shrink-0"
    />
  );
}

const LANGS = [
  { code: "en", label: "EN", img: "gb", full: "English" },
  { code: "es", label: "ES", img: "es", full: "Español" },
  { code: "sq", label: "SQ", img: "al", full: "Shqip" },
  { code: "ro", label: "RO", img: "ro", full: "Română" },
  { code: "pl", label: "PL", img: "pl", full: "Polski" },
  { code: "ar", label: "AR", img: "sa", full: "العربية" },
  { code: "uk", label: "UK", img: "ua", full: "Українська" },
  { code: "ru", label: "RU", img: "ru", full: "Русский" },
];

const TRUST: { icon: React.ElementType; key: string; color: string; fill?: true }[] = [
  { icon: ShieldCheck, key: "trust_secure_payment", color: "text-primary" },
  { icon: Zap, key: "trust_instant_report", color: "text-blue-400" },
  { icon: RotateCcw, key: "trust_money_back", color: "text-amber-400" },
  { icon: Star, key: "trust_rating", color: "text-yellow-400", fill: true },
];

const COUNTRY_FOOTER_COLUMNS = [
  { code: "us", slug: "usa", headingKey: "footer_usa_heading", linkKeys: ["footer_usa_link_1", "footer_usa_link_2", "footer_usa_link_3", "footer_usa_link_4"] },
  { code: "kr", slug: "korea", headingKey: "footer_korea_heading", linkKeys: ["footer_korea_link_1", "footer_korea_link_2", "footer_korea_link_3", "footer_korea_link_4"] },
  { code: "ca", slug: "canada", headingKey: "footer_canada_heading", linkKeys: ["footer_canada_link_1", "footer_canada_link_2", "footer_canada_link_3", "footer_canada_link_4"] },
] as const;

const LEGAL_LINKS = [
  { href: (lang: string) => `/${lang}/terms`, labelKey: "terms" },
  { href: (lang: string) => `/${lang}/privacy`, labelKey: "privacy" },
  { href: (lang: string) => `/${lang}/privacy#cookies`, labelKey: "cookies" },
] as const;

export function Footer() {
  const { t, language, setLanguage } = useTranslation();
  const [location, setLocation] = useLocation();

  const handleLanguageChange = (lang: string) => {
    const next = lang as "en" | "es" | "uk" | "ru" | "ro" | "pl" | "ar" | "sq";
    const newPath = location.replace(new RegExp(`^/${language}(/|$)`), `/${next}$1`);
    const target = newPath === location ? `/${next}` : newPath;
    void ensureDict(next).then(() => {
      setStoredLangPreference(next);
      setLanguage(next);
      setLocation(target);
    });
  };

  const footerLink =
    "text-[13px] text-white/42 hover:text-white transition-colors duration-200 leading-snug";

  return (
    <footer className="relative bg-[#080c18] text-white mt-auto print:hidden overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(34,197,94,0.05),transparent)]" />

      <div className="relative border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
            {TRUST.map(({ icon: Icon, key, color, fill }) => (
              <span
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium text-white/55"
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", color, fill && "fill-yellow-400")} />
                {t(key as Parameters<typeof t>[0])}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-5 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <PrefetchLink href={`/${language}`} className="inline-flex items-center group">
              <KmcheckLogo variant="dark" className="h-9 group-hover:opacity-90 transition-opacity" />
            </PrefetchLink>

            <p className="text-[13px] text-white/38 leading-relaxed max-w-[220px]">
              {t("footer_tagline")}
            </p>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                {t("footer_language")}
              </p>
              <div className="grid grid-cols-4 gap-1.5 max-w-[9.5rem]">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    title={l.full}
                    aria-label={l.full}
                    aria-pressed={language === l.code}
                    className={cn(
                      "flex items-center p-1.5 rounded-lg border transition-all duration-150",
                      language === l.code
                        ? "bg-primary/15 border-primary/40 ring-1 ring-primary/20"
                        : "border-white/[0.1] hover:border-white/22 hover:bg-white/[0.04]",
                    )}
                  >
                    <FlagImg code={l.img} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-8 lg:pr-4">
            {COUNTRY_FOOTER_COLUMNS.map(({ code, slug, headingKey, linkKeys }) => (
              <div key={slug} className="space-y-5">
                <div className="flex items-center gap-2">
                  <FlagImg code={code} />
                  <h3 className="text-[13px] font-semibold text-white/70">{t(headingKey)}</h3>
                </div>
                <ul className="space-y-3">
                  {linkKeys.map((labelKey) => (
                    <li key={labelKey}>
                      <Link
                        href={`/${language}/cars/${slug}`}
                        className={cn(footerLink, "group flex items-start gap-1.5")}
                      >
                        <Car className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                        {t(labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3 lg:justify-self-end space-y-5 min-w-[10rem]">
            <h3 className="text-[13px] font-semibold text-white/70">{t("footer_company")}</h3>
            <ul className="space-y-3">
              {[
                { href: `/${language}/how-it-works`, label: t("nav_how_it_works") },
                { href: `/${language}/pricing`, label: t("pricing") },
                { href: `/${language}/free-vin-decoder`, label: t("free_decoder_nav_link") },
                { href: `/${language}/dashboard`, label: t("my_reports") },
              ].map(({ href, label }) => (
                <li key={href}>
                  <PrefetchLink href={href} className={footerLink}>
                    {label}
                  </PrefetchLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/22">
            © {new Date().getFullYear()} kmcheck.com · {t("footer_rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-[11px]">
            {LEGAL_LINKS.map(({ href, labelKey }) => (
              <PrefetchLink
                key={labelKey}
                href={href(language)}
                className="text-white/35 hover:text-white/80 transition-colors"
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
