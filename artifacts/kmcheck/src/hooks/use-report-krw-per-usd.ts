import { resolveKrwPerUsd } from "@/lib/korean-currency";
import { useKrwPerUsd } from "@/hooks/use-krw-per-usd";

/** Prefer the rate frozen on the report; fall back to live admin settings for legacy data. */
export function useReportKrwPerUsd(stored?: number | null): number {
  const liveRate = useKrwPerUsd();
  if (typeof stored === "number" && stored > 0) return stored;
  return liveRate;
}

export function resolveReportKrwPerUsd(stored: number | null | undefined, fallback: number): number {
  if (typeof stored === "number" && stored > 0) return stored;
  return resolveKrwPerUsd(fallback);
}
