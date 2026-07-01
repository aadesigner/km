import { useTranslation } from "@/i18n/context";
import { KmcheckPrintLogo } from "@/components/logo";

const PRINT_LOCALE: Record<string, string> = {
  en: "en-US",
  ar: "ar",
  uk: "uk-UA",
  ru: "ru-RU",
  sq: "sq-AL",
};

type PrintReportBrandingProps = {
  vin: string;
  variant?: "full" | "top" | "bottom";
};

/** Legacy print strips — hidden when VinPrintSummary is used (see print CSS). */
export function PrintReportBranding({
  vin,
  variant = "full",
}: PrintReportBrandingProps) {
  const { t, language, dir } = useTranslation();

  const dateStr = new Date().toLocaleDateString(PRINT_LOCALE[language] ?? "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const showTop = variant === "full" || variant === "top";
  const showBottom = variant === "full" || variant === "bottom";

  return (
    <>
      {showTop && (
        <div
          className="hidden print:block mb-2 print-brand-top"
          dir={dir}
          aria-hidden="true"
        >
          <div className="border-b border-border/50 pb-2 flex items-center justify-between gap-4">
            <KmcheckPrintLogo className="h-5" />
            <div className="shrink-0 text-end text-[8pt] text-muted-foreground leading-snug">
              <p className="font-mono font-semibold text-foreground text-[8.5pt]">{vin}</p>
              <p>{t("print_brand_generated_label")}: {dateStr}</p>
            </div>
          </div>
        </div>
      )}

      {showBottom && (
        <div
          className="hidden print:block mt-2 pt-1.5 border-t border-border/40 print-brand-bottom"
          dir={dir}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between gap-4 text-[7.5pt] text-muted-foreground">
            <KmcheckPrintLogo className="h-5" />
            <div className="shrink-0 text-end leading-snug">
              <p className="font-mono font-semibold text-foreground text-[8pt]">{vin}</p>
              <p>{t("print_brand_generated_label")}: {dateStr}</p>
            </div>
          </div>
          <p className="text-[6.5pt] text-muted-foreground/80 text-center mt-1 leading-snug">
            {t("print_brand_disclaimer")}
          </p>
        </div>
      )}
    </>
  );
}
