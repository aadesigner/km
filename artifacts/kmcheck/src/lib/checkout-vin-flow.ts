export const PENDING_VIN_KEY = "pending_vin";
export const CHECKOUT_VIN_KEY = "checkout_vin";
export const AUTH_RETURN_PATH_KEY = "auth_return_path";
export const DECODER_PENDING_VIN_KEY = "decoder_pending_vin";
export const PAYPAL_CHECKOUT_SESSION_KEY = "kmcheck_paypal_checkout";
/** Set when redirecting to checkout after auth — checkout must prefill VIN only, not auto-start payment. */
export const CHECKOUT_PREFILL_ONLY_KEY = "checkout_prefill_only";

export const VIN_FORMAT_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

export type PendingVinPeek = {
  dataAvailable?: boolean;
  fromCache?: boolean;
  alreadyUnlocked?: boolean;
  manualPending?: boolean;
};

export function normalizeCheckoutVin(vin: string): string {
  return vin.trim().toUpperCase();
}

/** Read pending/checkout VIN from sessionStorage; clears invalid entries. */
export function readStoredPendingVin(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_VIN_KEY) || sessionStorage.getItem(CHECKOUT_VIN_KEY);
  if (!raw) return null;
  const normalized = normalizeCheckoutVin(raw);
  if (!VIN_FORMAT_RE.test(normalized)) {
    sessionStorage.removeItem(PENDING_VIN_KEY);
    sessionStorage.removeItem(CHECKOUT_VIN_KEY);
    return null;
  }
  return normalized;
}

export function clearStoredPendingVin(): void {
  sessionStorage.removeItem(PENDING_VIN_KEY);
  sessionStorage.removeItem(CHECKOUT_VIN_KEY);
}

/** True when VIN is in local-exists / catalog and the user has not already unlocked it. */
export function isEligiblePendingVin(peek: PendingVinPeek): boolean {
  if (peek.alreadyUnlocked) return false;
  if (peek.dataAvailable === true) return true;
  if (peek.fromCache === true) return true;
  return false;
}

/** Persist VIN for checkout (sessionStorage). Returns normalized VIN or null if not 17 chars. */
export function persistVinForCheckout(vin: string): string | null {
  const normalized = normalizeCheckoutVin(vin);
  if (normalized.length !== 17) return null;
  sessionStorage.setItem(CHECKOUT_VIN_KEY, normalized);
  sessionStorage.setItem(PENDING_VIN_KEY, normalized);
  return normalized;
}

export type UnlockCheckoutTarget = {
  href: string;
  vin: string;
};

/** Where guests land when a VIN check requires an account (register, not login). */
export function guestVinAuthPath(language: string): string {
  return `/${language}/sign-up`;
}

/**
 * Build navigation target when user unlocks a full report from a decoded VIN.
 * - Signed in → checkout with ?vin= (also in sessionStorage)
 * - Signed out → sign-up; pending_vin is kept for post-auth redirect (see auth.tsx)
 */
export function buildUnlockCheckoutTarget(
  vin: string,
  language: string,
  isSignedIn: boolean,
): UnlockCheckoutTarget | null {
  const normalized = persistVinForCheckout(vin);
  if (!normalized) return null;

  if (isSignedIn) {
    return {
      vin: normalized,
      href: `/${language}/checkout?vin=${encodeURIComponent(normalized)}`,
    };
  }

  return {
    vin: normalized,
    href: guestVinAuthPath(language),
  };
}

/** Guest VIN check → sign-up with pending VIN stored (unified across marketing pages). */
export function redirectGuestForVinCheckout(vin: string, language: string): string | null {
  const normalized = persistVinForCheckout(vin);
  if (!normalized) return null;
  return guestVinAuthPath(language);
}

export function clearCheckoutPaymentResumeState(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PAYPAL_CHECKOUT_SESSION_KEY);
}

export function markCheckoutPrefillOnly(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(CHECKOUT_PREFILL_ONLY_KEY, "1");
}

export function buildPrefillOnlyCheckoutPath(vin: string, language: string): string | null {
  const normalized = normalizeCheckoutVin(vin);
  if (!VIN_FORMAT_RE.test(normalized)) return null;
  sessionStorage.setItem(CHECKOUT_VIN_KEY, normalized);
  clearCheckoutPaymentResumeState();
  markCheckoutPrefillOnly();
  return `/${language}/checkout?vin=${encodeURIComponent(normalized)}`;
}

/** True once after post-auth checkout redirect; clears the flag when read. */
export function consumeCheckoutPrefillOnly(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const flagged = sessionStorage.getItem(CHECKOUT_PREFILL_ONLY_KEY) === "1";
  if (flagged) sessionStorage.removeItem(CHECKOUT_PREFILL_ONLY_KEY);
  return flagged;
}

function preparePostAuthCheckoutLanding(): void {
  clearCheckoutPaymentResumeState();
  markCheckoutPrefillOnly();
}

/** After auth, where to send the user if a checkout VIN is waiting. */
export function getPostAuthCheckoutPath(language: string): string | null {
  const pending = sessionStorage.getItem(PENDING_VIN_KEY);
  if (pending) {
    sessionStorage.setItem(CHECKOUT_VIN_KEY, pending);
    sessionStorage.removeItem(PENDING_VIN_KEY);
    preparePostAuthCheckoutLanding();
    return `/${language}/checkout?vin=${encodeURIComponent(pending)}`;
  }
  const stored = sessionStorage.getItem(CHECKOUT_VIN_KEY);
  if (stored) {
    preparePostAuthCheckoutLanding();
    return `/${language}/checkout?vin=${encodeURIComponent(stored)}`;
  }
  return null;
}

/** After auth, where to send the user (return path, pending checkout, or dashboard). */
export function getPostAuthRedirectPath(language: string): string {
  const returnPath = sessionStorage.getItem(AUTH_RETURN_PATH_KEY);
  if (returnPath) {
    sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
    return returnPath.startsWith("/") ? returnPath : `/${language}${returnPath}`;
  }
  return getPostAuthCheckoutPath(language) ?? `/${language}/dashboard`;
}
