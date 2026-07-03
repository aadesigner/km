import { cn } from "@/lib/utils";
import { useHomeStats } from "@/lib/home-stats";
import { useTranslation } from "@/i18n/context";

type Props = {
  className?: string;
  /** Larger stacked layout for the homepage hero (replaces rating strip). */
  variant?: "default" | "hero";
};

export function HomeStatsStrip({ className, variant = "default" }: Props) {
  const { t } = useTranslation();
  const stats = useHomeStats(t);
  const isHero = variant === "hero";

  return (
    <div className={cn("home-stats-strip relative z-[1]", isHero ? "pt-1" : "pt-3 sm:pt-4", className)}>
      <ul
        className={cn(
          "mx-auto flex items-center justify-center",
          isHero
            ? "flex-wrap gap-x-8 gap-y-4 sm:gap-x-12"
            : "flex-wrap gap-x-3 gap-y-1 max-sm:max-h-[3.25rem] sm:gap-x-0 max-sm:overflow-hidden max-sm:content-start",
        )}
        role="list"
      >
        {stats.map((stat, i) => (
          <li key={stat.id} className="flex items-center">
            {i > 0 && !isHero && (
              <span
                aria-hidden
                className="mx-3 hidden text-muted-foreground/30 sm:inline select-none"
              >
                ·
              </span>
            )}
            {isHero ? (
              <div className="flex flex-col items-center gap-0.5 text-center min-w-[4.5rem]">
                <span className="text-lg sm:text-xl font-extrabold tabular-nums tracking-tight text-foreground leading-none">
                  {stat.value}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <img
                    src={`https://flagcdn.com/16x12/${stat.flag}.png`}
                    width={16}
                    height={12}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="home-stats-flag shrink-0 h-3 w-4 rounded-[2px] object-cover"
                  />
                  {stat.label}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
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
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
