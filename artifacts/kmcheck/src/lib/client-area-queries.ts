import type { QueryClient } from "@tanstack/react-query";

/** React Query keys for signed-in dashboard / purchases — always treat as live data. */
export const CLIENT_AREA_QUERY_ROOTS = [
  "/api/user/history",
  "/api/user/stats",
  "/api/user/payments",
] as const;

export function invalidateClientAreaQueries(queryClient: QueryClient): void {
  for (const root of CLIENT_AREA_QUERY_ROOTS) {
    void queryClient.invalidateQueries({ queryKey: [root] });
  }
}

export function refetchClientAreaQueries(queryClient: QueryClient): void {
  for (const root of CLIENT_AREA_QUERY_ROOTS) {
    void queryClient.refetchQueries({ queryKey: [root], type: "active" });
  }
}
