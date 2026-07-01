import type { ElementType } from "react";
import { Lock, Gauge, AlertTriangle, ShieldCheck, Users, TrendingUp, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Blurred placeholder body shown inside locked report sections. */
export function VinLockedSectionBody({ hint }: { hint: string }) {
  return (
    <div className="relative min-h-[88px] overflow-hidden">
      <div className="px-6 py-5">
        <div className="space-y-2.5 blur-sm select-none pointer-events-none" aria-hidden>
          <div className="h-3 bg-muted rounded-full w-3/4" />
          <div className="h-3 bg-muted rounded-full w-1/2" />
          <div className="h-3 bg-muted rounded-full w-2/3" />
          <div className="h-3 bg-muted rounded-full w-5/6" />
        </div>
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]"
        style={{
          background:
            "repeating-linear-gradient(45deg,transparent,transparent 7px,rgba(0,0,0,0.035) 7px,rgba(0,0,0,0.035) 9px)",
        }}
      >
        <div className="bg-background/90 border shadow-sm rounded-xl px-3.5 py-2 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground font-medium">{hint}</p>
        </div>
      </div>
    </div>
  );
}

type LockedSectionCardProps = {
  title: string;
  icon?: ElementType;
  delay?: number;
  hint: string;
  className?: string;
};

export function VinLockedSectionCard({
  title,
  icon: Icon,
  delay = 0,
  hint,
  className,
}: LockedSectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("rounded-2xl border bg-card overflow-hidden", className)}
    >
      <div className="px-6 py-4 border-b flex items-center gap-2.5">
        {Icon && (
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      <VinLockedSectionBody hint={hint} />
    </motion.div>
  );
}

export function VinLockedHeroStat({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 border border-border/60 px-2.5 py-1 w-full justify-center">
      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="text-[10px] font-medium text-muted-foreground truncate">{label}</span>
    </div>
  );
}

type TeaserCard = {
  icon: ElementType;
  title: string;
  sample: string;
  color: string;
  bg: string;
  border: string;
};

type VinLockedTeaserPanelProps = {
  t: (key: string) => string;
  priceLabel: string | null;
  onUnlock: () => void;
};

export function VinLockedTeaserPanel({ t, priceLabel, onUnlock }: VinLockedTeaserPanelProps) {
  const cards: TeaserCard[] = [
    {
      icon: AlertTriangle,
      title: t("vin_public_accidents_section"),
      sample: t("free_decoder_teaser_accidents_sample"),
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-200 dark:border-orange-900/40",
    },
    {
      icon: Gauge,
      title: t("vin_public_mileage_section"),
      sample: t("free_decoder_teaser_mileage_sample"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-900/40",
    },
    {
      icon: ShieldCheck,
      title: t("vin_public_safety_section"),
      sample: t("free_decoder_teaser_salvage_sample"),
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-200 dark:border-green-900/40",
    },
    {
      icon: Users,
      title: t("vin_result_owners_title"),
      sample: t("vin_public_owners_label"),
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-200 dark:border-violet-900/40",
    },
  ];

  const extraSections = [
    { icon: FileText, label: t("report_insurance_claims") },
    { icon: Shield, label: t("report_registry_history") },
    { icon: TrendingUp, label: t("report_market_data") },
  ];

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-muted/50 text-sm font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {t("free_decoder_locked_section")}
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cards.map(({ icon: Icon, title, sample, color, bg, border }) => (
          <div key={title} className={cn("relative rounded-2xl border bg-card overflow-hidden", border)}>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <p className="font-semibold text-sm">{title}</p>
              </div>
              <div className="select-none pointer-events-none space-y-2" aria-hidden>
                <div className="blur-sm text-xs text-muted-foreground font-mono">{sample}</div>
                <div className="blur-sm space-y-1.5">
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-full" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-3/4" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-1/2" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-background/75 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                type="button"
                size="sm"
                className="font-bold rounded-xl h-9 px-5 text-xs w-full max-w-[180px] shadow-md shadow-primary/20"
                onClick={onUnlock}
              >
                {priceLabel
                  ? `${t("vin_public_check_cta")} — ${priceLabel}`
                  : t("vin_public_check_cta")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {extraSections.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="rounded-xl border bg-card/80 px-3 py-3 flex items-center gap-2.5 opacity-90"
          >
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground truncate">{label}</p>
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <Lock className="h-2.5 w-2.5 shrink-0" />
                {t("vin_public_locked_hint")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
