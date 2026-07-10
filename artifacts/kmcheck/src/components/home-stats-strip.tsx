import { cn } from "@/lib/utils";
import { FlagImg } from "@/components/flag-img";
import { useHomeStats } from "@/lib/home-stats";
import { useTranslation } from "@/i18n/context";

type Props = {
  className?: string;
  /** On lg+ align strip with left column copy; mobile stays centered */
  desktopAlign?: "center" | "start";
};

export function HomeStatsStrip({ className, desktopAlign = "center" }: Props) {
  const { t } = useTranslation();
  const stats = useHomeStats(t);
  const rowClass =
    desktopAlign === "start"
      ? "mx-auto lg:mx-0 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2"
      : "mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2";

  return (
    <div className={cn("home-stats-strip relative z-[1] pt-1 sm:pt-1.5", className)}>
      <div className={rowClass}>
        <span className="text-[11px] sm:text-xs font-medium text-muted-foreground/55 dark:text-white/40 shrink-0">
          {t("home_stats_from")}
        </span>
        <ul
          className={cn(
            "flex flex-wrap items-center gap-1.5 sm:gap-2",
            desktopAlign === "start" ? "justify-center lg:justify-start" : "justify-center",
          )}
          role="list"
        >
          {stats.map((stat) => (
            <li key={stat.id} className="flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] sm:text-xs dark:border-white/10 dark:bg-white/5">
                <FlagImg code={stat.flag} variant="list" className="home-stats-flag" />
                <span className="font-semibold tracking-tight text-foreground">{stat.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
