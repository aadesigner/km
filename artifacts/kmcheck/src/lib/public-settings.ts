import type { QueryClient } from "@tanstack/react-query";
import { STATIC_QUERY_OPTIONS } from "@/lib/query-options";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Single React Query key for GET /api/payments/public-settings (all consumers share cache). */
export const PUBLIC_SETTINGS_QUERY_KEY = ["/api/payments/public-settings"] as const;

export type PublicSettingsPayload = Record<string, unknown>;

export async function fetchPublicSettings(signal?: AbortSignal): Promise<PublicSettingsPayload> {
  const r = await fetch(`${basePath}/api/payments/public-settings`, { signal });
  if (!r.ok) throw new Error(`public_settings_${r.status}`);
  return r.json() as Promise<PublicSettingsPayload>;
}

export function publicSettingsQueryOptions() {
  return {
    queryKey: PUBLIC_SETTINGS_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) => fetchPublicSettings(signal),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  };
}

/** Idle warm-cache for marketing + client shells. */
export function prefetchPublicSettings(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    ...publicSettingsQueryOptions(),
    ...STATIC_QUERY_OPTIONS,
  });
}
