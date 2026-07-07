import { useEffect } from "react";
import { useLocation } from "wouter";
import { AUTH_BANNED_STORAGE_KEY } from "@/lib/auth-context";

const LANGS = ["en", "es", "uk", "ru", "ro", "ar", "sq"];

/** Sends users with a revoked banned session to sign-in with the suspension message. */
export function BannedSessionRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_BANNED_STORAGE_KEY) !== "1") return;
    sessionStorage.removeItem(AUTH_BANNED_STORAGE_KEY);
    const lang = LANGS.find((code) => window.location.pathname.startsWith(`/${code}/`)) ?? "en";
    setLocation(`/${lang}/sign-in?error=banned`);
  }, [setLocation]);

  return null;
}
