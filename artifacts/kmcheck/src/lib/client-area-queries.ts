import type { QueryClient } from "@tanstack/react-query";

/** React Query keys for signed-in dashboard / purchases — always treat as live data. */
export const CLIENT_AREA_QUERY_ROOTS = [
  "/api/user/history",
  "/api/user/stats",
  "/api/user/payments",
] as const;

export function invalidateClientAreaQueries(queryClient: QueryClient): void {
  for (const root of CLIENT_AREA_QUERY_ROOTS) {
    void queryClient.invalidateQueries({ queryKey: [root], refetchType: "all" });
  }
}

export function refetchClientAreaQueries(queryClient: QueryClient): void {
  for (const root of CLIENT_AREA_QUERY_ROOTS) {
    void queryClient.refetchQueries({ queryKey: [root], type: "active" });
  }
}

/**
 * After a purchase / VIN unlock, force-refresh client-area data.
 * These queries use `refetchOnMount: false`, so a plain invalidate (which only
 * refetches *active* observers) wouldn't refresh the dashboard when it later
 * remounts. `refetchType: "all"` refetches the cached (inactive) queries too,
 * so a newly unlocked VIN shows up immediately when the user returns.
 */
export function refreshClientAreaAfterUnlock(queryClient: QueryClient): void {
  for (const root of CLIENT_AREA_QUERY_ROOTS) {
    void queryClient.invalidateQueries({ queryKey: [root], refetchType: "all" });
  }
}
