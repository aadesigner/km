import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { useRecaptcha, obtainRecaptchaToken } from "@/hooks/use-recaptcha";
import { useLocation } from "wouter";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo";
import { parseLangFromPath } from "@/lib/seo-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check, CheckCircle2, Tag, X, Loader2, ShieldCheck,
  Lock, Gauge, AlertTriangle, Users, Car, Zap, TrendingUp, ChevronDown, CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { translateClientError, translateCouponError } from "@/lib/translate-client-error";
import { useQueryRecovery } from "@/hooks/use-query-recovery";
import { CHECKOUT_QUERY_OPTIONS } from "@/lib/query-options";
import { refreshClientAreaAfterUnlock } from "@/lib/client-area-queries";
import { formatVehicleTitle, isTrustworthyVinDecode, shouldShowPendingVinDoubleCheck } from "@/lib/vin-decode-preview";
import { isVehicleTooOldForLookup } from "@workspace/vin-decode";
import { CHECKOUT_VIN_KEY, PENDING_VIN_KEY, normalizeCheckoutVin, guestVinAuthPath } from "@/lib/checkout-vin-flow";
import { cn } from "@/lib/utils";
import { VinLookupDisabledBanner } from "@/components/vin-lookup-disabled-banner";
import { CheckoutPaymentLogos } from "@/components/checkout-payment-logos";
import { VinDecodeRecheckHint } from "@/components/vin-decode-recheck-hint";
import { VinPendingDoubleCheckHint } from "@/components/vin-pending-double-check-hint";
import { useVinLookupDisabledForUser } from "@/hooks/use-site-public-flags";
import { useTheme } from "@/components/theme-provider";

const PAYPAL_CHECKOUT_SESSION_KEY = "kmcheck_paypal_checkout";

function isPaypalUserAbort(err: unknown): boolean {
  const msg =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : String(err);
  return /popup close|window closed|can not open popup|cancel|detected pop-?up|popup closed|component closed|global_close|zoid_closed|destroyed|user closed/i.test(msg);
}

function paypalHostedFieldStyles(): Record<string, Record<string, string>> {
  const root = getComputedStyle(document.documentElement);
  const fg = root.getPropertyValue("--foreground").trim();
  const font = root.getPropertyValue("font-family").trim() || "inherit";
  return {
    input: {
      "font-size": "14px",
      "font-family": font,
      color: fg ? `hsl(${fg})` : "inherit",
    },
    ".invalid": { color: "hsl(0 84% 60%)" },
  };
}

const PREVIEW_ROW = "px-5 py-3 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] last:border-0";
const PREVIEW_LBL = "text-[12px] font-medium text-muted-foreground dark:text-white/40";
const PREVIEW_ICO = "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 dark:text-white/25";
const PREVIEW_BLUR = "text-[12px] font-semibold tabular-nums text-foreground/80 select-none blur-[3.5px]";

type PaypalHostedFieldsInstance = {
  submit: (opts?: { contingencies?: string[] }) => Promise<{ orderId: string; liabilityShifted?: boolean }>;
  on: (event: string, handler: (evt: unknown) => void) => void;
  teardown?: () => Promise<void> | void;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (el: string | HTMLElement) => Promise<void>; close: () => void };
      HostedFields?: {
        isEligible: () => boolean;
        render: (opts: {
          createOrder: () => Promise<string>;
          fields: {
            number?: { selector: string; placeholder?: string };
            cvv?: { selector: string; placeholder?: string };
            expirationDate?: { selector: string; placeholder?: string };
          };
          styles?: Record<string, Record<string, string>>;
        }) => Promise<PaypalHostedFieldsInstance>;
      };
    };
  }
}

interface PublicSettings {
  paypalClientId: string | null;
  paypalSandbox: boolean;
  recaptchaEnabled: boolean;
  recaptchaSiteKey: string | null;
  paypalEnableCards: boolean;
}

interface CouponResult {
  valid: boolean;
  code: string;
  type: "percent" | "flat";
  value: number;
  discountAmount: number;
  finalPrice: number;
  isFree: boolean;
}

interface VinPeek {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  engine: string | null;
  country: string | null;
  wmi: string;
  decodeSource?: "cache" | "nhtsa" | "local" | "hybrid";
  fromCache: boolean;
  localDecode: boolean;
  dataAvailable?: boolean;
  manualPending?: boolean;
  vinNoAccess?: boolean;
  checkUnavailable?: boolean;
  checkUnavailableCode?: string;
  vehicleTooOld?: boolean;
  alreadyUnlocked?: boolean;
  lookupId?: number | null;
  deliveryInProgress?: boolean;
  pendingFreeCouponPaymentId?: number | null;
}

interface Props {
  params: { lang: string };
}


export default function Checkout({ params }: Props) {
  const { t, language } = useTranslation();
  const { isSignedIn, isLoaded, user } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { getToken: getRecaptchaToken, enabled: rcEnabled, ready: rcReady } = useRecaptcha();
  const { resolvedTheme } = useTheme();

  const LOCKED_ROWS = [
    { icon: Gauge,         labelKey: "mileage_verification", blur: "47,832 km" },
    { icon: AlertTriangle, labelKey: "accident_history",     blur: "2 records" },
    { icon: Users,         labelKey: "previous_owners",      blur: "3 owners" },
    { icon: Car,           labelKey: "report_salvage",       blurKey: "checkout_mock_not_flagged" },
    { icon: ShieldCheck,   labelKey: "theft_records",        blurKey: "checkout_mock_not_reported" },
    { icon: TrendingUp,    labelKey: "market_value",         blur: "€8,400" },
  ];

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [vin, setVin] = useState(() => {
    // URL query param takes precedence (e.g. from public VIN page unlock CTA)
    const urlVin = new URLSearchParams(window.location.search).get("vin");
    if (urlVin) {
      const normalized = urlVin.trim().toUpperCase();
      sessionStorage.setItem("checkout_vin", normalized);
      return normalized;
    }
    // Consume pending_vin if checkout_vin is not already set
    const checkoutVin = sessionStorage.getItem("checkout_vin");
    if (checkoutVin) return checkoutVin;
    const pendingVin = sessionStorage.getItem("pending_vin");
    if (pendingVin) {
      sessionStorage.setItem("checkout_vin", pendingVin);
      sessionStorage.removeItem("pending_vin");
      return pendingVin;
    }
    return "";
  });
  const [vinError, setVinError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [status, setStatus] = useState<"idle" | "creating" | "paying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [payMethod, setPayMethod] = useState<"paypal" | "card">("paypal");
  const [hostedFieldsReady, setHostedFieldsReady] = useState(false);
  // "unknown" = SDK not yet checked, "yes" = eligible, "no" = confirmed ineligible
  const [cardEligible, setCardEligible] = useState<"unknown" | "yes" | "no">("unknown");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalInstanceRef = useRef<ReturnType<NonNullable<typeof window.paypal>["Buttons"]> | null>(null);
  /** Order created on "Proceed" so PayPal can open checkout immediately (async createOrder delays popup → blocked). */
  const pendingPaypalOrderRef = useRef<string | null>(null);
  /** Ignore spurious PayPal onError/onCancel while capture + lookup are running. */
  const paypalFlowPhaseRef = useRef<"idle" | "approving" | "fulfilling" | "done">("idle");
  const paidDeliveryRetryRef = useRef(false);
  const paypalResumeAttemptedRef = useRef(false);
  const freeCouponPaymentIdRef = useRef<number | null>(null);
  const checkoutActiveRef = useRef(true);
  const hostedFieldsRef = useRef<PaypalHostedFieldsInstance | null>(null);
  const hostedFieldsCreateOrderRef = useRef<(() => Promise<string>) | null>(null);

  const { data: pubSettings, isLoading: pubSettingsLoading, isError: pubSettingsError, isFetching: pubSettingsFetching, refetch: refetchPubSettings } = useQuery<PublicSettings>({
    queryKey: ["/api/payments/public-settings"],
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/payments/public-settings`);
      if (!r.ok) throw new Error("public_settings_failed");
      return r.json() as Promise<PublicSettings>;
    },
    ...CHECKOUT_QUERY_OPTIONS,
  });
  useQueryRecovery(pubSettingsError && !!pubSettings, pubSettingsFetching, refetchPubSettings);

  // VIN peek — only fires when VIN is exactly 17 chars, has no invalid chars, and user is signed in
  const normalizedVin = vin.trim().toUpperCase();
  const vinHasInvalidChars = /[IOQ]/.test(normalizedVin);
  const vinIsValid = normalizedVin.length === 17 && !vinHasInvalidChars;

  const {
    data: peek,
    isFetching: peekLoading,
    isError: peekError,
  } = useQuery<VinPeek>({
    queryKey: ["/api/vin/peek", normalizedVin],
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/vin/peek/${normalizedVin}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("peek_error");
      return r.json() as Promise<VinPeek>;
    },
    enabled: vinIsValid && !!isSignedIn,
    retry: false,
    ...CHECKOUT_QUERY_OPTIONS,
  });

  const {
    displayPrice: salePrice,
    basePrice: standardPrice,
    isDiscount,
    loading: pricingLoading,
    fmtPrice,
    currency,
  } = useDisplayPrice();
  const promoDiscountAmount =
    isDiscount && standardPrice != null && salePrice != null
      ? Math.max(0, standardPrice - salePrice)
      : 0;
  const subtotalPrice = salePrice ?? 0;
  const finalPrice = couponResult ? couponResult.finalPrice : subtotalPrice;
  const couponDiscountAmount = couponResult?.discountAmount ?? 0;
  const promoSavePercent =
    isDiscount && standardPrice && salePrice && standardPrice > 0
      ? Math.round((promoDiscountAmount / standardPrice) * 100)
      : 0;

  // Redirect to sign-up if not authenticated (wait until auth has loaded)
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      if (vin) sessionStorage.setItem("pending_vin", vin);
      setLocation(guestVinAuthPath(language));
    }
  }, [isLoaded, isSignedIn, language, setLocation, vin]);

  useEffect(() => {
    checkoutActiveRef.current = true;
    return () => { checkoutActiveRef.current = false; };
  }, []);

  // Reset payment state whenever the VIN changes — prevents stale "no data" / error UI bleeding across VINs
  useEffect(() => {
    setStatus("idle");
    setErrorMsg("");
    pendingPaypalOrderRef.current = null;
    paypalFlowPhaseRef.current = "idle";
    paidDeliveryRetryRef.current = false;
    paypalResumeAttemptedRef.current = false;
    paypalInstanceRef.current?.close();
    paypalInstanceRef.current = null;
  }, [normalizedVin]);

  // Surface invalid-character error as soon as the user reaches 17 chars
  useEffect(() => {
    if (normalizedVin.length === 17 && vinHasInvalidChars) {
      setVinError(t("vin_error_invalid_chars"));
    }
  }, [normalizedVin, vinHasInvalidChars]);

  // Redirect to existing report if VIN already unlocked
  useEffect(() => {
    if (peek?.alreadyUnlocked && peek.lookupId && normalizedVin.length === 17) {
      goToVinReport(normalizedVin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect once when peek resolves
  }, [peek?.alreadyUnlocked, peek?.lookupId, normalizedVin]);

  // Inject PayPal SDK once we have the client ID; include hosted-fields component when cards enabled
  useEffect(() => {
    if (!pubSettings?.paypalClientId) return;
    const enableCards = pubSettings.paypalEnableCards ?? false;
    const components = enableCards ? "buttons,hosted-fields" : "buttons";
    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      const needsReload = enableCards && !existing.getAttribute("src")?.includes("hosted-fields");
      if (!needsReload) return;
      existing.remove();
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${pubSettings.paypalClientId}&currency=${currency}&intent=capture&components=${components}`;
    script.async = true;
    document.body.appendChild(script);
    return () => { document.getElementById("paypal-sdk")?.remove(); };
  }, [pubSettings?.paypalClientId, pubSettings?.paypalEnableCards, currency]);

  // Post-SDK probe: check HostedFields eligibility after SDK loads, independently of tab.
  // Only sets "no" for confirmed isEligible() === false; SDK load timeout leaves state "unknown"
  // so a subsequent card-tab activation can retry without a permanent lockout.
  useEffect(() => {
    if (!pubSettings?.paypalEnableCards || !pubSettings?.paypalClientId) return;
    if (cardEligible !== "unknown") return; // already determined, no need to re-probe

    let cancelled = false;
    const probe = async () => {
      let attempts = 0;
      while (!window.paypal?.HostedFields && attempts < 50) {
        if (cancelled) return;
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }
      if (cancelled) return;
      // SDK timed out loading — transient issue, leave state as "unknown" so user can retry
      if (!window.paypal?.HostedFields) return;
      // Confirmed by SDK
      setCardEligible(window.paypal.HostedFields.isEligible() ? "yes" : "no");
    };
    probe();
    return () => { cancelled = true; };
  }, [pubSettings?.paypalEnableCards, pubSettings?.paypalClientId, cardEligible]);

  // Auto-switch back to PayPal when confirmed ineligible
  useEffect(() => {
    if (cardEligible === "no") {
      setPayMethod("paypal");
    }
  }, [cardEligible]);

  // Initialize PayPal Hosted Fields when card tab is active
  useEffect(() => {
    if (payMethod !== "card") {
      hostedFieldsRef.current = null;
      setHostedFieldsReady(false);
      // Do not touch cardEligible here — eligibility is session-level state managed by the
      // post-SDK probe above. Only "no" is permanent (confirmed by isEligible()); "unknown"
      // allows retry after a transient SDK load failure.
      setCardErrors({});
      return;
    }
    if (!pubSettings?.paypalEnableCards || !pubSettings.paypalClientId) return;

    let cancelled = false;
    const init = async () => {
      let attempts = 0;
      while (!window.paypal?.HostedFields && attempts < 50) {
        if (cancelled) return;
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }
      if (cancelled) return;
      // SDK still not loaded — transient, bail without marking ineligible
      if (!window.paypal?.HostedFields) { setHostedFieldsReady(false); return; }
      // Confirmed ineligible by SDK — mark permanently for this session
      if (!window.paypal.HostedFields.isEligible()) { setCardEligible("no"); return; }
      try {
        const instance = await window.paypal.HostedFields.render({
          createOrder: async () => {
            const fn = hostedFieldsCreateOrderRef.current;
            if (!fn) throw new Error("No order function");
            return fn();
          },
          fields: {
            number: { selector: "#hf-card-number", placeholder: "4111 1111 1111 1111" },
            cvv: { selector: "#hf-cvv", placeholder: "···" },
            expirationDate: { selector: "#hf-expiry", placeholder: "MM/YYYY" },
          },
          styles: paypalHostedFieldStyles(),
        });
        if (cancelled) return;
        hostedFieldsRef.current = instance;
        setHostedFieldsReady(true);
        instance.on("validityChange", (evt) => {
          const e = evt as { emittedBy?: string; fields?: Record<string, { isPotentiallyValid: boolean }> };
          const field = e.emittedBy;
          if (!field || !e.fields) return;
          if (!e.fields[field]?.isPotentiallyValid) {
            setCardErrors(prev => ({ ...prev, [field]: t("checkout_card_invalid_field") }));
          } else {
            setCardErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
          }
        });
      } catch {
        // Render failure is transient (e.g. DOM not ready) — don't mark ineligible
        if (!cancelled) setHostedFieldsReady(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      void hostedFieldsRef.current?.teardown?.();
      hostedFieldsRef.current = null;
    };
  }, [payMethod, pubSettings?.paypalEnableCards, pubSettings?.paypalClientId, resolvedTheme, t]);

  const validateVin = () => {
    const v = vin.trim().toUpperCase();
    if (!v) { setVinError(t("vin_error_required")); return null; }
    if (v.length !== 17) { setVinError(t("vin_error_length")); return null; }
    if (/[IOQ]/.test(v)) { setVinError(t("vin_error_invalid_chars")); return null; }
    setVinError("");
    return v;
  };

  const goToVinReport = (reportVin: string) => {
    const target = normalizeCheckoutVin(reportVin);
    sessionStorage.removeItem(PENDING_VIN_KEY);
    sessionStorage.removeItem(CHECKOUT_VIN_KEY);
    // A VIN was just unlocked — refresh the (cached) client-area lists so the
    // dashboard shows it when the user navigates back, despite refetchOnMount:false.
    refreshClientAreaAfterUnlock(queryClient);
    setLocation(`/${language}/vin/${target}`);
  };

  type VinDeliveryProbe = { status?: string; vin?: string };

  const fetchVinDeliveryStatus = async (
    lookupId: number | undefined,
    reportVin: string,
  ): Promise<VinDeliveryProbe | null> => {
    const urls = [
      lookupId != null ? `${basePath}/api/vin/${lookupId}` : null,
      `${basePath}/api/vin/${encodeURIComponent(reportVin)}`,
    ].filter((url): url is string => Boolean(url));

    for (const url of urls) {
      try {
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) continue;
        return await r.json() as VinDeliveryProbe;
      } catch {
        // try next probe URL
      }
    }
    return null;
  };

  const isDeliverableVinStatus = (deliveryStatus?: string) =>
    deliveryStatus === "complete" || deliveryStatus === "pending_manual";

  const isStillRetrievingVinStatus = (deliveryStatus?: string) =>
    deliveryStatus === "fulfilling";

  const completeCheckoutDelivery = (reportVin: string) => {
    setStatus("success");
    paypalFlowPhaseRef.current = "done";
    sessionStorage.removeItem(PAYPAL_CHECKOUT_SESSION_KEY);
    goToVinReport(reportVin);
  };

  const deliveryFetchErrorMsg = () =>
    couponResult?.isFree
      ? t("checkout_error_free_coupon_fetch")
      : t("checkout_error_payment_fetch");

  const tryResumeVinDelivery = async (
    lookupId: number | undefined,
    reportVin: string,
  ): Promise<boolean> => {
    const probe = await fetchVinDeliveryStatus(lookupId, reportVin);
    if (isDeliverableVinStatus(probe?.status) || isStillRetrievingVinStatus(probe?.status)) {
      completeCheckoutDelivery(probe?.vin ?? reportVin);
      return true;
    }
    return false;
  };

  const recoverVinDelivery = async (
    lookupId: number | undefined,
    reportVin: string,
    paymentId?: number,
  ): Promise<boolean> => {
    if (await tryResumeVinDelivery(lookupId, reportVin)) return true;
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (!checkoutActiveRef.current) return false;
      if (await tryResumeVinDelivery(lookupId, reportVin)) return true;
    }
    if (couponResult?.isFree && paymentId) {
      try {
        const resp = await fetch(`${basePath}/api/vin/lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ vin: reportVin, paymentId }),
        });
        const data = await resp.json() as {
          id?: number;
          vin?: string;
          status?: string;
          fulfilling?: boolean;
        };
        if ((resp.status === 202 || data.status === "fulfilling" || data.fulfilling) && data.id) {
          for (let poll = 0; poll < 30; poll++) {
            if (!checkoutActiveRef.current) return false;
            if (poll > 0) await new Promise((r) => setTimeout(r, 1000));
            if (await tryResumeVinDelivery(data.id, reportVin)) return true;
          }
          if (await tryResumeVinDelivery(data.id, reportVin)) return true;
        } else if (resp.ok && data.id) {
          completeCheckoutDelivery(data.vin ?? reportVin);
          return true;
        }
      } catch {
        // fall through to failure
      }
    }
    return false;
  };

  const failVinDelivery = async (
    lookupId: number | undefined,
    reportVin: string,
    paymentId: number | undefined,
    message: string,
  ): Promise<boolean> => {
    if (await recoverVinDelivery(lookupId, reportVin, paymentId)) return true;
    setErrorMsg(message);
    setStatus("error");
    return false;
  };

  const handleUnlockVinForEdit = () => {
    setPaymentStarted(false);
    paypalInstanceRef.current?.close();
    paypalInstanceRef.current = null;
    if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
    setStatus("idle");
    setErrorMsg("");
  };

  const handleVinInputChange = (raw: string) => {
    if (paymentStarted && !couponResult?.isFree) return;
    const next = raw.replace(/\s/g, "").toUpperCase();
    setVin(next);
    setVinError("");
    if (next) {
      sessionStorage.setItem(CHECKOUT_VIN_KEY, next);
    } else {
      sessionStorage.removeItem(CHECKOUT_VIN_KEY);
      sessionStorage.removeItem(PENDING_VIN_KEY);
    }
    // Drop ?vin= so URL sync does not overwrite manual edits
    const params = new URLSearchParams(window.location.search);
    if (params.has("vin")) {
      params.delete("vin");
      const qs = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  };

  // Apply ?vin= from navigation only (not on every keystroke)
  useEffect(() => {
    const urlVin = new URLSearchParams(window.location.search).get("vin");
    if (!urlVin) return;
    const normalized = normalizeCheckoutVin(urlVin);
    if (normalized.length !== 17) return;
    sessionStorage.setItem(CHECKOUT_VIN_KEY, normalized);
    sessionStorage.removeItem(PENDING_VIN_KEY);
    setVin(normalized);
  }, [location]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponResult(null);
    try {
      const resp = await fetch(`${basePath}/api/payments/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await resp.json() as CouponResult & { error?: string };
      if (!resp.ok || data.error) { setCouponError(translateCouponError(t, data.error)); return; }
      setCouponResult(data);
    } catch {
      setCouponError(t("checkout_error_coupon_failed"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponResult(null);
    setCouponCode("");
    setCouponError("");
    pendingPaypalOrderRef.current = null;
    paypalInstanceRef.current?.close();
    paypalInstanceRef.current = null;
  };

  const createOrder = async (nvin: string): Promise<string | null> => {
    setStatus("creating");
    setErrorMsg("");
    const recaptchaToken = await obtainRecaptchaToken(getRecaptchaToken, rcEnabled, "checkout") ?? undefined;
    if (rcEnabled && !recaptchaToken) {
      setErrorMsg(t("error_recaptcha_failed"));
      setStatus("error");
      return null;
    }
    try {
      const resp = await fetch(`${basePath}/api/payments/create-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vin: nvin, couponCode: couponResult?.code ?? undefined, recaptchaToken }),
      });
      const data = await resp.json() as {
        orderId?: string; free?: boolean; paymentId?: number; error?: string; code?: string; alreadyUnlocked?: boolean;
      };
      if (resp.status === 409 || data.code === "ALREADY_UNLOCKED") {
        goToVinReport(nvin);
        return null;
      }
      if (data.code === "VIN_NO_DATA") {
        setErrorMsg(t("vin_not_in_db"));
        setStatus("error");
        return null;
      }
      if (data.code === "VIN_CHECK_UNAVAILABLE") {
        setErrorMsg(t("checkout_check_unavailable_desc"));
        setStatus("error");
        return null;
      }
      if (!resp.ok || data.error) {
        setErrorMsg(translateClientError(t, data.code, data.error));
        setStatus("error");
        return null;
      }
      if (data.free && data.paymentId) {
        freeCouponPaymentIdRef.current = data.paymentId;
        await submitVinLookup(nvin, undefined, data.paymentId);
        return null;
      }
      return data.orderId ?? null;
    } catch {
      setErrorMsg(t("checkout_error_payment_create"));
      setStatus("error");
      return null;
    }
  };

  const submitVinLookup = async (
    nvin: string,
    paypalOrderId?: string,
    paymentId?: number,
    attempt = 0,
  ): Promise<boolean> => {
    setStatus("paying");
    setErrorMsg("");
    try {
      const resp = await fetch(`${basePath}/api/vin/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vin: nvin,
          ...(paypalOrderId ? { paypalOrderId } : {}),
          ...(paymentId ? { paymentId } : {}),
        }),
      });
      const data = await resp.json() as {
        id?: number;
        vin?: string;
        status?: string;
        fulfilling?: boolean;
        error?: string;
        code?: string;
      };

      if ((resp.status === 202 || data.status === "fulfilling" || data.fulfilling) && data.id) {
        paypalFlowPhaseRef.current = "fulfilling";
        const maxAttempts = 120;
        for (let poll = 0; poll < maxAttempts; poll++) {
          if (!checkoutActiveRef.current) return false;
          if (poll > 0) await new Promise((r) => setTimeout(r, 1000));
          const pollResp = await fetch(`${basePath}/api/vin/${data.id}`, { credentials: "include" });
          if (!checkoutActiveRef.current) return false;
          const pollData = await pollResp.json() as { status?: string; vin?: string; error?: string; code?: string };
          if (!pollResp.ok) continue;
          if (pollData.status === "complete" || pollData.status === "pending_manual") {
            completeCheckoutDelivery(pollData.vin ?? nvin);
            return true;
          }
          if (pollData.status === "error") {
            return failVinDelivery(
              data.id,
              nvin,
              paymentId,
              translateClientError(t, pollData.code, pollData.error),
            );
          }
        }
        return failVinDelivery(data.id, nvin, paymentId, deliveryFetchErrorMsg());
      }

      if (resp.ok && data.id) {
        completeCheckoutDelivery(data.vin ?? nvin);
        return true;
      }

      if (attempt === 0 && paypalOrderId) {
        return submitVinLookup(nvin, undefined, paymentId, 1);
      }
      if (attempt === 1 && paypalOrderId) {
        const capResp = await fetch(`${basePath}/api/payments/capture-paypal-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId: paypalOrderId }),
        });
        const capData = await capResp.json() as { success?: boolean; paymentId?: number };
        if (capResp.ok && capData.success) {
          return submitVinLookup(nvin, paypalOrderId, capData.paymentId, 2);
        }
      }

      setErrorMsg(translateClientError(t, data.code, data.error));
      setStatus("error");
      return false;
    } catch {
      if (attempt === 0) {
        return submitVinLookup(nvin, undefined, paymentId, 1);
      }
      if (await recoverVinDelivery(undefined, nvin, paymentId)) return true;
      return failVinDelivery(undefined, nvin, paymentId, deliveryFetchErrorMsg());
    }
  };

  const finalizePaidCheckout = async (orderId: string, nvin: string) => {
    if (paypalFlowPhaseRef.current === "approving" || paypalFlowPhaseRef.current === "fulfilling" || paypalFlowPhaseRef.current === "done") {
      return;
    }
    paypalFlowPhaseRef.current = "approving";
    setStatus("paying");
    setErrorMsg("");
    try {
      const resp = await fetch(`${basePath}/api/payments/capture-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });
      const result = await resp.json() as { success?: boolean; error?: string; code?: string; vin?: string; paymentId?: number };
      if (!resp.ok || !result.success) {
        if (resp.status === 404 || result.code === "PAYMENT_NOT_FOUND") {
          setErrorMsg(t("checkout_error_payment_create"));
        } else {
          setErrorMsg(translateClientError(t, result.code, result.error));
        }
        setStatus("error");
        paypalFlowPhaseRef.current = "idle";
        return;
      }
      paypalFlowPhaseRef.current = "fulfilling";
      const delivered = await submitVinLookup(result.vin ?? nvin, orderId, result.paymentId);
      if (!delivered) {
        paypalFlowPhaseRef.current = "idle";
      }
    } catch {
      setErrorMsg(t("checkout_error_capture"));
      setStatus("error");
      paypalFlowPhaseRef.current = "idle";
    }
  };

  // Paid or free-coupon delivery still in flight — retry lookup without charging again.
  useEffect(() => {
    if (normalizedVin.length !== 17) return;
    const pendingFreePaymentId =
      peek?.pendingFreeCouponPaymentId ?? freeCouponPaymentIdRef.current ?? undefined;
    const paidNeedsDelivery = !!(peek?.alreadyUnlocked && !peek.lookupId);
    const freeNeedsDelivery = !!(
      (peek?.deliveryInProgress || pendingFreePaymentId)
      && pendingFreePaymentId
      && !peek?.lookupId
    );
    if (!paidNeedsDelivery && !freeNeedsDelivery) return;
    if (paidDeliveryRetryRef.current) return;
    if (paypalFlowPhaseRef.current !== "idle" || status === "paying" || status === "creating") return;
    paidDeliveryRetryRef.current = true;
    void submitVinLookup(
      normalizedVin,
      undefined,
      freeNeedsDelivery ? pendingFreePaymentId : undefined,
    ).then((ok) => {
      if (!ok) paidDeliveryRetryRef.current = false;
    });
  }, [
    peek?.alreadyUnlocked,
    peek?.lookupId,
    peek?.deliveryInProgress,
    peek?.pendingFreeCouponPaymentId,
    normalizedVin,
    status,
  ]);

  // Resume PayPal capture when session has a pending order but return URL lost ?token=.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !vinIsValid || peekLoading) return;
    if (paypalResumeAttemptedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("token")) return;

    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PAYPAL_CHECKOUT_SESSION_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let parsed: { orderId?: string; vin?: string };
    try {
      parsed = JSON.parse(raw) as { orderId?: string; vin?: string };
    } catch {
      return;
    }

    const orderId = parsed.orderId?.toUpperCase() ?? "";
    const sessionVin = parsed.vin?.toUpperCase() ?? "";
    if (!/^[A-Z0-9]{8,20}$/.test(orderId)) return;
    if (sessionVin !== normalizedVin) return;
    if (peek?.alreadyUnlocked && peek.lookupId) return;

    paypalResumeAttemptedRef.current = true;
    pendingPaypalOrderRef.current = orderId;
    setPaymentStarted(true);
    void finalizePaidCheckout(orderId, normalizedVin);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot session resume
  }, [
    isLoaded,
    isSignedIn,
    vinIsValid,
    peekLoading,
    normalizedVin,
    peek?.alreadyUnlocked,
    peek?.lookupId,
  ]);

  // PayPal full-page return (?token=ORDER_ID) after mobile/redirect checkout.
  useEffect(() => {
    if (!isSignedIn || !vinIsValid) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token")?.toUpperCase() ?? "";
    if (!/^[A-Z0-9]{8,20}$/.test(token)) return;

    const clean = new URL(window.location.href);
    clean.searchParams.delete("token");
    clean.searchParams.delete("PayerID");
    window.history.replaceState({}, "", clean.pathname + clean.search);

    setPaymentStarted(true);
    void finalizePaidCheckout(token, normalizedVin);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot PayPal return handler
  }, [isSignedIn, vinIsValid, normalizedVin]);

  const handleProceedToPayment = async () => {
    const nvin = validateVin();
    if (!nvin) return;
    if (couponResult?.isFree) { await createOrder(nvin); return; }
    if (!pubSettings?.paypalClientId) { setErrorMsg(t("checkout_payment_not_configured")); setStatus("error"); return; }
    let attempts = 0;
    while (!window.paypal && attempts < 30) { await new Promise(r => setTimeout(r, 200)); attempts++; }
    if (!window.paypal) { setErrorMsg(t("checkout_error_paypal_load")); setStatus("error"); return; }
    setPaymentStarted(true);
    paypalInstanceRef.current?.close();
    paypalInstanceRef.current = null;
    pendingPaypalOrderRef.current = null;

    const orderId = await createOrder(nvin);
    if (!orderId) {
      setPaymentStarted(false);
      return;
    }
    pendingPaypalOrderRef.current = orderId;
    sessionStorage.setItem(PAYPAL_CHECKOUT_SESSION_KEY, JSON.stringify({ orderId, vin: nvin }));

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: resolvedTheme === "dark" ? "white" : "blue",
        shape: "rect",
        label: "pay",
        height: 48,
      },
      createOrder: () => {
        const id = pendingPaypalOrderRef.current;
        if (!id) throw new Error("Order not ready");
        return id;
      },
      onApprove: async (data: { orderID: string }) => {
        pendingPaypalOrderRef.current = null;
        await finalizePaidCheckout(data.orderID, nvin);
      },
      onError: (err: unknown) => {
        console.error("PayPal error", err);
        pendingPaypalOrderRef.current = null;
        if (paypalFlowPhaseRef.current !== "idle") {
          return;
        }
        if (isPaypalUserAbort(err)) {
          setStatus("idle");
          setPaymentStarted(false);
          paypalInstanceRef.current?.close();
          paypalInstanceRef.current = null;
          if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
          return;
        }
        setErrorMsg(t("checkout_error_payment_failed"));
        setStatus("error");
      },
      onCancel: () => {
        pendingPaypalOrderRef.current = null;
        if (paypalFlowPhaseRef.current !== "idle") {
          return;
        }
        setStatus("idle");
        setPaymentStarted(false);
        paypalInstanceRef.current?.close();
        paypalInstanceRef.current = null;
        if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
      },
    });
    paypalInstanceRef.current = buttons;
    setStatus("idle");
    try {
      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = "";
        await buttons.render(paypalContainerRef.current);
      }
    } catch (err) {
      console.error("PayPal render error", err);
      pendingPaypalOrderRef.current = null;
      setPaymentStarted(false);
      setErrorMsg(t("checkout_error_paypal_load"));
      setStatus("error");
    }
  };

  const handleCardPayment = async () => {
    const nvin = validateVin();
    if (!nvin) return;
    if (couponResult?.isFree) { await createOrder(nvin); return; }
    if (!hostedFieldsRef.current) { setErrorMsg(t("checkout_error_card_not_ready")); setStatus("error"); return; }
    setPaymentStarted(true);
    hostedFieldsCreateOrderRef.current = async () => {
      const recaptchaToken = await obtainRecaptchaToken(getRecaptchaToken, rcEnabled, "checkout") ?? undefined;
      if (rcEnabled && !recaptchaToken) {
        throw new Error(t("error_recaptcha_failed"));
      }
      const resp = await fetch(`${basePath}/api/payments/create-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vin: nvin, couponCode: couponResult?.code ?? undefined, recaptchaToken }),
      });
      const data = await resp.json() as {
        orderId?: string; free?: boolean; paymentId?: number; error?: string; code?: string; alreadyUnlocked?: boolean;
      };
      if (resp.status === 409 || data.code === "ALREADY_UNLOCKED") {
        goToVinReport(nvin);
        throw new Error("__redirect__");
      }
      if (data.code === "VIN_NO_DATA" || data.code === "VIN_CHECK_UNAVAILABLE") {
        throw new Error(translateClientError(t, data.code, data.error));
      }
      if (!resp.ok || data.error) throw new Error(data.error ?? "Failed to create order");
      if (data.free && data.paymentId) {
        freeCouponPaymentIdRef.current = data.paymentId;
        await submitVinLookup(nvin, undefined, data.paymentId);
        throw new Error("__free__");
      }
      if (!data.orderId) throw new Error("No order ID returned");
      return data.orderId;
    };
    setStatus("creating");
    try {
      const payload = await hostedFieldsRef.current.submit({ contingencies: ["SCA_WHEN_REQUIRED"] });
      setStatus("paying");
      const resp = await fetch(`${basePath}/api/payments/capture-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: payload.orderId }),
      });
      const result = await resp.json() as { success?: boolean; error?: string; code?: string; vin?: string; paymentId?: number };
      if (!resp.ok || !result.success) {
        setErrorMsg(translateClientError(t, result.code, result.error));
        setStatus("error");
        return;
      }
      paypalFlowPhaseRef.current = "fulfilling";
      await submitVinLookup(result.vin ?? nvin, payload.orderId, result.paymentId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "__free__" || msg === "__redirect__") return;
      if (msg.toLowerCase().includes("declined") || msg.toLowerCase().includes("card") || msg.toLowerCase().includes("field")) {
        setErrorMsg(t("checkout_error_card_declined"));
      } else {
        setErrorMsg(translateClientError(t, undefined, msg));
      }
      setStatus("error");
    }
  };

  const isBusy = status === "creating" || status === "paying";
  const rcBlockingCheckout = rcEnabled && !rcReady;
  const vehicleTitle = peek ? formatVehicleTitle(peek) : null;
  const showDecoderPreview = !!peek && !peekLoading && !!vehicleTitle;
  const showVinQualityWarning = vinIsValid && !!peek && !peekLoading && !isTrustworthyVinDecode(peek);
  const showVinPendingDoubleCheck = vinIsValid && !!peek && !peekLoading && shouldShowPendingVinDoubleCheck(peek);
  const vinLookupDisabled = useVinLookupDisabledForUser(user?.isAdmin);
  const vehicleTooOld =
    vinIsValid &&
    !!peek &&
    !peekLoading &&
    (peek.vehicleTooOld === true || isVehicleTooOldForLookup(peek.year));
  const paymentAllowed = !vinLookupDisabled && peek?.dataAvailable === true && !peek?.checkUnavailable && !vehicleTooOld;
  const paymentSettingsReady = !pubSettingsLoading && !!pubSettings;
  const checkoutDataReady =
    vinIsValid &&
    !peekLoading &&
    !!peek &&
    paymentAllowed &&
    paymentSettingsReady;
  const showPaymentMethodTabs =
    checkoutDataReady &&
    !!pubSettings?.paypalEnableCards &&
    !!pubSettings?.paypalClientId &&
    !couponResult?.isFree &&
    cardEligible === "yes" &&
    !paymentStarted &&
    (status === "idle" || status === "error");
  const showProceedButton =
    checkoutDataReady &&
    (status === "idle" || status === "error") &&
    (payMethod === "card" || !paymentStarted);
  const vinLocked = paymentStarted && !couponResult?.isFree;
  const showVehicleTooOldNotice = vehicleTooOld;
  const showVinNoDataNotice =
    vinIsValid &&
    !!peek &&
    !peekLoading &&
    peek.dataAvailable === false &&
    !peek.checkUnavailable &&
    !peek.manualPending &&
    !showVinQualityWarning &&
    !showVehicleTooOldNotice;
  const showCouponSection = !paymentStarted && status !== "creating" && status !== "paying";
  const showPaymentLogos =
    paymentAllowed &&
    !couponResult?.isFree &&
    (status === "idle" || status === "error") &&
    payMethod === "paypal" &&
    !paymentStarted;
  const showLockedPreview =
    vinIsValid &&
    !peekLoading &&
    !peekError &&
    !!peek &&
    peek.dataAvailable === true &&
    !peek.checkUnavailable &&
    !showVinQualityWarning;

  const seoLang = parseLangFromPath(window.location.pathname, import.meta.env.BASE_URL.replace(/\/$/, "")) ?? language;

  if (!isLoaded || !isSignedIn) return null;

  return (
    <>
      <SEOHead
        title={`${t("checkout_title")} — kmcheck.com`}
        description={t("checkout_subtitle")}
        lang={seoLang}
        noIndex
      />
    <div className="relative min-h-[80vh] py-8 sm:py-12 px-3 sm:px-4 pb-24 sm:pb-12 overflow-hidden">
      {/* Ambient background — single top-center glow, full viewport width */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] dark:opacity-[0.12]" />
      <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-screen -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(34,197,94,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(34,197,94,0.22),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-5xl xl:max-w-6xl mx-auto"
      >
        <VinLookupDisabledBanner className="mb-6" />
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 px-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 dark:bg-white/[0.04] backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-primary mb-4 shadow-sm"
          >
            <Lock className="h-3.5 w-3.5" />
            {t("trust_secure_payment")}
          </motion.div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{t("checkout_title")}</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary/70 shrink-0" />
            {t("checkout_subtitle")}
          </p>
        </div>

        {/* Step indicator */}
        {(() => {
          const currentStep =
            status === "success" ? 2 : paymentStarted ? 1 : 0;
          const steps = [
            { labelKey: "checkout_step_vin", icon: Car },
            { labelKey: "checkout_step_pay", icon: CreditCard },
            { labelKey: "checkout_step_done", icon: CheckCircle2 },
          ] as const;
          const isPaying = status === "creating" || status === "paying";

          return (
            <nav
              aria-label={t("checkout_title")}
              className="mb-8 sm:mb-10 mx-auto w-full max-w-lg px-4 sm:px-6"
            >
              <ol className="flex items-start">
                {steps.map((step, i) => {
                  const isComplete = i < currentStep;
                  const isCurrent = i === currentStep;
                  const isUpcoming = i > currentStep;
                  const StepIcon = step.icon;
                  const showPaySpinner = i === 1 && isPaying && isCurrent;

                  return (
                    <li
                      key={step.labelKey}
                      className={cn("flex items-start", i < steps.length - 1 && "flex-1")}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <div className="flex flex-col items-center gap-2 w-[5rem] sm:w-[5.5rem] shrink-0">
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isCurrent ? 1 : isComplete ? 1 : 0.96,
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          className={cn(
                            "relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-shadow duration-300",
                            isComplete && "bg-primary text-primary-foreground shadow-md shadow-primary/20",
                            isCurrent && !isComplete && "bg-primary/12 text-primary ring-2 ring-primary/80 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]",
                            isUpcoming && "bg-muted/50 text-muted-foreground/70 ring-1 ring-border/80",
                          )}
                        >
                          {isCurrent && !isComplete && (
                            <motion.span
                              className="absolute inset-0 rounded-full ring-2 ring-primary/30"
                              animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                              aria-hidden
                            />
                          )}
                          {isComplete ? (
                            <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.75} aria-hidden />
                          ) : showPaySpinner ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <StepIcon
                              className={cn(
                                "h-4 w-4 sm:h-[18px] sm:w-[18px]",
                                isCurrent ? "stroke-[2.25px]" : "stroke-2 opacity-80",
                              )}
                              aria-hidden
                            />
                          )}
                        </motion.div>
                        <span
                          className={cn(
                            "text-[10px] sm:text-xs text-center leading-tight max-w-[5rem] sm:max-w-none sm:whitespace-nowrap transition-colors",
                            isComplete && "font-semibold text-foreground/85",
                            isCurrent && "font-bold text-primary",
                            isUpcoming && "font-medium text-muted-foreground",
                          )}
                        >
                          {t(step.labelKey)}
                        </span>
                      </div>

                      {i < steps.length - 1 && (
                        <div
                          className="relative mt-[18px] sm:mt-5 mx-1 sm:mx-2 h-1 flex-1 min-w-[1.5rem] rounded-full bg-muted/90 overflow-hidden"
                          aria-hidden
                        >
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary to-primary/75"
                            initial={false}
                            animate={{ width: i < currentStep ? "100%" : "0%" }}
                            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_460px] gap-5 sm:gap-6 lg:gap-8 items-start">

          {/* ── LEFT: Vehicle Preview Card ──────────────────────── */}
          <div className={cn(
            "rounded-2xl border overflow-hidden order-2 lg:order-1 isolate [transform:translateZ(0)]",
            showLockedPreview
              ? "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0d1117] shadow-[0_8px_40px_rgba(34,197,94,0.10)] dark:shadow-[0_8px_40px_rgba(34,197,94,0.18)]"
              : "border-border/80 bg-background/90 backdrop-blur-sm shadow-md shadow-black/[0.03] dark:shadow-black/20 ring-1 ring-black/[0.03] dark:ring-white/[0.04]",
          )}>
            {showLockedPreview && (
              <div className="h-[3px] bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            )}

            {/* VIN input row */}
            <div className="px-5 sm:px-6 py-5 border-b bg-gradient-to-r from-muted/50 via-muted/30 to-transparent">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5">{t("checkout_vin_label")}</label>
              <div className="relative group">
                <Input
                  placeholder={t("vin_placeholder")}
                  value={vin}
                  onChange={(e) => handleVinInputChange(e.target.value)}
                  maxLength={17}
                  readOnly={vinLocked}
                  className={cn(
                    "font-mono tracking-widest h-12 text-sm sm:text-base shadow-none transition-shadow",
                    vinLocked ? "pr-[7.5rem] bg-muted/50 cursor-default" : "pr-20",
                    !vinLocked && vinIsValid && "border-green-500/40 focus-visible:ring-green-500/25",
                  )}
                  disabled={isBusy}
                  inputMode="text"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <div
                  className={cn(
                    "absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5",
                    vinLocked ? "pointer-events-auto" : "pointer-events-none",
                  )}
                >
                  {vinLocked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2 sm:px-2.5 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 shrink-0"
                      onClick={handleUnlockVinForEdit}
                      disabled={isBusy}
                      title={t("checkout_vin_remove_hint")}
                    >
                      <X className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{t("checkout_vin_remove")}</span>
                    </Button>
                  ) : (
                    <>
                      <span className={`text-[10px] font-mono tabular-nums ${vinIsValid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                        {t("checkout_vin_char_count").replace("{count}", String(normalizedVin.length))}
                      </span>
                      {vinIsValid && (
                        peekLoading
                          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          : peek
                            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                            : peekError
                              ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                              : null
                      )}
                    </>
                  )}
                </div>
              </div>
              {vinError && <p className="text-xs text-destructive mt-1.5">{vinError}</p>}
            </div>

            {/* VIN quality warning — bad decode, or valid decode heading to manual pending */}
            <AnimatePresence>
              {(showVinQualityWarning || showVinPendingDoubleCheck) && (
                <motion.div
                  key="vin-warning"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  {showVinQualityWarning ? (
                    <VinDecodeRecheckHint className="border-0 border-b rounded-none px-4 sm:px-5 py-3.5" />
                  ) : (
                    <VinPendingDoubleCheckHint className="border-0 border-b rounded-none px-4 sm:px-5 py-3.5" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vehicle identity — only when decoder result looks valid */}
            <div className={cn(!showLockedPreview && "border-b")}>
              {!vinIsValid ? (
                <div className="flex flex-col items-center justify-center px-5 sm:px-6 py-10 sm:py-8 text-center text-muted-foreground gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center ring-1 ring-border/50">
                    <Car className="h-8 w-8 opacity-35" />
                  </div>
                  <p className="text-sm sm:text-base font-medium max-w-xs leading-snug">{t("checkout_enter_vin_prompt")}</p>
                </div>
              ) : peekLoading ? (
                <div className="space-y-2.5 px-5 sm:px-6 py-5">
                  <Skeleton className="h-7 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-28 rounded" />
                </div>
              ) : showDecoderPreview && peek ? (
                <motion.div
                  key={peek.vin}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pt-4 pb-3"
                >
                  <h2 className="text-foreground dark:text-white font-bold text-[17px] sm:text-lg leading-tight break-words">
                    {vehicleTitle}
                  </h2>
                  <p className="text-muted-foreground/60 dark:text-white/25 text-[10px] sm:text-[11px] font-mono tracking-wide mt-1 break-all">
                    {peek.vin}
                  </p>
                </motion.div>
              ) : peek && vinIsValid && !peekLoading ? (
                <div className="flex flex-col items-center text-center gap-3 px-5 sm:px-6 py-4 sm:py-2">
                  <div className="inline-flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 max-w-full">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="font-mono text-xs sm:text-sm tracking-wider break-all">{peek.vin}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t("checkout_vin_ready_title")}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">{t("checkout_vin_ready_desc")}</p>
                  </div>
                </div>
              ) : peekError ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t("checkout_preview_unavailable")}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t("checkout_preview_unavailable_desc")}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Locked data rows — demo-card style */}
            {showLockedPreview && (
            <div className="border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.025]">
              {LOCKED_ROWS.map(({ icon: Icon, labelKey, blur, blurKey }, i) => (
                <motion.div
                  key={labelKey}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.22 }}
                  className={cn(
                    PREVIEW_ROW,
                    labelKey === "mileage_verification" && "flex-col items-stretch gap-2",
                  )}
                >
                  {labelKey === "mileage_verification" ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Gauge className={PREVIEW_ICO} />
                          <span className={PREVIEW_LBL}>{t(labelKey)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(PREVIEW_BLUR, "max-w-[100px] sm:max-w-none truncate")} aria-hidden>
                            {blur}
                          </span>
                          <div className="h-5 w-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center">
                            <Lock className="h-2.5 w-2.5 text-muted-foreground/70" />
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/8 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-primary/60 blur-[1.5px] w-[58%] select-none"
                          aria-hidden
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={PREVIEW_ICO} />
                        <span className={PREVIEW_LBL}>{t(labelKey)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(PREVIEW_BLUR, "max-w-[100px] sm:max-w-none truncate")} aria-hidden>
                          {blurKey ? t(blurKey) : blur}
                        </span>
                        <div className="h-5 w-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center">
                          <Lock className="h-2.5 w-2.5 text-muted-foreground/70" />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
            )}

            {/* Unlock CTA at bottom of preview */}
            {showLockedPreview && (
            <div className="px-5 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="leading-snug font-medium">{t("checkout_instant_delivery")}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 font-bold shrink-0 bg-primary/10 text-primary border-primary/20">
                {t("checkout_checks_badge").replace("{n}", String(LOCKED_ROWS.length))}
              </Badge>
            </div>
            )}
          </div>

          {/* ── RIGHT: Order Summary + Payment ──────────────────── */}
          <div className="space-y-5 order-1 lg:order-2 lg:sticky lg:top-24">

            {/* Unified payment panel */}
            <div className="rounded-2xl border border-border/80 bg-background/90 backdrop-blur-sm overflow-hidden shadow-md shadow-black/[0.03] dark:shadow-black/20 ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
              <div className="px-5 sm:px-6 py-4 border-b bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-transparent">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("order_summary")}</p>
                <p className="font-bold text-base">{t("checkout_report_title")}</p>
              </div>
              <div className="px-5 sm:px-6 py-5 space-y-4">
                {/* Price breakdown */}
                <div className="space-y-2 text-sm">
                  {isDiscount && standardPrice != null && promoDiscountAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("checkout_standard_price")}</span>
                        {pricingLoading ? (
                          <Skeleton className="h-4 w-14 rounded" />
                        ) : (
                          <span className="line-through">{fmtPrice(standardPrice)}</span>
                        )}
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                        <span>{t("pricing_limited_time")}</span>
                        {pricingLoading ? (
                          <Skeleton className="h-4 w-14 rounded" />
                        ) : (
                          <span>−{fmtPrice(promoDiscountAmount)}</span>
                        )}
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("base_price")}</span>
                        {pricingLoading ? (
                          <Skeleton className="h-4 w-14 rounded" />
                        ) : (
                          <span className="font-medium text-foreground">{fmtPrice(subtotalPrice)}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("base_price")}</span>
                      {pricingLoading ? (
                        <Skeleton className="h-4 w-14 rounded" />
                      ) : (
                        <span className="font-medium text-foreground">{fmtPrice(subtotalPrice)}</span>
                      )}
                    </div>
                  )}
                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                      <span>
                        {t("discount")}
                        {couponResult?.type === "percent" ? ` (${couponResult.value}%)` : ""}
                      </span>
                      <span>−{fmtPrice(couponDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="rounded-xl bg-muted/40 border border-border/50 px-4 py-3 flex justify-between items-center mt-2 gap-3">
                    <span className="font-bold text-base">{t("total")}</span>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {!pricingLoading && isDiscount && promoSavePercent > 0 && finalPrice > 0 && (
                        <Badge className="bg-orange-500 text-white border-0 text-[10px] px-2 py-0.5 font-bold">
                          {t("pricing_save").replace("{n}", String(promoSavePercent))}
                        </Badge>
                      )}
                      <span className="text-xl sm:text-2xl font-black text-primary tabular-nums">
                        {pricingLoading ? (
                          <Skeleton className="h-7 w-20 rounded inline-block" />
                        ) : couponResult && finalPrice === 0 ? (
                          <span className="text-green-600 dark:text-green-400">{t("free")}</span>
                        ) : (
                          fmtPrice(finalPrice)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon — hidden once user proceeds to payment */}
                {showCouponSection && (
                <div className="border-t border-border/60 pt-4">
                  {!couponResult && (
                    <button
                      type="button"
                      onClick={() => setCouponOpen(o => !o)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full pb-2"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{t("coupon_code")}</span>
                      <ChevronDown className={`h-3 w-3 ml-auto transition-transform duration-200 ${couponOpen ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  <AnimatePresence mode="wait">
                    {couponResult ? (
                      <motion.div
                        key="applied"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-green-700 dark:text-green-400">{couponResult.code}</p>
                            <p className="text-[10px] text-green-600/80 dark:text-green-500">
                              {couponResult.type === "percent" ? `${couponResult.value}% off` : `${fmtPrice(couponResult.value)} off`}
                              {" "}— saves {fmtPrice(couponResult.discountAmount)}
                            </p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} disabled={isBusy} className="text-muted-foreground hover:text-foreground p-0.5">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ) : couponOpen ? (
                      <motion.div key="input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                        <div className="flex gap-1.5">
                          <Input
                            placeholder={t("coupon_placeholder")}
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                            className="h-9 font-mono text-xs uppercase"
                            disabled={isBusy || couponLoading}
                            onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(); }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0 px-3 text-xs"
                            onClick={handleApplyCoupon}
                            disabled={isBusy || couponLoading || !couponCode.trim()}
                          >
                            {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("apply")}
                          </Button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  {couponError && <p className="text-xs text-destructive mt-2">{couponError}</p>}
                </div>
                )}

                {/* Payment section */}
                <div className="border-t border-border/60 pt-5 space-y-4">
                  {showVehicleTooOldNotice && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("checkout_vehicle_too_old_title")}</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-0.5">{t("checkout_vehicle_too_old_desc")}</p>
                      </div>
                    </div>
                  )}

                  {showVinNoDataNotice && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("vin_not_in_db")}</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-0.5">
                          {peek.vinNoAccess ? t("checkout_vin_no_access_desc") : t("checkout_no_data_desc")}
                        </p>
                      </div>
                    </div>
                  )}

                  {vinIsValid && peek?.checkUnavailable && !peek.manualPending && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("checkout_check_unavailable_title")}</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-0.5">
                          {peek.checkUnavailableCode
                            ? translateClientError(t, peek.checkUnavailableCode)
                            : t("checkout_check_unavailable_desc")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment method tabs — PayPal vs Card */}
                  {showPaymentMethodTabs && (
                    <div className="flex rounded-xl border border-border/80 overflow-hidden text-sm font-semibold bg-muted/30 p-1 gap-1">
                      <button
                        type="button"
                        className={cn(
                          "flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200",
                          payMethod === "paypal"
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => {
                          paypalInstanceRef.current?.close();
                          paypalInstanceRef.current = null;
                          setPaymentStarted(false);
                          if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
                          setPayMethod("paypal");
                          setStatus("idle");
                          setErrorMsg("");
                        }}
                      >
                        {t("checkout_pay_method_paypal")}
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200",
                          payMethod === "card"
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => {
                          paypalInstanceRef.current?.close();
                          paypalInstanceRef.current = null;
                          setPaymentStarted(false);
                          if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
                          setPayMethod("card");
                          setStatus("idle");
                          setErrorMsg("");
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        {t("checkout_pay_method_card")}
                      </button>
                    </div>
                  )}

                  {/* PayPal button container — color-scheme:none stops forced white iframe chrome in dark mode */}
                  {paymentAllowed && (
                    <div ref={paypalContainerRef} className={cn("[color-scheme:none] min-h-0", payMethod === "card" && "hidden")} />
                  )}

                  {/* Hosted card fields */}
                  {payMethod === "card" && pubSettings?.paypalEnableCards && !couponResult?.isFree && paymentAllowed && (
                    <div className="space-y-3 [color-scheme:none]">
                      {cardEligible === "no" ? (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 text-center">
                          {t("checkout_card_not_available")}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">{t("checkout_card_number")}</p>
                            <div
                              id="hf-card-number"
                              className="h-11 rounded-lg border border-border/80 bg-background px-3 focus-within:ring-2 focus-within:ring-primary/25"
                            />
                            {cardErrors.number && <p className="text-xs text-destructive">{cardErrors.number}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground">{t("checkout_card_expiry")}</p>
                              <div
                                id="hf-expiry"
                                className="h-11 rounded-lg border border-border/80 bg-background px-3 focus-within:ring-2 focus-within:ring-primary/25"
                              />
                              {cardErrors.expirationDate && <p className="text-xs text-destructive">{cardErrors.expirationDate}</p>}
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground">{t("checkout_card_cvv")}</p>
                              <div
                                id="hf-cvv"
                                className="h-11 rounded-lg border border-border/80 bg-background px-3 focus-within:ring-2 focus-within:ring-primary/25"
                              />
                              {cardErrors.cvv && <p className="text-xs text-destructive">{cardErrors.cvv}</p>}
                            </div>
                          </div>
                          {!hostedFieldsReady && (
                            <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {t("checkout_card_loading")}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Error */}
                  <AnimatePresence>
                    {status === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium"
                      >
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Processing state */}
                  {status === "paying" && (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {couponResult?.isFree ? t("processing_retrieving_data") : t("processing_payment")}
                    </div>
                  )}

                  {/* Proceed / Pay by Card / Free button */}
                  {showProceedButton && (
                    <Button
                      className="w-full h-12 sm:h-[52px] text-base font-bold rounded-xl gap-2 shadow-md shadow-primary/15 hover:shadow-primary/25 transition-shadow -mt-2"
                      onClick={(!couponResult?.isFree && payMethod === "card") ? handleCardPayment : handleProceedToPayment}
                      disabled={isBusy || rcBlockingCheckout || (!couponResult?.isFree && payMethod === "card" && (!hostedFieldsReady || cardEligible === "no"))}
                    >
                      {isBusy
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("processing")}…</>
                        : rcBlockingCheckout
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("error_recaptcha_loading")}</>
                        : couponResult?.isFree
                          ? <><Zap className="h-4 w-4" />{t("get_free_report")}</>
                          : payMethod === "card"
                            ? <><CreditCard className="h-4 w-4" />{t("checkout_pay_by_card")}</>
                            : <><Lock className="h-4 w-4" />{t("proceed_to_payment")}</>
                      }
                    </Button>
                  )}

                  {showProceedButton && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/25 bg-primary/5">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t("checkout_manual_pending_title")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t("checkout_manual_pending_desc")}</p>
                      </div>
                    </div>
                  )}

                  {/* PayPal configured — no footer note */}
                  {pubSettingsLoading || pubSettings?.paypalClientId || pubSettingsError
                    ? null
                    : <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 text-center">
                        {t("checkout_payment_not_configured")}
                      </div>
                  }
                </div>
              </div>
            </div>

            {showPaymentLogos && (
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-1">
                <CheckoutPaymentLogos />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
}
