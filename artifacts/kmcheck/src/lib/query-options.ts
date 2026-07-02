/** Marketing / legal pages — pricing, countries, etc. Rarely changes. */
export const STATIC_QUERY_OPTIONS = {
  staleTime: 30 * 60 * 1000,
  gcTime: 2 * 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
} as const;

/** Signed-in client area — fresh enough for navigation without refetch storms. */
export const CLIENT_AREA_QUERY_OPTIONS = {
  staleTime: 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: true,
} as const;

/** @deprecated Use CLIENT_AREA_QUERY_OPTIONS */
export const AUTH_QUERY_OPTIONS = CLIENT_AREA_QUERY_OPTIONS;

/** Checkout / payment — always verify live before charging. */
export const CHECKOUT_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
  refetchOnReconnect: true,
} as const;
