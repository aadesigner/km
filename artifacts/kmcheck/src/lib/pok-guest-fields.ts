import { parseUserCountryCode } from "@/lib/user-countries";

/** POK SDK labels (en / it / al). Country + US/CA extras stay visible. */
const POK_OPTIONAL_HIDE_RE =
  /^(indirizzo|adresa|address|città|qyteti|city|telefono|phone|telefoni|add billing|aggiungi|shto informacion)/i;

export function pokPrefillCountryCode(profileCountry: string | null | undefined): string | undefined {
  return parseUserCountryCode(profileCountry) ?? undefined;
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

/**
 * POK starts "Add billing info" collapsed. Prefilling US/CA does not open it, and the
 * checkbox is then disabled — so we click it once so State/ZIP can appear.
 */
export function openPokUsCaBillingIfNeeded(
  root: HTMLElement,
  prefillCountry: string | undefined,
  alreadyOpened: boolean,
): boolean {
  if (alreadyOpened || !pokCountryRequiresBillingExtras(prefillCountry)) return false;
  const box = root.querySelector<HTMLInputElement>("#addBillingCheckbox");
  if (!box) return false;
  if (box.checked) return true;
  const wasDisabled = box.disabled;
  box.disabled = false;
  box.click();
  box.disabled = wasDisabled;
  return true;
}

/** Keep POK's Country (and US/CA State/ZIP) visible; hide optional address/phone. */
export function syncPokGuestVisibleFields(
  root: HTMLElement,
  prefillCountry: string | undefined,
  alreadyOpenedBilling: boolean,
): boolean {
  const opened = openPokUsCaBillingIfNeeded(root, prefillCountry, alreadyOpenedBilling);

  root.querySelectorAll<HTMLElement>(".pok-payment-relative").forEach((row) => {
    const label = pokFieldLabel(row.querySelector(".pok-payment-label")?.textContent ?? "");
    if (!label) return;
    if (isPokCountryFieldLabel(label) || isPokRequiredUsCaFieldLabel(label)) {
      revealPokRow(row);
      return;
    }
    if (shouldHidePokOptionalField(label)) hidePokRow(row);
  });

  const billing = root.querySelector<HTMLElement>("#addBillingCheckbox")?.closest(".pok-payment-checkbox-container")
    ?? root.querySelector<HTMLElement>(".pok-payment-checkbox-container");
  if (billing) {
    const wrap = billing.parentElement instanceof HTMLElement ? billing.parentElement : billing;
    hidePokRow(wrap);
  }

  return opened || alreadyOpenedBilling;
}
