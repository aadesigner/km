import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { formatImageFlagAlt } from "@/lib/flag-alt";
import { Button } from "@/components/ui/button";

type CountryConfig = {
  slug: string;
  flagCode: string;
  name: string;
  count: string;
  accentFrom: string;
  accentTo: string;
  tint: string;
  highlights: readonly string[];
};

function useHomeCountries(t: (k: string) => string): CountryConfig[] {
  return [
    {
      slug: "usa",
      flagCode: "us",
      name: t("country_usa_name"),
      count: t("country_usa_count"),
      accentFrom: "from-blue-600",
      accentTo: "to-red-500",
      tint: "from-blue-500/[0.07] via-transparent to-red-500/[0.05]",
      highlights: ["home_country_usa_h0", "home_country_usa_h1", "home_country_usa_h2"],
    },
    {
      slug: "korea",
      flagCode: "kr",
      name: t("country_korea_name"),
      count: t("country_korea_count"),
      accentFrom: "from-indigo-600",
      accentTo: "to-red-600",
      tint: "from-indigo-500/[0.07] via-transparent to-red-500/[0.05]",
      highlights: ["home_country_korea_h0", "home_country_korea_h1", "home_country_korea_h2"],
    },
    {
      slug: "canada",
      flagCode: "ca",
      name: t("country_canada_name"),
      count: t("country_canada_count"),
      accentFrom: "from-red-600",
      accentTo: "to-slate-600",
      tint: "from-red-500/[0.07] via-transparent to-slate-500/[0.05]",
      highlights: ["home_country_canada_h0", "home_country_canada_h1", "home_country_canada_h2"],
    },
    {
      slug: "china",
      flagCode: "cn",
      name: t("country_china_name"),
      count: t("country_china_count"),
      accentFrom: "from-red-600",
      accentTo: "to-amber-600",
      tint: "from-red-500/[0.07] via-transparent to-amber-500/[0.05]",
      highlights: ["home_country_china_h0", "home_country_china_h1", "home_country_china_h2"],
    },
    {
      slug: "uae",
      flagCode: "ae",
      name: t("country_uae_name"),
      count: t("country_uae_count"),
      accentFrom: "from-emerald-600",
      accentTo: "to-red-600",
      tint: "from-emerald-500/[0.07] via-transparent to-red-500/[0.05]",
      highlights: ["home_country_uae_h0", "home_country_uae_h1", "home_country_uae_h2"],
    },
  ];
}

function CountryCardLink({
  country,
  language,
  variant,
  t,
  index,
}: {
  country: CountryConfig;
  language: string;
  variant: "featured" | "compact";
  t: (k: string) => string;
  index: number;
}) {
  const isFeatured = variant === "featured";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      className="h-full"
    >
      <Link
        href={`/${language}/cars/${country.slug}`}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
          "hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
        )}
      >
        <div className={cn("h-1 bg-gradient-to-r", country.accentFrom, country.accentTo)} />
        <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", country.tint)} />

        <div
          className={cn(
            "relative z-10 flex flex-1 flex-col",
            isFeatured ? "p-5 md:p-6 lg:p-7" : "p-4 md:p-5",
          )}
        >
          {isFeatured ? (
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5 flex-1">
              <div className="flex items-start gap-3.5 min-w-0 md:max-w-[42%]">
                <img
                  src={`https://flagcdn.com/${country.flagCode}.svg`}
                  alt={formatImageFlagAlt(country.name, t)}
                  width={43}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-auto rounded-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">{country.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {country.count} {t("country_registered_vehicles")}
                  </p>
                </div>
              </div>

              <ul className="flex-1 grid sm:grid-cols-1 gap-2 md:gap-2.5 md:pt-0.5">
                {country.highlights.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground leading-snug">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "hidden md:flex h-11 w-11 rounded-xl bg-gradient-to-br items-center justify-center shrink-0 shadow-sm self-start",
                  country.accentFrom,
                  country.accentTo,
                )}
              >
                <Globe className="h-5 w-5 text-white" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <img
                      src={`https://flagcdn.com/${country.flagCode}.svg`}
                      alt={formatImageFlagAlt(country.name, t)}
                      width={43}
                      height={32}
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-auto rounded-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    />
                    <h3 className="text-lg font-bold tracking-tight">{country.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {country.count} {t("country_registered_vehicles")}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-4 flex-1">
                {country.highlights.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground leading-snug">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold text-primary mt-auto pt-4",
              "group-hover:gap-2.5 transition-[gap] duration-200",
            )}
          >
            <span>{t("vin_check_for")} {country.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomeCountriesCoverageSection() {
  const { t, language } = useTranslation();
  const countries = useHomeCountries(t);
  const featured = countries.slice(0, 2);
  const regional = countries.slice(2);

  return (
    <section className="pt-16 md:pt-24 pb-10 md:pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-12 text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Globe className="h-3.5 w-3.5" />
            {t("stats_countries_badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("countries_title")}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">{t("countries_subtitle")}</p>
        </motion.div>

        <div className="space-y-4 md:space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {featured.map((country, i) => (
              <CountryCardLink
                key={country.slug}
                country={country}
                language={language}
                variant="featured"
                t={t}
                index={i}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {regional.map((country, i) => (
              <CountryCardLink
                key={country.slug}
                country={country}
                language={language}
                variant="compact"
                t={t}
                index={i + 2}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mt-8 md:mt-10 rounded-2xl border border-border/70 bg-gradient-to-br from-muted/40 via-card to-card p-5 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex -space-x-2.5 shrink-0">
                {countries.map((c) => (
                  <img
                    key={c.slug}
                    src={`https://flagcdn.com/${c.flagCode}.svg`}
                    alt=""
                    width={32}
                    height={24}
                    loading="lazy"
                    className="h-7 w-auto rounded-sm ring-2 ring-background shadow-sm"
                  />
                ))}
                <span
                  className="inline-flex h-7 min-w-[1.75rem] px-1.5 items-center justify-center rounded-sm ring-2 ring-background bg-muted text-[10px] font-bold text-muted-foreground"
                  aria-hidden
                >
                  +
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base md:text-lg tracking-tight">{t("stats_countries_badge")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t("stats_countries")}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-xl shrink-0 w-full md:w-auto">
              <Link href={`/${language}/pricing`}>
                {t("get_started")}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
