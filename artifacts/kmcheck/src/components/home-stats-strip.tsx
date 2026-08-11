import { cn } from "@/lib/utils";
import { FlagImg } from "@/components/flag-img";
import { formatImageFlagAlt } from "@/lib/flag-alt";
import { useHomeStats } from "@/lib/home-stats";
import { useTranslation } from "@/i18n/context";
import { PrefetchLink } from "@/components/prefetch-link";

type Props = {
  className?: string;
  desktopAlign?: "center" | "start";
};

export function HomeStatsStrip({ className, desktopAlign = "center" }: Props) {
  const { t, language } = useTranslation();
  const stats = useHomeStats(t);
  const chipsAlign =
    desktopAlign === "start"
      ? "justify-center lg:justify-start"
      : "justify-center";

  return (
    <div className={cn("home-stats-strip relative z-[1]", className)}>
      <span className="sr-only">{t("home_stats_from")}</span>
      <ul className={cn("mx-auto flex flex-wrap items-center gap-1.5 sm:gap-2", chipsAlign)} role="list">
        {stats.map((stat) => {
          const name = t(stat.nameKey);
          return (
            <li key={stat.id} className="relative flex items-center">
              <PrefetchLink
                href={`/${language}/cars/${stat.id}`}
                aria-label={name}
                className={cn(
                  "group relative inline-flex items-center justify-center rounded-full border border-border/60 bg-muted/40 p-1.5",
                  "dark:border-white/10 dark:bg-white/5",
                  "outline-none transition-[background-color,border-color,transform] duration-150 ease-out",
                  "hover:border-border hover:bg-muted/70 dark:hover:border-white/20 dark:hover:bg-white/10",
                  "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "md:hover:-translate-y-0.5",
                )}
              >
                <FlagImg
                  code={stat.flag}
                  variant="list"
                  className="home-stats-flag shrink-0"
                  alt={formatImageFlagAlt(stat.label, t)}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-[calc(100%+0.4rem)] z-20 -translate-x-1/2",
                    "hidden whitespace-nowrap rounded-md border border-border/70 bg-background/95 px-2 py-1",
                    "text-xs font-medium leading-none text-foreground shadow-sm backdrop-blur-sm",
                    "dark:border-white/15 dark:bg-[#0b1220]/95",
                    "opacity-0 transition-[opacity,transform] duration-150 ease-out",
                    "md:block md:translate-y-0.5",
                    "md:group-hover:translate-y-0 md:group-hover:opacity-100",
                    "md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100",
                  )}
                  aria-hidden
                >
                  {name}
                </span>
              </PrefetchLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
