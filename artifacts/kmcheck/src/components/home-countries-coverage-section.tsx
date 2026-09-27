import { Link } from "wouter";
import { EnterReveal } from "@/components/enter-reveal";
import { ArrowRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { FlagImg } from "@/components/flag-img";
import { formatImageFlagAlt } from "@/lib/flag-alt";

type Market = {
  slug: string;
  flagCode: string;
  nameKey: string;
  hintKey: string;
  countKey: string;
};

const MARKETS: Market[] = [
  { slug: "usa", flagCode: "us", nameKey: "country_usa_name", hintKey: "home_country_usa_h0", countKey: "country_usa_count" },
  { slug: "korea", flagCode: "kr", nameKey: "country_korea_name", hintKey: "home_country_korea_h0", countKey: "country_korea_count" },
  { slug: "canada", flagCode: "ca", nameKey: "country_canada_name", hintKey: "home_country_canada_h0", countKey: "country_canada_count" },
  { slug: "china", flagCode: "cn", nameKey: "country_china_name", hintKey: "home_country_china_h0", countKey: "country_china_count" },
  { slug: "japan", flagCode: "jp", nameKey: "country_japan_name", hintKey: "home_country_japan_h0", countKey: "country_japan_count" },
  { slug: "uae", flagCode: "ae", nameKey: "country_uae_name", hintKey: "home_country_uae_h0", countKey: "country_uae_count" },
];

export function HomeCountriesCoverageSection() {
  const { t, language } = useTranslation();

  return (
    <section className="pt-16 md:pt-24 pb-10 md:pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <EnterReveal inView y={12} className="mb-8 md:mb-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Globe className="h-3.5 w-3.5" />
            {t("stats_countries_badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("countries_title")}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">{t("countries_subtitle")}</p>
        </EnterReveal>

        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {MARKETS.map((m) => (
            <Link
              key={m.slug}
              href={`/${language}/cars/${m.slug}`}
              className={cn(
                "group flex items-center gap-3.5 px-4 py-3.5 sm:px-5",
                "hover:bg-primary/5 transition-colors",
              )}
            >
              <FlagImg
                code={m.flagCode}
                size={28}
                className="h-5 w-auto rounded-[2px] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                alt={formatImageFlagAlt(t(m.nameKey), t)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-tight text-foreground">{t(m.nameKey)}</p>
                <p className="truncate text-xs text-muted-foreground">{t(m.hintKey)}</p>
              </div>
              <span className="hidden sm:inline text-[12px] tabular-nums text-muted-foreground">
                {t(m.countKey)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
