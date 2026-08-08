import { useEffect, useMemo, useRef } from "react";
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

/** Labels for fields we hide (SDK is en/it/al only). Card fields stay visible. */
const HIDE_LABEL_RE =
  /^(email|e-?mail|paese|shteti|country|indirizzo|adresa|address|stato|provinca|state|città|qyteti|city|cap|zip|kodi postar|telefono|phone|telefoni|add billing|aggiungi|shto informacion)/i;

function hideNonCardPokFields(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".pok-payment-relative").forEach((row) => {
    if (row.getAttribute("data-kmcheck-pok-hidden") === "1") return;
    const label = row.querySelector(".pok-payment-label")?.textContent?.replace(/\*/g, "").trim() ?? "";
    if (HIDE_LABEL_RE.test(label)) {
      row.style.display = "none";
      row.setAttribute("data-kmcheck-pok-hidden", "1");
    }
  });
  const billing = root.querySelector<HTMLElement>("#addBillingCheckbox")?.closest(".pok-payment-checkbox-container")
    ?? root.querySelector<HTMLElement>(".pok-payment-checkbox-container");
  if (billing && billing.getAttribute("data-kmcheck-pok-hidden") !== "1") {
    const wrap = billing.parentElement instanceof HTMLElement ? billing.parentElement : billing;
    wrap.style.display = "none";
    wrap.setAttribute("data-kmcheck-pok-hidden", "1");
  }
}

/**
 * Inline POK card checkout. Card number / expiry / CVC / name stay visible.
 * Email & billing are prefilled from the signed-in account and hidden — never posted to kmcheck.
 * PAN/CVV are encrypted inside the POK SDK and sent only to POK (not our API).
 */
export function PokGuestCheckout({ orderId, pokEnv, onSuccess, onError, className }: Props) {
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const hostRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const locale = useMemo(() => pokLocaleFromLanguage(language), [language]);

  const initialState = useMemo(() => {
    const countryRaw = (user?.countryCode ?? "").trim().toUpperCase();
    // US/CA force address fields in the SDK — prefer a non-NA default when hiding billing.
    const countryCode =
      countryRaw && countryRaw !== "US" && countryRaw !== "CA"
        ? countryRaw
        : "AL";
    const email = user?.email?.trim() || "checkout@kmcheck.com";
    const holdersName =
      user?.name?.trim()
      || (email.includes("@") ? email.split("@")[0]!.replace(/[._+]/g, " ").trim() : "")
      || "Cardholder";
    return {
      email,
      holdersName,
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
      onErrorRef.current(t("checkout_error_card_declined"));
    },
    [t],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => hideNonCardPokFields(host));
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
  }, [orderId]);

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
