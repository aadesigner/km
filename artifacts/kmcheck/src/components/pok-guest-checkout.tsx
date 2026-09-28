import { useEffect, useMemo, useRef } from "react";
import { GuestCheckoutForm } from "@nebula-ltd/pok-payments-js/react";
import type { PaymentErrorResponse } from "@nebula-ltd/pok-payments-js";
import "@nebula-ltd/pok-payments-js/lib/index.css";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { pokCardErrorI18nKey } from "@/lib/pok-card-error";
import { pokPrefillCountryCode, syncPokGuestVisibleFields } from "@/lib/pok-guest-fields";

export type PokEnv = "staging" | "production";

type Props = {
  orderId: string;
  pokEnv: PokEnv;
  onSuccess: () => void;
  onError: (message: string) => void;
  className?: string;
};

/** Map app UI language to POK form locales (en | it | al). */
export function pokLocaleFromLanguage(language: string): "en" | "it" | "al" {
  const lang = language.toLowerCase().split("-")[0] ?? "en";
  if (lang === "al" || lang === "sq") return "al";
  if (lang === "it") return "it";
  return "en";
}

/**
 * Inline POK card checkout. Card number / expiry / CVC / name / email / country stay visible.
 * Country uses POK's own required dropdown, prefilled from the kmcheck profile when set.
 * Optional address/phone stay hidden. PAN/CVV stay inside the POK SDK — never posted to kmcheck.
 */
export function PokGuestCheckout({ orderId, pokEnv, onSuccess, onError, className }: Props) {
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const hostRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const usCaBillingOpenedRef = useRef(false);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const locale = useMemo(() => pokLocaleFromLanguage(language), [language]);
  const countryCode = useMemo(
    () => pokPrefillCountryCode(user?.countryCode),
    [user?.countryCode],
  );

  const initialState = useMemo(() => {
    const email = user?.email?.trim() || undefined;
    const holdersName =
      user?.name?.trim()
      || (email?.includes("@") ? email.split("@")[0]!.replace(/[._+]/g, " ").trim() : "")
      || "Cardholder";
    return {
      ...(email ? { email } : {}),
      holdersName,
      ...(countryCode ? { countryCode } : {}),
    };
  }, [user?.email, user?.name, countryCode]);

  const options = useMemo(
    () => ({
      env: pokEnv,
      locale,
      countrySelect: "dropdown" as const,
      initialState,
    }),
    [pokEnv, locale, initialState],
  );

  // Stable callbacks — unstable onSuccess/onError can re-bind POK 3DS socket handlers mid-payment.
  const stableOnSuccess = useMemo(() => () => {
    onSuccessRef.current();
  }, []);
  const stableOnError = useMemo(
    () => (error: PaymentErrorResponse) => {
      // Safe canned copy only — never surface raw POK/partner messages.
      onErrorRef.current(t(pokCardErrorI18nKey(error)));
    },
    [t],
  );

  useEffect(() => {
    usCaBillingOpenedRef.current = false;
    const host = hostRef.current;
    if (!host) return;

    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        usCaBillingOpenedRef.current = syncPokGuestVisibleFields(
          host,
          countryCode,
          usCaBillingOpenedRef.current,
        );
      });
    };
    run();

    // Debounced: only react to new nodes (not every style tweak) so we don't fight 3DS UI.
    const obs = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (hasNewNodes) run();
    });
    obs.observe(host, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [orderId, countryCode]);

  return (
    <div
      ref={hostRef}
      className={cn("pok-guest-checkout kmcheck-pok-checkout [color-scheme:none]", className)}
      id="pok-payment-container-host"
    >
      <GuestCheckoutForm
        key={orderId}
        orderId={orderId}
        onSuccess={stableOnSuccess}
        onError={stableOnError}
        options={options}
      />
      <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <Lock className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" aria-hidden />
        <span>{t("checkout_pok_secure_note")}</span>
      </p>
    </div>
  );
}
