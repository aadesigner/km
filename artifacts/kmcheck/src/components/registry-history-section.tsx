import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Gauge,
  MapPin,
  Wallet,
  Calendar,
  ChevronDown,
  Shield,
  Car,
  FileWarning,
  UserRound,
  ClipboardCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HistoryShowAllButton } from "@/components/history-show-all-button";
import { sliceForHistoryPreview } from "@/lib/history-section-limit";
import { KoreanWonAmount, textContainsWon } from "@/components/korean-won-amount";
import { isKoreanCountry } from "@/lib/korean-currency";
import {
  type RegistryHistoryEntry,
  formatRegistryEventsCount,
  formatRegistryMileage,
  localizeRegistryDate,
  localizeRegistrySubtitle,
  translateRegistryDetailValue,
  translateRegistryEventType,
  translateRegistryFieldLabel,
} from "@/lib/registry-history";
import { isRegistryAmountLabel } from "@workspace/korean-registry";
import type { Language } from "@/i18n/context";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import { sanitizeRegistryDetailRows } from "@/lib/report-display";
import { formatLocationLabel, countryLabelsFromT } from "@/lib/format-country-name";

type Props = {
  events: RegistryHistoryEntry[];
  country?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  t: (key: string) => string;
  language: Language;
  variant?: "report" | "public";
  className?: string;
  delay?: number;
};

const TYPE_VISUAL: Record<string, { icon: LucideIcon; dot: string; ring: string; badge: string }> = {
  inspection: {
    icon: ClipboardCheck,
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
    badge: "bg-violet-500/10 text-violet-800 dark:text-violet-300",
  },
  owner_change: {
    icon: UserRound,
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    badge: "bg-blue-500/10 text-blue-800 dark:text-blue-300",
  },
  insurance_event: {
    icon: Shield,
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  new_car_delivery: {
    icon: Car,
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
  registration_change: {
    icon: ClipboardList,
    dot: "bg-sky-500",
    ring: "ring-sky-500/30",
    badge: "bg-sky-500/10 text-sky-800 dark:text-sky-300",
  },
  recall: {
    icon: FileWarning,
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    badge: "bg-red-500/10 text-red-800 dark:text-red-300",
  },
  no_insurance: {
    icon: Shield,
    dot: "bg-muted-foreground/70",
    ring: "ring-muted-foreground/25",
    badge: "bg-muted text-muted-foreground",
  },
};

const DEFAULT_VISUAL = {
  icon: ClipboardList,
  dot: "bg-violet-500",
  ring: "ring-violet-500/30",
  badge: "bg-violet-500/10 text-violet-800 dark:text-violet-300",
};

function typeVisual(type?: string | null) {
  return TYPE_VISUAL[type ?? ""] ?? DEFAULT_VISUAL;
}

function EventDetails({
  event,
  country,
  vehicleYear,
  krwPerUsd,
  t,
  language,
}: {
  event: RegistryHistoryEntry;
  country?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  t: Props["t"];
  language: Language;
}) {
  const rows = sanitizeRegistryDetailRows(event.details);
  if (!rows.length) return null;

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-2.5 border-t border-border/60">
      {rows.map((row, i) => (
        <div
          key={`${row.label}-${i}`}
          className={cn(
            "rounded-md bg-background/60 px-2.5 py-2 border border-border/40",
            row.label.toLowerCase().includes("defect") && "sm:col-span-2",
          )}
        >
          <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            {translateRegistryFieldLabel(t, row.label)}
          </dt>
          <dd className="text-[11px] text-foreground mt-1 whitespace-pre-wrap break-words leading-snug">
            {isKoreanCountry(country) && (textContainsWon(row.value) || isRegistryAmountLabel(row.label)) ? (
              <KoreanWonAmount text={row.value} krwPerUsd={krwPerUsd} />
            ) : (
              translateRegistryDetailValue(t, language, row.label, row.value, vehicleYear)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RegistryEventCard({
  event,
  country,
  vehicleYear,
  krwPerUsd,
  t,
  language,
  index,
  total,
  isLatest,
}: {
  event: RegistryHistoryEntry;
  country?: string | null;
  vehicleYear?: number | null;
  krwPerUsd?: number | null;
  t: Props["t"];
  language: Language;
  index: number;
  total: number;
  isLatest: boolean;
}) {
  const [open, setOpen] = useState(false);
  const details = sanitizeRegistryDetailRows(event.details);
  const hasDetails = details.length > 0;
  const visual = typeVisual(event.type);
  const TypeIcon = visual.icon;
  const typeLabel = translateRegistryEventType(t, event.type, event.title, language);
  const subtitle = localizeRegistrySubtitle(t, language, event.subtitle, country, krwPerUsd);
  const countryLabels = countryLabelsFromT(t);
  const location = event.location
    ? formatLocationLabel(event.location, language, countryLabels)
    : null;
  const date = localizeRegistryDate(language, event.date, vehicleYear, country);
  const isLast = index === total - 1;

  return (
    <div className="relative pl-5">
      <div
        className={cn(
          "absolute left-0 top-3.5 h-2.5 w-2.5 rounded-full border-2 border-background ring-2",
          visual.dot,
          visual.ring,
        )}
      />
      {!isLast && <div className="absolute left-[4.5px] top-6 bottom-0 w-px bg-border" />}

      <div className={cn("pb-3", isLast && "pb-0")}>
        <div className="rounded-lg border bg-muted/25 overflow-hidden shadow-sm">
          <button
            type="button"
            className={cn(
              "w-full text-left px-3 py-2.5 transition-colors",
              hasDetails && "hover:bg-muted/40",
              !hasDetails && "cursor-default",
            )}
            onClick={() => hasDetails && setOpen((v) => !v)}
            disabled={!hasDetails}
            aria-expanded={hasDetails ? open : undefined}
          >
            <div className="flex items-start gap-2.5">
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", visual.badge)}>
                <TypeIcon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    {date && (
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {date}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-foreground leading-snug">{typeLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isLatest && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {t("latest")}
                      </Badge>
                    )}
                    {hasDetails && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    )}
                  </div>
                </div>

                {subtitle && (
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{subtitle}</p>
                )}

                {(event.mileage != null || event.amount || location) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {event.mileage != null && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-background/80 border border-border/60 rounded-full px-2 py-0.5 tabular-nums">
                        <Gauge className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                        {formatRegistryMileage(event.mileage)}
                      </span>
                    )}
                    {event.amount && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-full px-2 py-0.5">
                        <Wallet className="h-2.5 w-2.5 shrink-0" />
                        {isKoreanCountry(country) ? (
                          <KoreanWonAmount text={event.amount} krwPerUsd={krwPerUsd} />
                        ) : (
                          event.amount
                        )}
                      </span>
                    )}
                    {location && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-background/80 border border-border/60 rounded-full px-2 py-0.5 max-w-full">
                        <MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{location}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>

          {hasDetails && open && (
            <div className="px-3 pb-2.5 pt-0">
              <EventDetails event={event} country={country} vehicleYear={vehicleYear} krwPerUsd={krwPerUsd} t={t} language={language} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RegistryHistorySection({
  events,
  country,
  vehicleYear,
  krwPerUsd,
  t,
  language,
  variant = "report",
  className,
  delay = 0.1,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!events.length) return null;

  const sortedEvents = sortHistoryNewestFirst(events);
  const visibleEvents = sliceForHistoryPreview(sortedEvents, expanded);

  const shellClass = variant === "public"
    ? "rounded-2xl border bg-card overflow-hidden"
    : "rounded-2xl border bg-background overflow-hidden";

  const headerClass = variant === "public"
    ? "px-5 py-3 border-b flex items-center justify-between gap-2"
    : "px-4 py-2.5 border-b flex items-center justify-between gap-2 bg-muted/30";

  const body = (
    <>
      <div className={headerClass}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
            <ClipboardList className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h2 className={variant === "public" ? "text-xs font-bold uppercase tracking-widest text-muted-foreground" : "font-bold text-sm leading-tight"}>
              {t("report_registry_history")}
            </h2>
            {variant === "report" && (
              <p className="text-[10px] text-muted-foreground leading-tight truncate sm:whitespace-normal">
                {t("report_registry_history_note")}
              </p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {formatRegistryEventsCount(t, sortedEvents.length)}
        </Badge>
      </div>
      <div className="px-4 py-3">
        {variant === "public" && (
          <p className="text-[11px] text-muted-foreground mb-2.5 leading-snug">{t("report_registry_history_note")}</p>
        )}
        <div className="space-y-0">
          {visibleEvents.map((event, i) => (
            <RegistryEventCard
              key={`${event.type}-${event.date}-${i}`}
              event={event}
              country={country}
              vehicleYear={vehicleYear}
              krwPerUsd={krwPerUsd}
              t={t}
              language={language}
              index={i}
              total={visibleEvents.length}
              isLatest={i === 0 && sortedEvents.length > 1}
            />
          ))}
        </div>
        <HistoryShowAllButton
          total={sortedEvents.length}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          t={t}
          className="mt-2"
        />
      </div>
    </>
  );

  if (variant === "public") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn(shellClass, className)}
      >
        {body}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className={cn(shellClass, className)}
    >
      {body}
    </motion.div>
  );
}
