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
    <div className={cn("relative z-[1] pt-3 sm:pt-4 shadow-none", className)}>
      <ul
        className="mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:gap-x-0"
        role="list"
      >
        {stats.map((stat, i) => (
          <li key={stat.id} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className="mx-3 hidden text-muted-foreground/30 sm:inline select-none"
              >
                ·
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <img
                src={`https://flagcdn.com/${stat.flag}.svg`}
                width={16}
                height={12}
                alt=""
                className="shrink-0 h-3 w-4 rounded-[2px] object-cover opacity-90 shadow-none"
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
