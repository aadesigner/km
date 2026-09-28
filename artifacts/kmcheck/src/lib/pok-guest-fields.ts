import { parseUserCountryCode } from "@/lib/user-countries";

/** POK SDK labels (en / it / al). Country + US/CA extras stay visible. */
const POK_OPTIONAL_HIDE_RE =
  /^(indirizzo|adresa|address|città|qyteti|city|telefono|phone|telefoni|add billing|aggiungi|shto informacion)/i;

const POK_EMPTY_FORM = {
  cardNumber: "",
  email: "",
  expiration: "",
  securityCode: "",
  holdersName: "",
  countryCode: "",
  address1: "",
  locality: "",
  administrativeArea: "",
  postalCode: "",
  phoneNumber: "",
} as const;

export type PokPaymentInitialState = {
  cardNumber: string;
  email: string;
  expiration: string;
  securityCode: string;
  holdersName: string;
  countryCode: string;
  address1: string;
  locality: string;
  administrativeArea: string;
  postalCode: string;
  phoneNumber: string;
};

export type PokGuestFieldSyncState = {
  billingClickAttempted: boolean;
};

export function pokPrefillCountryCode(profileCountry: string | null | undefined): string | undefined {
  return parseUserCountryCode(profileCountry) ?? undefined;
}

/**
 * Full POK PaymentFormData. The SDK does `initialState || defaults` (no merge),
 * so a partial object would leave card/country fields as undefined.
 */
export function buildPokPaymentInitialState(input: {
  email?: string | null;
  name?: string | null;
  countryCode?: string | null;
}): PokPaymentInitialState {
  const email = input.email?.trim() || "";
  const countryCode = pokPrefillCountryCode(input.countryCode) ?? "";
  const fromEmail = email.includes("@")
    ? email.split("@")[0]!.replace(/[._+]/g, " ").trim()
    : "";
  const holdersName = input.name?.trim() || fromEmail || "Cardholder";
  return {
    ...POK_EMPTY_FORM,
    email,
    holdersName,
    countryCode,
  };
}

/** POK requires State/Province + ZIP when billing country is US or CA. */
export function pokCountryRequiresBillingExtras(countryCode: string | null | undefined): boolean {
  const code = (countryCode ?? "").trim().toUpperCase();
  return code === "US" || code === "CA";
}

export function pokFieldLabel(text: string): string {
  return text.replace(/\*/g, "").trim();
}

export function isPokCountryFieldLabel(label: string): boolean {
  return /^(paese|shteti|country)\b/i.test(label);
}

/** Shown by POK only when billing is open for US/CA — required, must not be hidden. */
export function isPokRequiredUsCaFieldLabel(label: string): boolean {
  return /^(stato|provinca|state|cap|zip|kodi postar)\b/i.test(label);
}

export function shouldHidePokOptionalField(label: string): boolean {
  if (!label) return false;
  if (isPokCountryFieldLabel(label) || isPokRequiredUsCaFieldLabel(label)) return false;
  return POK_OPTIONAL_HIDE_RE.test(label);
}

export function pokBillingExtrasVisible(root: HTMLElement): boolean {
  for (const el of root.querySelectorAll(".pok-payment-label")) {
    if (isPokRequiredUsCaFieldLabel(pokFieldLabel(el.textContent ?? ""))) return true;
  }
  return false;
}

function hidePokRow(row: HTMLElement): void {
  if (row.getAttribute("data-kmcheck-pok-hidden") === "1") return;
  row.style.display = "none";
  row.setAttribute("data-kmcheck-pok-hidden", "1");
}

function revealPokRow(row: HTMLElement): void {
  if (row.getAttribute("data-kmcheck-pok-hidden") !== "1") return;
  row.style.display = "";
  row.removeAttribute("data-kmcheck-pok-hidden");
}

function isPokChromeRow(row: HTMLElement): boolean {
  return !!row.closest(
    ".pok-payment-options, .pok-payment-modal, .pok-payment-modal-backdrop, .pok-payment-info-container",
  );
}

/**
 * POK starts "Add billing info" collapsed. Prefilling US/CA does not open it, and the
 * checkbox is then disabled — click it once (never twice: that would close it again).
 */
export function openPokUsCaBillingIfNeeded(
  root: HTMLElement,
  prefillCountry: string | undefined,
  clickAttempted: boolean,
): boolean {
  if (clickAttempted || !pokCountryRequiresBillingExtras(prefillCountry)) return false;
  const box = root.querySelector<HTMLInputElement>("#addBillingCheckbox");
  if (!box) return false;
  if (box.checked) return false;
  box.disabled = false;
  box.click();
  return true;
}

/** Keep POK's Country (and US/CA State/ZIP) visible; hide optional address/phone. */
export function syncPokGuestVisibleFields(
  root: HTMLElement,
  prefillCountry: string | undefined,
  state: PokGuestFieldSyncState,
): PokGuestFieldSyncState {
  const extrasVisible = pokBillingExtrasVisible(root);
  const box = root.querySelector<HTMLInputElement>("#addBillingCheckbox");
  let billingClickAttempted = state.billingClickAttempted || extrasVisible || !!box?.checked;

  if (!extrasVisible && !box?.checked) {
    if (openPokUsCaBillingIfNeeded(root, prefillCountry, billingClickAttempted)) {
      billingClickAttempted = true;
    }
  }

  root.querySelectorAll<HTMLElement>(".pok-payment-relative").forEach((row) => {
    if (isPokChromeRow(row)) return;
    const label = pokFieldLabel(row.querySelector(".pok-payment-label")?.textContent ?? "");
    if (!label) return;
    if (isPokCountryFieldLabel(label) || isPokRequiredUsCaFieldLabel(label)) {
      revealPokRow(row);
      return;
    }
    if (shouldHidePokOptionalField(label)) hidePokRow(row);
  });

  const billing = box?.closest(".pok-payment-checkbox-container")
    ?? root.querySelector<HTMLElement>(".pok-payment-checkbox-container");
  if (billing) {
    const wrap = billing.parentElement instanceof HTMLElement ? billing.parentElement : billing;
    const extrasOpen = extrasVisible || !!box?.checked;
    if (!pokCountryRequiresBillingExtras(prefillCountry) || extrasOpen) {
      hidePokRow(wrap);
    }
  }

  return { billingClickAttempted };
}
