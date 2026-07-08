import { useEffect } from "react";
import { Check } from "lucide-react";
import { FlagImg, prefetchFlags, type FlagVariant } from "@/components/flag-img";
import { LANG_PICKER_OPTIONS, type Language } from "@/lib/languages";
import { cn } from "@/lib/utils";

export function usePrefetchPickerFlags(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    prefetchFlags(LANG_PICKER_OPTIONS.map((l) => l.flag));
  }, [open]);
}

export function LangPickerList({
  language,
  onSelect,
  tone = "nav",
  flagVariant = tone === "nav" ? "compact" : "default",
}: {
  language: Language;
  onSelect: (code: Language) => void;
  tone?: "nav" | "footer";
  flagVariant?: FlagVariant;
}) {
  const isFooter = tone === "footer";

  return (
    <div
      role="listbox"
      className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-[min(18rem,70vh)] overflow-y-auto overscroll-contain"
    >
      {LANG_PICKER_OPTIONS.map((l) => {
        const active = language === l.code;
        return (
          <button
            key={l.code}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(l.code)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-xl text-left min-w-0 transition-colors",
              isFooter
                ? active
                  ? "bg-primary/15 text-white"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                : active
                  ? "bg-primary/[0.08] text-primary"
                  : "text-foreground hover:bg-primary/[0.06]",
            )}
          >
            <FlagImg code={l.flag} variant={flagVariant} priority={active} />
            <span className={cn("text-[13px] truncate flex-1", active && "font-semibold")}>{l.label}</span>
            {active && <Check className="h-3 w-3 text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
