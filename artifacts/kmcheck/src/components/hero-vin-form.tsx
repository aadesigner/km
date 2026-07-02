import type { FormEvent, ReactNode, RefObject } from "react";
import { Search } from "lucide-react";
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
  alerts?: ReactNode;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
};

export function HeroVinForm({
  vin,
  onVinChange,
  onSubmit,
  error,
  disabled,
  placeholder,
  alerts,
  inputRef,
  className,
}: HeroVinFormProps) {
  const { t } = useTranslation();
  const vinLen = vin.length;
  const isComplete = vinLen === 17;
  const showMessages = Boolean(error) || Boolean(alerts);

  return (
    <form onSubmit={onSubmit} className={cn("max-w-lg w-full mx-auto space-y-3 text-left", className)}>
      <VinLookupDisabledBanner compact />
      <div
        className={cn(
          "hero-vin-shell relative overflow-hidden rounded-2xl sm:p-[2px] hero-input-glow",
          "bg-gradient-to-br from-primary/30 via-primary/15 to-emerald-500/20",
          "sm:bg-gradient-to-r sm:from-primary/15 sm:via-primary/50 sm:to-primary/15",
          "sm:shadow-xl sm:shadow-black/10 dark:sm:shadow-black/25",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <div
          className={cn(
            "hero-vin-card relative overflow-hidden rounded-[15px] sm:rounded-[14px]",
            "bg-background/95 dark:bg-[#0a120e]/95 sm:bg-background/90 sm:dark:bg-[#0a120e]/90",
            "sm:backdrop-blur-sm border border-border/50 dark:border-white/[0.08] sm:border-0",
            "shadow-[inset_0_1px_0_hsl(var(--background)/0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          )}
        >
          <div className="hero-vin-mobile-meta sm:hidden flex items-center justify-between gap-3 px-3.5 pt-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/90">
              {t("vin_check")}
            </span>
            <span
              className={cn(
                "text-[11px] font-mono font-semibold tabular-nums transition-colors",
                isComplete ? "text-primary" : "text-muted-foreground/80",
              )}
              aria-live="polite"
            >
              {vinLen}/17
            </span>
          </div>

          <div className="vin-scanner relative sm:rounded-[14px] sm:overflow-hidden sm:border sm:border-border/80 dark:sm:border-white/10 sm:focus-within:border-primary/50 transition-colors">
            <div
              className={cn(
                "hero-vin-input-wrap relative mx-3 sm:mx-0",
                "flex items-center gap-2 sm:block",
                "rounded-xl sm:rounded-none",
                "border border-border/70 dark:border-white/10 sm:border-0",
                "bg-muted/40 dark:bg-white/[0.04] sm:bg-transparent",
                "p-1.5 sm:p-0",
                "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/12 sm:focus-within:ring-0",
                "transition-[border-color,box-shadow]",
              )}
            >
              <div className="relative flex min-w-0 flex-1 items-center sm:w-full">
                <Search className="absolute left-2.5 sm:left-5 h-5 w-5 text-primary/60 dark:text-primary/50 sm:text-muted-foreground dark:sm:text-white/35 shrink-0 z-10 pointer-events-none" />
                <Input
                  ref={inputRef}
                  className={cn(
                    "h-11 sm:h-14 w-full min-w-0 pl-10 sm:pl-13 text-[16px] sm:text-base",
                    "border-0 focus-visible:ring-0 rounded-lg sm:rounded-[14px] shadow-none bg-transparent",
                    "font-mono tracking-[0.14em] sm:tracking-widest text-foreground dark:text-white",
                    "placeholder:text-muted-foreground/75 dark:placeholder:text-white/30 placeholder:tracking-normal",
                    "pr-2 sm:pr-36",
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
              <Button
                type="submit"
                size="lg"
                disabled={disabled}
                className={cn(
                  "hero-vin-submit shrink-0 font-semibold",
                  "h-10 px-4 rounded-lg text-sm",
                  "sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2 sm:h-10 sm:px-6 sm:rounded-xl",
                  "sm:shadow-lg sm:shadow-primary/25 sm:hover:shadow-primary/40",
                )}
              >
                <span className="sm:hidden">{t("check_vin_short")}</span>
                <span className="hidden sm:inline-flex">
                  <VinCheckSubmitLabel />
                </span>
              </Button>
            </div>

            <div className="hero-vin-segments sm:hidden flex gap-[3px] px-3.5 pt-2.5 pb-1" aria-hidden>
              {Array.from({ length: 17 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-200",
                    i < vinLen
                      ? isComplete ? "bg-primary" : "bg-primary/65"
                      : "bg-muted-foreground/12 dark:bg-white/8",
                  )}
                />
              ))}
            </div>

            {showMessages && (
              <div className="hero-vin-card-messages sm:hidden space-y-2 px-3 pb-3 pt-1">
                {error && (
                  <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                {alerts}
              </div>
            )}
          </div>

          {showMessages && (
            <div className="hidden sm:block space-y-2 px-1 pb-1 pt-2">
              {error && <p className="text-sm text-destructive px-2">{error}</p>}
              {alerts}
            </div>
          )}
        </div>
      </div>

      <WhereToFindVinHelp />
    </form>
  );
}
