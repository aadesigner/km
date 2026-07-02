import type { FormEvent, ReactNode } from "react";
import { Search, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VinLookupDisabledBanner } from "@/components/vin-lookup-disabled-banner";
import { WhereToFindVinHelp } from "@/components/where-to-find-vin-help";
import { VinCheckSubmitLabel } from "@/components/vin-check-submit-label";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

type HeroVinFormProps = {
  vin: string;
  onVinChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error?: string;
  disabled?: boolean;
  placeholder: string;
  displayPrice: number | null;
  priceLoading?: boolean;
  fmtPrice: (n: number) => string;
  children?: ReactNode;
};

export function HeroVinForm({
  vin,
  onVinChange,
  onSubmit,
  error,
  disabled,
  placeholder,
  displayPrice,
  priceLoading,
  fmtPrice,
  children,
}: HeroVinFormProps) {
  const { t } = useTranslation();
  const vinLen = vin.length;
  const isComplete = vinLen === 17;

  return (
    <form onSubmit={onSubmit} className="max-w-lg w-full mx-auto space-y-3 text-left">
      <VinLookupDisabledBanner compact />
      <div
        className={cn(
          "hero-vin-shell relative overflow-hidden rounded-[1.25rem] sm:rounded-2xl sm:p-[2px] hero-input-glow",
          "bg-gradient-to-br from-primary/40 via-primary/20 to-emerald-600/30",
          "sm:bg-gradient-to-r sm:from-primary/15 sm:via-primary/50 sm:to-primary/15",
          "dark:from-primary/25 dark:via-primary/15 dark:to-emerald-500/20",
          "sm:shadow-xl sm:shadow-black/10 dark:sm:shadow-black/25",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <div className="hero-vin-card relative overflow-hidden rounded-[calc(1.25rem-1px)] sm:rounded-[14px] bg-background dark:bg-[#0a120e] sm:bg-background/90 sm:dark:bg-[#0a120e]/90 sm:backdrop-blur-sm">
          {/* Mobile card header */}
          <div className="hero-vin-mobile-header sm:hidden flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {t("vin_check")}
                </p>
                <p className="text-xs text-muted-foreground truncate">{t("hero_vin_label")}</p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-mono font-semibold tabular-nums ring-1 transition-colors",
                isComplete
                  ? "bg-primary/15 text-primary ring-primary/30"
                  : "bg-muted/80 text-muted-foreground ring-border/60",
              )}
              aria-live="polite"
            >
              {vinLen}/17
            </span>
          </div>

          <div className="vin-scanner relative flex flex-col sm:block sm:rounded-[14px] sm:overflow-hidden sm:border sm:border-border/80 dark:sm:border-white/10 focus-within:border-primary/40 sm:focus-within:border-primary/50 transition-colors">
            <div className="hero-vin-input-wrap relative flex w-full min-w-0 items-center mx-3 sm:mx-0 rounded-xl sm:rounded-none border border-border/70 dark:border-white/10 sm:border-0 bg-muted/30 dark:bg-white/[0.04] sm:bg-transparent focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/15 sm:focus-within:ring-0">
              <Search className="absolute left-3.5 sm:left-5 h-5 w-5 text-primary/70 dark:text-primary/60 sm:text-muted-foreground dark:sm:text-white/35 shrink-0 z-10 pointer-events-none" />
              <Input
                className={cn(
                  "h-[3.25rem] sm:h-14 w-full pl-11 sm:pl-13 text-[16px] sm:text-base border-0 focus-visible:ring-0 rounded-xl sm:rounded-[14px] shadow-none bg-transparent",
                  "font-mono tracking-[0.14em] sm:tracking-widest text-foreground dark:text-white",
                  "placeholder:text-muted-foreground/80 dark:placeholder:text-white/35 placeholder:tracking-normal placeholder:text-[15px] sm:placeholder:text-base",
                  "relative z-0",
                  vinLen > 0 ? "pr-4 sm:pr-36" : "pr-4 sm:pr-36",
                )}
                placeholder={placeholder}
                value={vin}
                onChange={(e) => onVinChange(e.target.value.replace(/\s/g, "").toUpperCase())}
                maxLength={17}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                aria-label={placeholder}
              />
            </div>

            {/* 17-segment VIN progress — mobile only */}
            <div className="hero-vin-segments sm:hidden flex gap-[3px] px-4 pt-3 pb-1" aria-hidden>
              {Array.from({ length: 17 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-200",
                    i < vinLen
                      ? isComplete
                        ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.45)]"
                        : "bg-primary/75"
                      : "bg-muted-foreground/12 dark:bg-white/10",
                  )}
                />
              ))}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={disabled}
              className={cn(
                "hero-vin-submit relative z-10 font-semibold transition-all",
                "mx-3 mb-3 mt-2 w-[calc(100%-1.5rem)] h-12 rounded-xl",
                "sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2 sm:w-auto sm:h-10 sm:mx-0 sm:mb-0 sm:mt-0 sm:px-6 sm:rounded-xl",
                "max-sm:bg-gradient-to-r max-sm:from-primary max-sm:via-primary max-sm:to-emerald-600",
                "max-sm:hover:from-primary/95 max-sm:hover:to-emerald-600/95",
                "max-sm:shadow-[0_10px_28px_-8px_hsl(var(--primary)/0.55)] max-sm:hover:shadow-[0_12px_32px_-6px_hsl(var(--primary)/0.6)]",
                "sm:shadow-lg sm:shadow-primary/25 sm:hover:shadow-primary/40",
                "border-0",
                isComplete && "hero-vin-cta-ready",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-center">
                <span className="hidden sm:flex items-center gap-2">
                  <VinCheckSubmitLabel />
                </span>
                <span className="flex sm:hidden items-center gap-2">
                  <VinCheckSubmitLabel stacked />
                  <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
                </span>
                <span className="sm:hidden flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ring-white/20">
                  {priceLoading || displayPrice == null ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    fmtPrice(displayPrice)
                  )}
                </span>
              </span>
            </Button>
          </div>

          {/* Mobile trust strip */}
          <div className="hero-vin-mobile-trust sm:hidden flex items-center justify-center gap-4 px-4 pb-3.5 pt-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
              {t("stats_delivery")}
            </span>
            <span className="text-border" aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
              {t("trust_secure_payment")}
            </span>
          </div>
        </div>
      </div>

      <WhereToFindVinHelp />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {children}
    </form>
  );
}
