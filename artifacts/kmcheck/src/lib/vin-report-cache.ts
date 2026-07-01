import type { QueryClient } from "@tanstack/react-query";

/** React Query options for authenticated VIN report pages. */
export const VIN_REPORT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase();
}

function queryKeyMatchesVinReport(
  queryKey: readonly unknown[],
  vinUpper: string,
  lookupId?: number,
): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
  const first = queryKey[0];
  if (first === "/api/vin/public" && normalizeVin(String(queryKey[1] ?? "")) === vinUpper) {
    return true;
  }
  if (first === "/api/vin" && queryKey[1] === "vin" && normalizeVin(String(queryKey[2] ?? "")) === vinUpper) {
    return true;
  }
  if (
    lookupId != null &&
    first === "/api/vin" &&
    queryKey[1] === "id" &&
    queryKey[2] === lookupId
  ) {
    return true;
  }
  if (typeof first === "string" && first.startsWith("/api/vin/")) {
    const segment = first.slice("/api/vin/".length);
    if (normalizeVin(segment) === vinUpper) return true;
    if (lookupId != null && segment === String(lookupId)) return true;
  }
  return false;
}

/** Mark VIN report client caches stale so the next fetch loads fresh server data. */
export function invalidateVinReportCaches(
  queryClient: QueryClient,
  vin: string,
  lookupId?: number,
): void {
  const vinUpper = normalizeVin(vin);
  const matchesVinReport = (query: { queryKey: readonly unknown[]; state: { data?: unknown } }) => {
    if (queryKeyMatchesVinReport(query.queryKey, vinUpper, lookupId)) return true;
    const data = query.state.data as { vin?: string; id?: number } | undefined;
    if (data?.vin && normalizeVin(data.vin) === vinUpper) return true;
    if (lookupId != null && data?.id === lookupId) return true;
    return false;
  };

  void queryClient.invalidateQueries({ predicate: (query) => matchesVinReport(query) });
  void queryClient.refetchQueries({ predicate: (query) => matchesVinReport(query), type: "active" });
}
