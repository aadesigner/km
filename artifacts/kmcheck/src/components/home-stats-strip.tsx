import { cn } from "@/lib/utils";
import { useHomeStats } from "@/lib/home-stats";
import { useTranslation } from "@/i18n/context";

type Props = {
  className?: string;
};

export function HomeStatsStrip({ className }: Props) {
  const { t } = useTranslation();
  const stats = useHomeStats(t);

  return (
    <div className={cn("home-stats-strip relative z-[1] pt-1 sm:pt-1.5", className)}>
      <ul
        className="mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        role="list"
      >
        {stats.map((stat) => (
          <li key={stat.id} className="flex items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground sm:text-xs dark:border-white/10 dark:bg-white/5">
              <img
                src={`https://flagcdn.com/16x12/${stat.flag}.png`}
                width={16}
                height={12}
                alt=""
                loading="lazy"
                decoding="async"
                className="home-stats-flag shrink-0 h-3 w-4 rounded-[2px] object-cover"
              />
              <span className="font-semibold tabular-nums tracking-tight text-foreground">
                {stat.value}
              </span>
              <span className="text-muted-foreground/80">{stat.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
