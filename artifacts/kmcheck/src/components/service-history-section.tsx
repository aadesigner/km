import { useState } from "react";
import {
  Wrench,
  Calendar,
  MapPin,
  Gauge,
  ClipboardCheck,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import { sliceForHistoryPreview } from "@/lib/history-section-limit";
import { HistoryShowAllButton } from "@/components/history-show-all-button";
import { VinReportSection, VinReportSectionHeader } from "@/components/vin-report-section";
import { ReportReveal } from "@/components/report-reveal";
import {
  localizeProviderDate,
  translateKoreanProviderPhrase,
  translateKoreanProviderText,
  translateProviderDateInText,
} from "@/lib/korean-provider-text";
import { cleanDisplayText } from "@/lib/report-display";
import {
  translateRegistryFieldLabel,
  translateRegistryDetailValue,
} from "@/lib/registry-history";
import { ensureExpandableDetails } from "@/lib/history-event-details";
import { formatMilesInParens } from "@/lib/format-km-with-miles";
import { cn } from "@/lib/utils";
import type { Language } from "@/i18n/context";

export type ServiceHistoryEntry = {
  date?: string | null;
  mileage?: number | null;
  title?: string | null;
  location?: string | null;
  description?: string | null;
  details?: Array<{ label: string; value: string }>;
};

type Props = {
  events: ServiceHistoryEntry[];
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
  t: (key: string) => string;
  language: Language;
  variant?: "report" | "public";
  className?: string;
  delay?: number;
};

function isInspectionEntry(event: ServiceHistoryEntry): boolean {
  const title = (event.title ?? "").toLowerCase();
  return /inspect|inspection|검수|점검/.test(title)
    || (event.details ?? []).some((row) => /inspect/i.test(row.label));
}

function localizeServiceTitle(
  t: (key: string) => string,
  language: Language,
  title: string,
): string {
  const fromPhrase = translateKoreanProviderPhrase(t, title)
    ?? translateKoreanProviderText(t, title);
  const base = fromPhrase && fromPhrase !== title ? fromPhrase : title;
  return translateProviderDateInText(base, language) ?? base;
}

function ServiceDetails({
  details,
  vehicleYear,
  t,
  language,
}: {
  details: Array<{ label: string; value: string }>;
  vehicleYear?: number | null;
  t: Props["t"];
  language: Language;
}) {
  if (!details.length) return null;
  return (
    <dl className="space-y-2 pt-2.5 border-t border-border/50">
      {details.map((row, i) => (
        <div key={`${row.label}-${i}`} className="min-w-0">
          <dt className="text-[10px] font-normal text-muted-foreground mb-0.5">
            {translateRegistryFieldLabel(t, row.label)}
          </dt>
          <dd className="text-xs font-normal text-foreground leading-relaxed break-words">
            {translateRegistryDetailValue(t, language, row.label, row.value, vehicleYear)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ServiceRow({
  event,
  vehicleYear,
  vehicleCountry,
  t,
  language,
  index,
  total,
  isLatest,
}: {
  event: ServiceHistoryEntry;
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
  t: Props["t"];
  language: Language;
  index: number;
  total: number;
  isLatest: boolean;
}) {
  const [open, setOpen] = useState(false);
  const inspection = isInspectionEntry(event);
  const expanded = ensureExpandableDetails({
    title: event.title,
    details: event.details,
    date: event.date,
    description: event.description,
    mileage: event.mileage,
    location: event.location,
  });
  const details = expanded.details;
  const hasDetails = details.length > 0;
  const rawTitle = expanded.title
    || (inspection ? t("registry_type_inspection") : t("service_history_default_title"));
  const title = localizeServiceTitle(t, language, rawTitle);
  const location = cleanDisplayText(event.location);
  const description = cleanDisplayText(event.description);
  const showDescription = Boolean(
    description
    && description.toLowerCase() !== title.toLowerCase()
    && description.toLowerCase() !== (expanded.title ?? "").toLowerCase(),
  );
  const displayDate = event.date
    ? localizeProviderDate(event.date, language, vehicleYear, vehicleCountry)
    : null;
  const mileage = event.mileage != null && Number(event.mileage) > 0
    ? Number(event.mileage)
    : null;
  const isLast = index === total - 1;

  const Icon: LucideIcon = inspection ? ClipboardCheck : Wrench;
  const accent = inspection
    ? {
        dot: "bg-violet-500",
        ring: "ring-violet-500/25",
        badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      }
    : {
        dot: "bg-emerald-500",
        ring: "ring-emerald-500/25",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };

  return (
    <div className="relative pl-5">
      <div
        className={cn(
          "absolute left-0 top-3.5 h-2.5 w-2.5 rounded-full border-2 border-background ring-2",
          accent.dot,
          accent.ring,
        )}
      />
      {!isLast && <div className="absolute left-[4.5px] top-6 bottom-0 w-px bg-border" />}

      <div className={cn("pb-3", isLast && "pb-0")}>
        <div className="relative rounded-lg border border-border/70 bg-muted/15 overflow-hidden">
          <button
            type="button"
            className={cn(
              "w-full text-left px-3 py-2.5 transition-colors",
              hasDetails && "hover:bg-muted/35 cursor-pointer",
              !hasDetails && "cursor-default",
            )}
            onClick={() => hasDetails && setOpen((v) => !v)}
            disabled={!hasDetails}
            aria-expanded={hasDetails ? open : undefined}
          >
            <div className="flex items-start gap-2.5">
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", accent.badge)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    {displayDate && (
                      <p className="text-[10px] font-normal text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {displayDate}
                      </p>
                    )}
                    <p className="text-xs font-medium text-foreground leading-snug">{title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isLatest && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
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

                {showDescription && (
                  <p className="text-[11px] font-normal text-muted-foreground leading-snug line-clamp-2">
                    {description}
                  </p>
                )}

                {(mileage != null || location) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {mileage != null && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-normal bg-background/70 border border-border/50 rounded-md px-1.5 py-0.5 tabular-nums text-muted-foreground">
                        <Gauge className="h-2.5 w-2.5 shrink-0 opacity-80" />
                        {mileage.toLocaleString()} km
                        <span className="opacity-70">{formatMilesInParens(mileage, t)}</span>
                      </span>
                    )}
                    {location && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-normal bg-background/70 border border-border/50 rounded-md px-1.5 py-0.5 max-w-full text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
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
              <ServiceDetails
                details={details}
                vehicleYear={vehicleYear}
                t={t}
                language={language}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServicesList({
  events,
  vehicleYear,
  vehicleCountry,
  t,
  language,
  expanded,
  onToggle,
}: {
  events: ServiceHistoryEntry[];
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
  t: Props["t"];
  language: Language;
  expanded: boolean;
  onToggle: () => void;
}) {
  const visible = sliceForHistoryPreview(events, expanded);
  return (
    <div className="space-y-0">
      {visible.map((event, i) => (
        <ServiceRow
          key={`${event.date ?? ""}-${event.title ?? ""}-${i}`}
          event={event}
          vehicleYear={vehicleYear}
          vehicleCountry={vehicleCountry}
          t={t}
          language={language}
          index={i}
          total={visible.length}
          isLatest={i === 0 && events.length > 1}
        />
      ))}
      <HistoryShowAllButton
        total={events.length}
        expanded={expanded}
        onToggle={onToggle}
        t={t}
      />
    </div>
  );
}

/** Hidden when `events` is empty. */
export function ServiceHistorySection({
  events,
  vehicleYear,
  vehicleCountry,
  t,
  language,
  variant = "report",
  className,
  delay = 0.1,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!events.length) return null;

  const sorted = sortHistoryNewestFirst(events);

  if (variant === "public") {
    return (
      <ReportReveal delay={delay} y={12} className={className}>
        <VinReportSection accent="emerald">
          <VinReportSectionHeader
            variant="public"
            icon={Wrench}
            accent="emerald"
            title={t("report_service_history")}
            trailing={
              <Badge variant="secondary" className="text-[11px] sm:text-xs shrink-0">
                {sorted.length}
              </Badge>
            }
          />
          <div className="px-4 py-2.5 sm:px-5 sm:py-3">
            <ServicesList
              events={sorted}
              vehicleYear={vehicleYear}
              vehicleCountry={vehicleCountry}
              t={t}
              language={language}
              expanded={expanded}
              onToggle={() => setExpanded((v) => !v)}
            />
          </div>
        </VinReportSection>
      </ReportReveal>
    );
  }

  return (
    <ReportReveal delay={delay} y={16} inView className={className}>
      <VinReportSection accent="emerald">
        <VinReportSectionHeader
          icon={Wrench}
          accent="emerald"
          title={t("report_service_history")}
          trailing={
            <Badge variant="secondary" className="text-xs shrink-0">
              {sorted.length}
            </Badge>
          }
        />
        <div className="px-4 py-3">
          <ServicesList
            events={sorted}
            vehicleYear={vehicleYear}
            vehicleCountry={vehicleCountry}
            t={t}
            language={language}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </div>
      </VinReportSection>
    </ReportReveal>
  );
}
