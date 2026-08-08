import { useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Calendar, MapPin, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sortHistoryNewestFirst } from "@/lib/history-sort";
import { sliceForHistoryPreview } from "@/lib/history-section-limit";
import { HistoryShowAllButton } from "@/components/history-show-all-button";
import { localizeProviderDate } from "@/lib/korean-provider-text";
import { cleanDisplayText } from "@/lib/report-display";
import type { Language } from "@/i18n/context";

export type ServiceHistoryEntry = {
  date?: string | null;
  mileage?: number | null;
  title?: string | null;
  location?: string | null;
  description?: string | null;
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

function ServiceRow({
  event,
  vehicleYear,
  vehicleCountry,
  t,
  language,
  index,
  total,
}: {
  event: ServiceHistoryEntry;
  vehicleYear?: number | null;
  vehicleCountry?: string | null;
  t: Props["t"];
  language: Language;
  index: number;
  total: number;
}) {
  const title = cleanDisplayText(event.title) || t("service_history_default_title");
  const location = cleanDisplayText(event.location);
  const description = cleanDisplayText(event.description);
  const displayDate = event.date
    ? localizeProviderDate(event.date, language, vehicleYear, vehicleCountry)
    : null;

  return (
    <div className="relative pl-4">
      <div className="absolute left-0 top-2.5 h-2 w-2 rounded-full shrink-0 bg-teal-500" />
      {index < total - 1 && (
        <div className="absolute left-[3.5px] top-5 bottom-0 w-px bg-border" />
      )}
      <div className="border rounded-lg bg-muted/20 overflow-hidden">
        <div className="px-3 py-2 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {displayDate ? (
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {displayDate}
                </p>
              ) : null}
              <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{title}</p>
            </div>
            {event.mileage != null && Number(event.mileage) > 0 && (
              <span className="text-[11px] tabular-nums text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 rounded-full px-2 py-0.5 shrink-0 inline-flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {Number(event.mileage).toLocaleString()} km
              </span>
            )}
          </div>
          {location && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-snug pt-1 border-t border-border/60">
              {description}
            </p>
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
    <div className="space-y-2">
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn("rounded-2xl border bg-card overflow-hidden", className)}
      >
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b flex items-center justify-between gap-2">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("report_service_history")}
          </h2>
          <Badge variant="secondary" className="text-[11px] sm:text-xs shrink-0">
            {sorted.length}
          </Badge>
        </div>
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
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className={cn("rounded-2xl border bg-background overflow-hidden", className)}
    >
      <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0">
            <Wrench className="h-3 w-3 text-teal-500" />
          </div>
          <h2 className="font-bold text-sm leading-tight">{t("report_service_history")}</h2>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {sorted.length}
        </Badge>
      </div>
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
    </motion.div>
  );
}
