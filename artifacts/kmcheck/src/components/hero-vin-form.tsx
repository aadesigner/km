import type { FormEvent, ReactNode } from "react";
import { Search, Loader2 } from "lucide-react";
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
          "hero-vin-shell relative overflow-hidden rounded-2xl sm:p-[2px] hero-input-glow",
          "bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20",
          "sm:from-primary/15 sm:via-primary/50 sm:to-primary/15",
          "sm:shadow-xl sm:shadow-black/10 dark:sm:shadow-black/25",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <div className="hero-vin-card relative overflow-hidden rounded-[15px] sm:rounded-[14px] bg-background dark:bg-[#0a120e] sm:bg-background/90 sm:dark:bg-[#0a120e]/90 sm:backdrop-blur-sm border border-border/60 dark:border-white/10 sm:border-0">
          <div className="hero-vin-mobile-meta sm:hidden flex items-center justify-between gap-3 px-4 pt-3 pb-2">
            <span className="text-xs font-semibold text-foreground/80">{t("vin_check")}</span>
            <span
              className={cn(
                "text-[11px] font-mono font-medium tabular-nums transition-colors",
                isComplete ? "text-primary" : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              {vinLen}/17
            </span>
          </div>

          <div className="vin-scanner relative flex flex-col sm:block sm:rounded-[14px] sm:overflow-hidden sm:border sm:border-border/80 dark:sm:border-white/10 focus-within:border-primary/45 sm:focus-within:border-primary/50 transition-colors">
            <div className="hero-vin-input-wrap relative flex w-full min-w-0 items-center mx-3 sm:mx-0 rounded-xl sm:rounded-none border border-border/60 dark:border-white/10 sm:border-0 bg-muted/25 dark:bg-white/[0.03] sm:bg-transparent">
              <Search className="absolute left-3.5 sm:left-5 h-5 w-5 text-muted-foreground dark:text-white/35 shrink-0 z-10 pointer-events-none" />
              <Input
                className={cn(
                  "h-12 sm:h-14 w-full pl-11 sm:pl-13 text-[16px] sm:text-base border-0 focus-visible:ring-0 rounded-xl sm:rounded-[14px] shadow-none bg-transparent",
                  "font-mono tracking-[0.14em] sm:tracking-widest text-foreground dark:text-white",
                  "placeholder:text-muted-foreground dark:placeholder:text-white/30 placeholder:tracking-normal",
                  "relative z-0",
                  "pr-4 sm:pr-36",
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

            <div className="hero-vin-segments sm:hidden flex gap-[3px] px-4 pt-2.5 pb-1" aria-hidden>
              {Array.from({ length: 17 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-200",
                    i < vinLen
                      ? isComplete ? "bg-primary" : "bg-primary/70"
                      : "bg-muted-foreground/15 dark:bg-white/10",
                  )}
                />
              ))}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={disabled}
              className={cn(
                "hero-vin-submit relative z-10 font-semibold",
                "mx-3 mb-3 mt-2 w-[calc(100%-1.5rem)] h-11 rounded-xl",
                "sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2 sm:w-auto sm:h-10 sm:mx-0 sm:mb-0 sm:mt-0 sm:px-6 sm:rounded-xl",
                "sm:shadow-lg sm:shadow-primary/25 sm:hover:shadow-primary/40",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-center">
                <span className="hidden sm:inline-flex sm:items-center">
                  <VinCheckSubmitLabel />
                </span>
                <span className="sm:hidden">
                  <VinCheckSubmitLabel stacked />
                </span>
                <span className="sm:hidden text-xs font-bold tabular-nums opacity-90">
                  {priceLoading || displayPrice == null ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    fmtPrice(displayPrice)
                  )}
                </span>
              </span>
            </Button>
          </div>
        </div>
      </div>

      <WhereToFindVinHelp />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {children}
    </form>
  );
}
