import { type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CoverageCountryNameKey } from "@/lib/country-names-all-locales";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

type Props = {
  nameKey: CoverageCountryNameKey;
  children: ReactNode;
  className?: string;
};

export function CountryFlagTooltip({ nameKey, children, className }: Props) {
  const { t } = useTranslation();
  const label = t(nameKey);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex cursor-default items-center border-0 bg-transparent p-0 outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center" sideOffset={6} className="z-[120] text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
