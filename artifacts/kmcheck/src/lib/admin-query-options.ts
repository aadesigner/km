import { getErrorStatus } from "@/lib/api-error";

function shouldRetryAdminQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  const status = getErrorStatus(error);
  if (status === 401 || status === 403 || status === 404 || status === 429) return false;
  if (status && status >= 400 && status < 500) return false;
  return true;
}

/** Shared React Query options for admin pages — tolerate cold starts without error flashes. */
export const ADMIN_QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true,
  retry: shouldRetryAdminQuery,
} as const;
