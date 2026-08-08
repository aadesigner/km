import { useMemo, useRef } from "react";
import { GuestCheckoutForm } from "@nebula-ltd/pok-payments-js/react";
import type { PaymentErrorResponse } from "@nebula-ltd/pok-payments-js";
import { useTranslation } from "@/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

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
 * Inline POK card checkout with the SDK’s default fields (card + billing).
 * Prefills account email/name/country when available; PAN/CVV stay inside POK only.
 */
export function PokGuestCheckout({ orderId, pokEnv, onSuccess, onError, className }: Props) {
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const locale = useMemo(() => pokLocaleFromLanguage(language), [language]);

  const initialState = useMemo(() => {
    const countryRaw = (user?.countryCode ?? "").trim().toUpperCase();
    const countryCode =
      countryRaw && countryRaw !== "US" && countryRaw !== "CA"
        ? countryRaw
        : "AL";
    const email = user?.email?.trim() || undefined;
    const holdersName =
      user?.name?.trim()
      || (email?.includes("@") ? email.split("@")[0]!.replace(/[._+]/g, " ").trim() : undefined)
      || undefined;
    return {
      ...(email ? { email } : {}),
      ...(holdersName ? { holdersName } : {}),
      countryCode,
    };
  }, [user?.email, user?.name, user?.countryCode]);

  const options = useMemo(
    () => ({
      env: pokEnv,
      locale,
      countrySelect: "modal" as const,
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
      console.error("POK checkout error", error);
      onErrorRef.current(error.message?.trim() || t("checkout_error_card_declined"));
    },
    [t],
  );

  return (
    <div
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
