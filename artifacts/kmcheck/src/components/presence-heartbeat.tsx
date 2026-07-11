import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const HEARTBEAT_MS = 120_000;
const MIN_RESEND_MS = 90_000;

/** Lightweight signed-in user presence — throttled client + server. Skips admin accounts. */
export function PresenceHeartbeat() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [location] = useLocation();
  const lastSentRef = useRef({ path: "", at: 0 });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || user?.isAdmin) return;

    const pathname = location.split("?")[0]?.split("#")[0] ?? location;

    const ping = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (
        lastSentRef.current.path === pathname
        && now - lastSentRef.current.at < MIN_RESEND_MS
      ) {
        return;
      }
      lastSentRef.current = { path: pathname, at: now };
      void fetch(`${basePath}/api/auth/presence`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {});
    };

    ping();
    const intervalId = window.setInterval(ping, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLoaded, isSignedIn, user?.isAdmin, location]);

  return null;
}
