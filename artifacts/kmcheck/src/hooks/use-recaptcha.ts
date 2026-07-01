import { useEffect, useRef, useCallback, useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const SCRIPT_WAIT_MS = 10_000;
const POLL_MS = 100;
const SETTINGS_CACHE_MS = 60_000;

/** Mirror server: reCAPTCHA keys are domain-bound and fail on LAN / Tailscale. */
function isClientPrivateDevHost(): boolean {
  if (import.meta.env.PROD) return false;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".ts.net")) {
    return true;
  }
  const parts = hostname.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => Number.isInteger(p) && p >= 0 && p <= 255)) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

type RcSettings = { enabled: boolean; siteKey: string | null };

let _cached: RcSettings | null = null;
let _cachedAt = 0;
let _inflight: Promise<RcSettings> | null = null;

function parseRecaptchaSettings(d: {
  recaptchaEnabled?: boolean;
  recaptchaSiteKey?: string | null;
}): RcSettings {
  const privateDev = isClientPrivateDevHost();
  if (privateDev) return { enabled: false, siteKey: null };

  const siteKey = d.recaptchaSiteKey?.trim() || null;
  const enabled = d.recaptchaEnabled === true && !!siteKey;
  return { enabled, siteKey: enabled ? siteKey : null };
}

export function invalidateRecaptchaSettingsCache(): void {
  _cached = null;
  _cachedAt = 0;
  _inflight = null;
}

export function fetchRecaptchaSettings(force = false): Promise<RcSettings> {
  const cacheFresh = _cached && Date.now() - _cachedAt < SETTINGS_CACHE_MS;
  if (!force && cacheFresh && _cached) return Promise.resolve(_cached);
  if (_inflight) return _inflight;

  _inflight = fetch(`${basePath}/api/payments/public-settings`)
    .then(async (r) => {
      if (!r.ok) return { enabled: false, siteKey: null } as RcSettings;
      const d = (await r.json()) as {
        recaptchaEnabled?: boolean;
        recaptchaSiteKey?: string | null;
      };
      return parseRecaptchaSettings(d);
    })
    .catch(() => ({ enabled: false, siteKey: null } as RcSettings))
    .then((settings) => {
      _cached = settings;
      _cachedAt = Date.now();
      return settings;
    })
    .finally(() => {
      _inflight = null;
    });

  return _inflight;
}

function waitForGrecaptcha(siteKey: string, timeoutMs = SCRIPT_WAIT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    const onReady = () => {
      if (typeof window.grecaptcha === "undefined") {
        resolve(false);
        return;
      }
      window.grecaptcha.ready(() => resolve(true));
    };

    if (typeof window.grecaptcha !== "undefined") {
      onReady();
      return;
    }

    const deadline = Date.now() + timeoutMs;
    const poll = setInterval(() => {
      if (typeof window.grecaptcha !== "undefined") {
        clearInterval(poll);
        onReady();
      } else if (Date.now() >= deadline) {
        clearInterval(poll);
        resolve(false);
      }
    }, POLL_MS);
  });
}

function injectRecaptchaScript(siteKey: string): void {
  if (document.getElementById("recaptcha-v3-script")) return;
  const script = document.createElement("script");
  script.id = "recaptcha-v3-script";
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
  script.async = true;
  document.head.appendChild(script);
}

export function useRecaptcha() {
  const [settings, setSettings] = useState<RcSettings>({ enabled: false, siteKey: null });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const scriptInjected = useRef(false);

  useEffect(() => {
    fetchRecaptchaSettings().then((s) => {
      setSettings(s);
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const { enabled, siteKey } = settings;
    if (!enabled || !siteKey) {
      setScriptReady(true);
      scriptInjected.current = false;
      return;
    }

    setScriptReady(false);
    if (!scriptInjected.current) {
      injectRecaptchaScript(siteKey);
      scriptInjected.current = true;
    }

    let cancelled = false;
    waitForGrecaptcha(siteKey).then((ok) => {
      if (!cancelled) setScriptReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [settings.enabled, settings.siteKey]);

  const getToken = useCallback(async (action = "default"): Promise<string | null> => {
    const current = await fetchRecaptchaSettings(true);
    if (!current.enabled || !current.siteKey) return null;

    if (!document.getElementById("recaptcha-v3-script")) {
      injectRecaptchaScript(current.siteKey);
    }

    const ready = await waitForGrecaptcha(current.siteKey);
    if (!ready) return null;

    try {
      return await window.grecaptcha.execute(current.siteKey, { action });
    } catch {
      return null;
    }
  }, []);

  const enabled = settings.enabled;
  const ready = settingsLoaded && (!enabled || scriptReady);

  return { getToken, enabled, ready, settingsLoaded };
}
