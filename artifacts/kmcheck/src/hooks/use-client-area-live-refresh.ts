import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { normalizeClientPath } from "@/lib/dashboard-nav";
import { refetchClientAreaQueries } from "@/lib/client-area-queries";

const VISIBILITY_REFETCH_MS = 90_000;

function isClientAreaPath(path: string, lang: string): boolean {
  const base = `/${lang}`;
  return (
    path === `${base}/dashboard`
    || path.startsWith(`${base}/dashboard/`)
    || path === `${base}/purchases`
    || path.startsWith(`${base}/purchases/`)
  );
}

function clientAreaPathKey(path: string): string | null {
  const lang = path.split("/")[1];
  if (!lang || !isClientAreaPath(path, lang)) return null;
  return lang;
}

/** Refetch dashboard data after a long idle tab return. */
export function useClientAreaLiveRefresh(): void {
  const queryClient = useQueryClient();
  const { isSignedIn, isLoaded } = useAuth();
  const lastRefetchAtRef = useRef(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const maybeRefetch = () => {
      const now = Date.now();
      if (now - lastRefetchAtRef.current < VISIBILITY_REFETCH_MS) return;
      lastRefetchAtRef.current = now;
      refetchClientAreaQueries(queryClient);
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const path = normalizeClientPath(window.location.pathname);
      if (!clientAreaPathKey(path)) return;
      maybeRefetch();
    };

    document.addEventListener("visibilitychange", onVisible);
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      onVisible();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [isLoaded, isSignedIn, queryClient]);
}
