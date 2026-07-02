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

function VinSegments({ vinLen, isComplete }: { vinLen: number; isComplete: boolean }) {
  return (
    <>
      {Array.from({ length: 17 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] flex-1 rounded-full transition-colors duration-200",
            i < vinLen
              ? isComplete ? "bg-primary" : "bg-primary/65"
              : "bg-muted-foreground/12 dark:bg-white/8",
          )}
        />
      ))}
    </>
  );
}

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

  const onVinInput = (value: string) => onVinChange(value.replace(/\s/g, "").toUpperCase());

  return (
    <form onSubmit={onSubmit} className={cn("max-w-lg sm:max-w-xl w-full mx-auto space-y-3 text-left", className)}>
      <VinLookupDisabledBanner compact />

      {/* Mobile — compact card with meta, segments, inline button */}
      <div
        className={cn(
          "hero-vin-shell relative overflow-hidden rounded-2xl hero-input-glow sm:hidden",
          "bg-gradient-to-br from-primary/18 via-primary/8 to-emerald-500/10",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <div
          className={cn(
            "hero-vin-card relative overflow-hidden rounded-[15px]",
            "bg-background/95 dark:bg-[#0a120e]/95",
            "border border-border/50 dark:border-white/[0.08]",
            "shadow-[inset_0_1px_0_hsl(var(--background)/0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            "pb-3",
          )}
        >
          <div className="hero-vin-meta flex items-center justify-between gap-3 px-3.5 pt-3 pb-2">
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

          <div
            className={cn(
              "hero-vin-field relative overflow-hidden transition-[border-color,box-shadow]",
              "mx-3 mb-3 rounded-xl",
              "border border-border/70 dark:border-white/10",
              "focus-within:border-primary/30",
              "focus-within:ring-2 focus-within:ring-primary/8",
              "bg-muted/40 dark:bg-white/[0.04]",
            )}
          >
            <div className="hero-vin-input-wrap vin-scanner relative overflow-hidden flex items-center gap-2 p-1.5 pb-1">
              <div className="relative flex min-w-0 flex-1 items-center">
                <Search className="absolute left-2.5 h-5 w-5 text-primary/60 dark:text-primary/50 shrink-0 z-10 pointer-events-none" />
                <Input
                  className={cn(
                    "h-11 w-full min-w-0 pl-10 pr-2 text-[16px]",
                    "border-0 focus-visible:ring-0 rounded-lg shadow-none bg-transparent",
                    "font-mono tracking-[0.14em] text-foreground dark:text-white",
                    "placeholder:text-muted-foreground/75 dark:placeholder:text-white/30 placeholder:tracking-normal",
                  )}
                  placeholder={placeholder}
                  value={vin}
                  onChange={(e) => onVinInput(e.target.value)}
                  maxLength={17}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  aria-label={placeholder}
                />
              </div>
              <Button type="submit" size="lg" disabled={disabled} className="hero-vin-submit shrink-0 h-10 px-4 rounded-lg text-sm font-semibold">
                {t("check_vin_short")}
              </Button>
            </div>

            <div className="hero-vin-segments flex gap-[2px] px-1.5 pb-1.5 pt-0" aria-hidden>
              <VinSegments vinLen={vinLen} isComplete={isComplete} />
            </div>

            {showMessages && (
              <div className="hero-vin-card-messages space-y-2 px-3 pb-3 pt-1">
                {error && (
                  <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                {alerts}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop — classic gradient shell + single input row (pre-mobile-unification) */}
      <div className={cn("hidden sm:block space-y-3", disabled && "opacity-60 pointer-events-none")}>
        <div
          className={cn(
            "relative p-[2px] rounded-2xl hero-input-glow",
            "bg-gradient-to-r from-primary/15 via-primary/50 to-primary/15",
            "dark:from-primary/10 dark:via-primary/45 dark:to-primary/10",
            "shadow-xl shadow-black/10 dark:shadow-black/25",
          )}
        >
          <div className="vin-scanner relative flex items-center rounded-[15px] overflow-hidden border border-border/80 dark:border-white/10 focus-within:border-primary/50 transition-colors bg-background/90 dark:bg-[#0a120e]/90 backdrop-blur-sm">
            <Search className="absolute left-5 h-[1.35rem] w-[1.35rem] text-muted-foreground dark:text-white/35 shrink-0 z-10 pointer-events-none" />
            <Input
              ref={inputRef}
              className="h-16 pl-14 pr-[10.5rem] text-lg border-0 focus-visible:ring-0 rounded-[15px] shadow-none bg-transparent font-mono tracking-widest text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/30 relative z-0"
              placeholder={placeholder}
              value={vin}
              onChange={(e) => onVinInput(e.target.value)}
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              aria-label={placeholder}
            />
            <Button
              type="submit"
              size="lg"
              disabled={disabled}
              className="absolute right-2.5 z-10 h-11 rounded-xl px-7 text-[15px] font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              <VinCheckSubmitLabel />
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive px-1">{error}</p>}
        {alerts}
      </div>

      <WhereToFindVinHelp />
    </form>
  );
}
