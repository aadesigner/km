import type { UseQueryOptions } from "@tanstack/react-query";

/** Fields commonly shared across queries — avoids spreading full UseQueryOptions<unknown>. */
export interface SharedQueryExtras {
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | "always";
  refetchOnReconnect?: boolean;
  retry?: UseQueryOptions["retry"];
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
}

/** Cast partial options for orval-generated hooks that type overrides as full UseQueryOptions. */
export function orvalQuery<TData = unknown, TError = unknown>(
  extras: SharedQueryExtras,
): UseQueryOptions<TData, TError> {
  return extras as UseQueryOptions<TData, TError>;
}

/** Marketing / legal pages — pricing, countries, etc. Rarely changes. */
export const STATIC_QUERY_OPTIONS: SharedQueryExtras = {
  staleTime: 30 * 60 * 1000,
  gcTime: 2 * 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

/** Signed-in client area — fresh enough for navigation without refetch storms. */
export const CLIENT_AREA_QUERY_OPTIONS: SharedQueryExtras = {
  staleTime: 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: true,
};

/** @deprecated Use CLIENT_AREA_QUERY_OPTIONS */
export const AUTH_QUERY_OPTIONS = CLIENT_AREA_QUERY_OPTIONS;

/** Checkout / payment — always verify live before charging. */
export const CHECKOUT_QUERY_OPTIONS: SharedQueryExtras = {
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  refetchOnMount: "always",
  refetchOnReconnect: true,
};
