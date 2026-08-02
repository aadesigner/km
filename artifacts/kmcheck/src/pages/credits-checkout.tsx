import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { getCreditPack, isCreditPackId } from "@/lib/creditPacks";
import { DEFAULT_PRICING } from "@/lib/pricing-defaults";
import { useDisplayPrice } from "@/hooks/use-display-price";
import { AUTH_RETURN_PATH_KEY } from "@/lib/checkout-vin-flow";
import { CHECKOUT_QUERY_OPTIONS, spreadQueryExtras } from "@/lib/query-options";
import { useQueryRecovery } from "@/hooks/use-query-recovery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo";
import { CheckoutPaymentLogos } from "@/components/checkout-payment-logos";
import {
  ArrowLeft, CheckCircle2, FileText, Loader2, Lock,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type PublicSettings = { paypalClientId: string | null };

type Props = { params: { lang: string } };

const PACK_FEATURES = [
  "full_vehicle_history",
  "pricing_feature_accidents",
  "mileage_verification",
  "credits_checkout_theft",
  "photos_available",
  "auction_history",
] as const;

export default function CreditsCheckout({ params }: Props) {
  const { t, language } = useTranslation();
  const { isSignedIn, isLoaded, refreshUser } = useAuth();
  const { displayPrice: rawDisplayPrice, currencySymbol } = useDisplayPrice();
  const [, setLocation] = useLocation();
  const { resolvedTheme } = useTheme();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const singleUnit = rawDisplayPrice && rawDisplayPrice > 0
    ? rawDisplayPrice
    : DEFAULT_PRICING.discountPrice;

  const packId = useMemo(() => {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const raw = q.get("pack");
    return isCreditPackId(raw) ? raw : null;
  }, []);

  const pack = packId ? getCreditPack(packId) : null;

  const {
    data: pubSettings,
    isLoading: pubSettingsLoading,
    isError: pubSettingsError,
    isFetching: pubSettingsFetching,
    refetch: refetchPubSettings,
  } = useQuery<PublicSettings>({
    queryKey: ["/api/payments/public-settings"],
    queryFn: async () => {
      const r = await fetch(`${basePath}/api/payments/public-settings`);
      if (!r.ok) throw new Error("settings");
      return r.json() as Promise<PublicSettings>;
    },
    ...spreadQueryExtras<PublicSettings>(CHECKOUT_QUERY_OPTIONS),
  });
  useQueryRecovery(pubSettingsError, pubSettingsFetching, refetchPubSettings);
  const paypalReady = !!pubSettings?.paypalClientId;
  const [status, setStatus] = useState<"idle" | "creating" | "paying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentStarted, setPaymentStarted] = useState(false);

  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalInstanceRef = useRef<{ close: () => void } | null>(null);
  const pendingOrderRef = useRef<string | null>(null);
  const activeRef = useRef(true);
  const finalizeRef = useRef<(orderId: string) => Promise<void>>(async () => {});

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      paypalInstanceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      if (packId) {
        sessionStorage.setItem(AUTH_RETURN_PATH_KEY, `/${language}/credits/checkout?pack=${packId}`);
      }
      setLocation(`/${language}/sign-up`);
    }
  }, [isLoaded, isSignedIn, language, packId, setLocation]);

  useEffect(() => {
    if (!pubSettings?.paypalClientId) return;
    // Reuse the normal checkout SDK when already loaded (same client id / EUR).
    if (window.paypal || document.getElementById("paypal-sdk") || document.getElementById("paypal-sdk-credits")) {
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk-credits";
    script.src = `https://www.paypal.com/sdk/js?client-id=${pubSettings.paypalClientId}&currency=EUR&intent=capture&components=buttons`;
    script.async = true;
    document.body.appendChild(script);
  }, [pubSettings?.paypalClientId]);

  const finalizeCapture = useCallback(async (orderId: string) => {
    setStatus("paying");
    setErrorMsg("");
    try {
      const resp = await fetch(`${basePath}/api/payments/capture-credit-pack-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });
      const data = await resp.json() as {
        success?: boolean;
        error?: string;
        code?: string;
      };
      if (!resp.ok || !data.success) {
        setErrorMsg(data.error || t("checkout_error_capture"));
        setStatus("error");
        return;
      }
      setStatus("success");
      void refreshUser();
    } catch {
      setErrorMsg(t("checkout_error_capture"));
      setStatus("error");
    }
  }, [basePath, refreshUser, t]);

  useLayoutEffect(() => {
    finalizeRef.current = finalizeCapture;
  }, [finalizeCapture]);

  const mountPaypal = useCallback(async (orderId: string) => {
    // Settings can still be loading after create-order succeeds (server uses env secrets).
    let clientId = pubSettings?.paypalClientId ?? null;
    if (!clientId) {
      try {
        const r = await refetchPubSettings();
        clientId = r.data?.paypalClientId ?? null;
      } catch {
        clientId = null;
      }
    }
    if (!clientId) {
      setErrorMsg(t("checkout_payment_not_configured"));
      setStatus("error");
      return;
    }
    if (!document.getElementById("paypal-sdk") && !document.getElementById("paypal-sdk-credits") && !window.paypal) {
      const script = document.createElement("script");
      script.id = "paypal-sdk-credits";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture&components=buttons`;
      script.async = true;
      document.body.appendChild(script);
    }
    let attempts = 0;
    while (!window.paypal && attempts < 40) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    if (!window.paypal || !paypalContainerRef.current) {
      setErrorMsg(t("checkout_error_paypal_load"));
      setStatus("error");
      return;
    }

    paypalInstanceRef.current?.close();
    pendingOrderRef.current = orderId;
    setPaymentStarted(true);
    setStatus("idle");

    const buttons = window.paypal!.Buttons({
      style: {
        layout: "vertical",
        color: resolvedTheme === "dark" ? "white" : "blue",
        shape: "rect",
        label: "pay",
        height: 48,
      },
      createOrder: () => {
        const id = pendingOrderRef.current;
        if (!id) throw new Error("Order not ready");
        return id;
      },
      onApprove: async (data: { orderID: string }) => {
        pendingOrderRef.current = null;
        await finalizeRef.current(data.orderID);
      },
      onError: () => {
        if (!activeRef.current) return;
        setErrorMsg(t("checkout_error_payment_failed"));
        setStatus("error");
      },
      onCancel: () => {
        setPaymentStarted(false);
        setStatus("idle");
        paypalInstanceRef.current?.close();
        if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
      },
    });
    paypalInstanceRef.current = buttons;
    paypalContainerRef.current.innerHTML = "";
    await buttons.render(paypalContainerRef.current);
  }, [pubSettings?.paypalClientId, refetchPubSettings, resolvedTheme, t]);

  const handleStartPayment = async () => {
    if (!pack) return;
    if (pubSettingsLoading) return;
    if (!paypalReady) {
      setErrorMsg(t("checkout_payment_not_configured"));
      setStatus("error");
      return;
    }
    setStatus("creating");
    setErrorMsg("");
    try {
      const resp = await fetch(`${basePath}/api/payments/create-credit-pack-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = await resp.json() as { orderId?: string; error?: string };
      if (!resp.ok || !data.orderId) {
        setErrorMsg(data.error || t("checkout_error_payment_create"));
        setStatus("error");
        return;
      }
      await mountPaypal(data.orderId);
    } catch {
      setErrorMsg(t("checkout_error_payment_create"));
      setStatus("error");
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="font-semibold">{t("credits_checkout_invalid_pack")}</p>
        <Button onClick={() => setLocation(`/${language}/pricing`)}>{t("pricing")}</Button>
      </div>
    );
  }

  const separateTotal = singleUnit * pack.credits;
  const discountAmount = Math.max(0, separateTotal - pack.totalPrice);
  const showComparePrice = discountAmount > 0.01;
  const unitLabel = `${currencySymbol}${pack.unitPrice.toFixed(2)}`;
  const [unitWhole, unitFraction] = pack.unitPrice.toFixed(2).split(".");

  return (
    <div className="relative bg-background overflow-hidden">
      <SEOHead
        title={t("credits_checkout_title")}
        description={t("credits_checkout_desc")}
        lang={language}
        canonicalPath={`/${language}/credits/checkout`}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-[#040d08] dark:via-background" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] dark:opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(34,197,94,0.16),transparent)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-16 sm:pb-20">
        <button
          type="button"
          onClick={() => setLocation(`/${language}/pricing`)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("credits_checkout_back_pricing")}
        </button>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Pack summary — second on mobile, left on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="order-2 lg:order-1 rounded-[1.75rem] border border-border/70 dark:border-white/15 bg-card shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden ring-1 ring-primary/10"
          >
            <div className="relative px-5 sm:px-7 pt-7 pb-6 text-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-[#010a05] dark:via-[#052e16] dark:to-[#047857]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_-30%,rgba(255,255,255,0.18),transparent)] pointer-events-none" />
              {pack.id === "pack3" && (
                <Badge className="absolute top-4 right-4 rounded-full bg-orange-500 text-white border-0 text-[10px] font-bold">
                  {t("pricing_best_value")}
                </Badge>
              )}
              <div className="relative space-y-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {t(`pricing_plan_${pack.id}_title`)}
                </h1>
                <div className="flex flex-col items-center gap-1">
                  <div className="inline-flex items-end justify-center gap-2 tabular-nums leading-none text-white">
                    {singleUnit > pack.unitPrice && (
                      <span className="text-base sm:text-lg font-medium text-white/40 line-through pb-1">
                        {currencySymbol}{singleUnit.toFixed(2)}
                      </span>
                    )}
                    <div className="inline-flex items-end leading-none">
                      <span className="text-lg sm:text-xl font-semibold text-white/90 pb-1 pe-0.5">
                        {currencySymbol}
                      </span>
                      <span className="text-[2.75rem] sm:text-[3.1rem] font-black tracking-tighter">
                        {unitWhole}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-white/80 pb-1 ps-1">
                        .{unitFraction}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/70">{t("per_report")}</p>
              </div>
            </div>

            <div className="px-5 sm:px-7 py-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("credits_checkout_what_you_get")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {PACK_FEATURES.map((key) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium leading-snug">{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{t("pricing_credits_never_expire")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {t("credits_checkout_desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order / payment — first on mobile, right on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-24"
          >
            <div className="rounded-2xl border border-border/80 bg-background/90 backdrop-blur-sm overflow-hidden shadow-md shadow-black/[0.03] dark:shadow-black/20 ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
              <div className="px-5 sm:px-6 py-3.5 border-b bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-transparent">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {t("order_summary")}
                </p>
                <p className="font-bold text-base">
                  {t("credits_checkout_pack_title").replace("{n}", String(pack.credits))}
                </p>
              </div>

              <div className="px-5 sm:px-6 py-4 space-y-4">
                <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                  <div className="px-4 py-3 space-y-2.5 text-sm">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-muted-foreground">{t("credits_checkout_credits")}</span>
                      <span className="font-semibold text-foreground tabular-nums">{pack.credits}</span>
                    </div>
                    {showComparePrice && (
                      <>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-muted-foreground">{t("checkout_standard_price")}</span>
                          <span className="font-medium text-muted-foreground line-through tabular-nums">
                            {currencySymbol}{separateTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-muted-foreground">{t("discount")}</span>
                          <span className="font-semibold text-orange-700 dark:text-orange-300 tabular-nums">
                            −{currencySymbol}{discountAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="px-4 py-3.5 border-t border-border/50 bg-primary/[0.06] flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-base">{t("credits_checkout_offer_price")}</p>
                      {showComparePrice && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {unitLabel} {t("per_report").toLowerCase()}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-black text-primary tabular-nums shrink-0">
                      {currencySymbol}{pack.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {status === "success" ? (
                  <div className="space-y-4 text-center py-2">
                    <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/10">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{t("credits_checkout_success")}</p>
                    </div>
                    <Button className="w-full h-12 font-bold rounded-xl" onClick={() => setLocation(`/${language}/dashboard`)}>
                      {t("go_to_dashboard")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl"
                      onClick={() => setLocation(`/${language}/checkout`)}
                    >
                      {t("check_vin_short")}
                    </Button>
                  </div>
                ) : (
                  <>
                    {status === "error" && errorMsg && (
                      <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                        {errorMsg}
                      </div>
                    )}

                    <div ref={paypalContainerRef} className={cn("[color-scheme:none] min-h-0", !paymentStarted && "hidden")} />

                    {!paymentStarted && (
                      <Button
                        className="w-full h-12 sm:h-[52px] text-base font-bold rounded-xl gap-2 shadow-md shadow-primary/15"
                        onClick={() => void handleStartPayment()}
                        disabled={
                          status === "creating"
                          || status === "paying"
                          || pubSettingsLoading
                          || (!paypalReady && !pubSettingsError)
                        }
                      >
                        {status === "creating" || status === "paying" || pubSettingsLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />{t("processing")}…</>
                        ) : (
                          <><Lock className="h-4 w-4" />{t("proceed_to_payment")}</>
                        )}
                      </Button>
                    )}

                    {!pubSettingsLoading && !paypalReady && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 text-center">
                        {t("checkout_payment_not_configured")}
                      </div>
                    )}

                    {status === "paying" && (
                      <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("processing_payment")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background px-2 sm:px-3 py-1">
              <CheckoutPaymentLogos />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
