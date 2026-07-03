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

      <div className={cn(disabled && "opacity-60 pointer-events-none")}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-primary/90">
              {t("vin_check")}
            </span>
            <span
              className={cn(
                "text-[11px] sm:text-xs font-mono font-semibold tabular-nums transition-colors",
                isComplete ? "text-primary" : "text-muted-foreground/80",
              )}
              aria-live="polite"
            >
              {vinLen}/17
            </span>
          </div>

          <div
            className={cn(
              "relative p-[2px] rounded-2xl hero-input-glow",
              "bg-gradient-to-r from-primary/15 via-primary/50 to-primary/15",
              "dark:from-primary/10 dark:via-primary/45 dark:to-primary/10",
              "shadow-lg shadow-black/10 dark:shadow-black/25 sm:shadow-xl sm:shadow-black/10 dark:sm:shadow-black/25",
            )}
          >
            <div
              className={cn(
                "hero-vin-field relative overflow-hidden rounded-[15px]",
                "border border-border/80 dark:border-white/10",
                "bg-background/95 dark:bg-[#0a120e]/95 backdrop-blur-sm",
                "transition-[border-color,box-shadow]",
                "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10",
              )}
            >
              <div className="hero-vin-input-wrap vin-scanner relative flex items-center overflow-hidden">
                <Search className="absolute left-3.5 sm:left-5 h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem] text-primary/60 dark:text-primary/50 sm:text-muted-foreground sm:dark:text-white/35 shrink-0 z-10 pointer-events-none" />
                <Input
                  ref={inputRef}
                  className={cn(
                    "h-12 sm:h-14 md:h-16 w-full min-w-0",
                    "pl-11 sm:pl-14 pr-[7.5rem] sm:pr-[10.5rem]",
                    "text-[16px] sm:text-lg",
                    "border-0 focus-visible:ring-0 rounded-none shadow-none bg-transparent",
                    "font-mono tracking-[0.14em] sm:tracking-widest text-foreground dark:text-white",
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
                <Button
                  type="submit"
                  size="lg"
                  disabled={disabled}
                  className={cn(
                    "hero-vin-submit absolute right-1.5 sm:right-2.5 z-10",
                    "h-9 sm:h-10 md:h-11 rounded-lg sm:rounded-xl",
                    "px-3.5 sm:px-7 text-sm sm:text-[15px] font-semibold",
                    "shadow-md sm:shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow",
                  )}
                >
                  <VinCheckSubmitLabel />
                </Button>
              </div>

              <div className="hero-vin-segments flex gap-[2px] px-2 sm:px-3 pb-2 pt-0" aria-hidden>
                <VinSegments vinLen={vinLen} isComplete={isComplete} />
              </div>

              {showMessages && (
                <div className="hero-vin-card-messages space-y-2 px-3 pb-3 pt-1 border-t border-border/40 dark:border-white/[0.06]">
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
      </div>

      <WhereToFindVinHelp />
    </form>
  );
}
