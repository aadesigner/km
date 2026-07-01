export const PENDING_VIN_KEY = "pending_vin";
export const CHECKOUT_VIN_KEY = "checkout_vin";
export const AUTH_RETURN_PATH_KEY = "auth_return_path";
export const DECODER_PENDING_VIN_KEY = "decoder_pending_vin";

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

/**
 * Build navigation target when user unlocks a full report from a decoded VIN.
 * - Signed in → checkout with ?vin= (also in sessionStorage)
 * - Signed out → sign-in; pending_vin is kept for post-login/register redirect (see auth.tsx)
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
    href: `/${language}/sign-in`,
  };
}

/** Guest VIN check → sign-in with pending VIN stored (unified across marketing pages). */
export function redirectGuestForVinCheckout(vin: string, language: string): string | null {
  const normalized = persistVinForCheckout(vin);
  if (!normalized) return null;
  return `/${language}/sign-in`;
}

/** After auth, where to send the user if a checkout VIN is waiting. */
export function getPostAuthCheckoutPath(language: string): string | null {
  const pending = sessionStorage.getItem(PENDING_VIN_KEY);
  if (pending) {
    sessionStorage.setItem(CHECKOUT_VIN_KEY, pending);
    sessionStorage.removeItem(PENDING_VIN_KEY);
    return `/${language}/checkout?vin=${encodeURIComponent(pending)}`;
  }
  const stored = sessionStorage.getItem(CHECKOUT_VIN_KEY);
  if (stored) {
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
