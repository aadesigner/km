import { cn } from "@/lib/utils";
import { FlagImg } from "@/components/flag-img";
import { CountryFlagTooltip } from "@/components/country-flag-tooltip";
import { useHomeStats } from "@/lib/home-stats";
import { useTranslation } from "@/i18n/context";
import { TooltipProvider } from "@/components/ui/tooltip";

type Props = {
  className?: string;
  desktopAlign?: "center" | "start";
};

export function HomeStatsStrip({ className, desktopAlign = "center" }: Props) {
  const { t } = useTranslation();
  const stats = useHomeStats(t);
  const chipsAlign =
    desktopAlign === "start"
      ? "justify-center lg:justify-start"
      : "justify-center";

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className={cn("home-stats-strip relative z-[1]", className)}>
        <span className="sr-only">{t("home_stats_from")}</span>
        <ul className={cn("mx-auto flex flex-wrap items-center gap-1.5 sm:gap-2", chipsAlign)} role="list">
          {stats.map((stat) => (
            <li key={stat.id} className="flex items-center">
              <CountryFlagTooltip
                nameKey={stat.nameKey}
                className="min-w-[3.25rem] flex-col gap-1 rounded-2xl border border-border/60 bg-muted/40 px-2 py-1.5 sm:min-w-0 sm:flex-row sm:gap-0 sm:rounded-full sm:p-1.5 dark:border-white/10 dark:bg-white/5"
              >
                <FlagImg code={stat.flag} variant="list" className="home-stats-flag" />
                <span className="text-[10px] font-medium leading-none text-muted-foreground sm:sr-only">
                  {stat.label}
                </span>
              </CountryFlagTooltip>
            </li>
          ))}
        </ul>
      </div>
    </TooltipProvider>
  );
}
