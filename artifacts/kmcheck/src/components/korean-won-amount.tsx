import { cn } from "@/lib/utils";
import {
  convertKrwToUsd,
  formatKoreanWonPlain,
  formatUsdAmount,
  parseKrwFromText,
  resolveKrwPerUsd,
} from "@/lib/korean-currency";
import { normalizeKrwAmountText, sanitizeKoreanRepairKrwAmount } from "@workspace/korean-registry";

type Props = {
  /** Raw KRW amount */
  krw?: number | null;
  /** Provider text e.g. "2,566,720 won" or "136.6 million won" */
  text?: string | null;
  krwPerUsd?: number | null;
  className?: string;
  usdClassName?: string;
  wonClassName?: string;
};

export function KoreanWonAmount({
  krw,
  text,
  krwPerUsd,
  className,
  usdClassName,
  wonClassName,
}: Props) {
  const parsedFromText = text ? parseKrwFromText(normalizeKrwAmountText(text) ?? text) : null;
  const resolvedKrw = sanitizeKoreanRepairKrwAmount(krw ?? parsedFromText);
  if (resolvedKrw == null || resolvedKrw <= 0) return null;

  const rate = resolveKrwPerUsd(krwPerUsd);
  const usd = formatUsdAmount(convertKrwToUsd(resolvedKrw, rate));

  return (
    <span className={cn("tabular-nums inline-flex items-baseline gap-1 flex-wrap", className)}>
      <span className={cn("font-semibold", usdClassName)}>{usd}</span>
      <span className={cn("text-muted-foreground/50 font-normal text-[0.92em]", wonClassName)}>
        (₩{resolvedKrw.toLocaleString()})
      </span>
    </span>
  );
}

/** Plain string for print / PDF — USD primary, won in parentheses */
export function formatKoreanWonDisplay(
  input: number | string,
  krwPerUsd?: number | null,
): string | null {
  const krw = typeof input === "number" ? input : parseKrwFromText(input);
  if (krw == null || krw <= 0) return null;
  return formatKoreanWonPlain(krw, resolveKrwPerUsd(krwPerUsd));
}

export function textContainsWon(value: string): boolean {
  return /won|₩/i.test(value);
}
