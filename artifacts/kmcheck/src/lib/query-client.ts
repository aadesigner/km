import { QueryClient } from "@tanstack/react-query";
import { getErrorStatus } from "@/lib/api-error";

const MAX_QUERY_RETRIES = 4;

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  const status = getErrorStatus(error);
  if (status === 401 || status === 403 || status === 404 || status === 429) return false;
  if (status && status >= 400 && status < 500) return false;
  // 5xx and network errors (no status) — common on cold Railway / DB wake-up.
  return true;
}

function queryRetryDelay(attemptIndex: number): number {
  return Math.min(750 * 2 ** attemptIndex, 8_000);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60_000,
      gcTime: 60 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
    },
    mutations: {
      retry: 0,
    },
  },
});
