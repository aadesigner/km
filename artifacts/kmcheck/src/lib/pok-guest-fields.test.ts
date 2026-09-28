/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  buildPokPaymentInitialState,
  isPokCountryFieldLabel,
  isPokRequiredUsCaFieldLabel,
  openPokUsCaBillingIfNeeded,
  pokCountryRequiresBillingExtras,
  pokPrefillCountryCode,
  shouldHidePokOptionalField,
  syncPokGuestVisibleFields,
} from "./pok-guest-fields";

describe("buildPokPaymentInitialState", () => {
  it("sends every POK form field as a string (SDK does not merge partial initialState)", () => {
    const state = buildPokPaymentInitialState({
      email: "a@b.com",
      name: "Ada Lovelace",
      countryCode: "de",
    });
    expect(state).toEqual({
      cardNumber: "",
      email: "a@b.com",
      expiration: "",
      securityCode: "",
      holdersName: "Ada Lovelace",
      countryCode: "DE",
      address1: "",
      locality: "",
      administrativeArea: "",
      postalCode: "",
      phoneNumber: "",
    });
  });

  it("prefills US/CA as-is and does not invent AL when country is unset", () => {
    expect(buildPokPaymentInitialState({ countryCode: "US" }).countryCode).toBe("US");
    expect(buildPokPaymentInitialState({ countryCode: "ca" }).countryCode).toBe("CA");
    expect(buildPokPaymentInitialState({ countryCode: null }).countryCode).toBe("");
    expect(buildPokPaymentInitialState({}).countryCode).toBe("");
    expect(buildPokPaymentInitialState({ countryCode: "XK" }).countryCode).toBe("AL");
  });
});

describe("pokPrefillCountryCode", () => {
  it("sends the profile country including US/CA (does not remap to AL)", () => {
    expect(pokPrefillCountryCode("de")).toBe("DE");
    expect(pokPrefillCountryCode("US")).toBe("US");
    expect(pokPrefillCountryCode("ca")).toBe("CA");
    expect(pokPrefillCountryCode("XK")).toBe("AL");
  });

  it("omits country when the profile has none so POK can require a choice", () => {
    expect(pokPrefillCountryCode(null)).toBeUndefined();
    expect(pokPrefillCountryCode("")).toBeUndefined();
    expect(pokPrefillCountryCode("  ")).toBeUndefined();
    expect(pokPrefillCountryCode("ZZ")).toBeUndefined();
  });
});

describe("POK field labels", () => {
  it("treats Country as visible and required (en/it/al)", () => {
    expect(isPokCountryFieldLabel("Country")).toBe(true);
    expect(isPokCountryFieldLabel("Paese")).toBe(true);
    expect(isPokCountryFieldLabel("Shteti")).toBe(true);
    expect(shouldHidePokOptionalField("Country")).toBe(false);
  });

  it("does not hide POK's US/CA required extras", () => {
    expect(isPokRequiredUsCaFieldLabel("State/Province")).toBe(true);
    expect(isPokRequiredUsCaFieldLabel("ZIP Code")).toBe(true);
    expect(isPokRequiredUsCaFieldLabel("CAP")).toBe(true);
    expect(isPokRequiredUsCaFieldLabel("Kodi postar")).toBe(true);
    expect(shouldHidePokOptionalField("State/Province")).toBe(false);
    expect(shouldHidePokOptionalField("ZIP Code")).toBe(false);
  });

  it("hides optional address / phone / add-billing copy", () => {
    expect(shouldHidePokOptionalField("Address")).toBe(true);
    expect(shouldHidePokOptionalField("City")).toBe(true);
    expect(shouldHidePokOptionalField("Phone")).toBe(true);
    expect(shouldHidePokOptionalField("Add billing info")).toBe(true);
    expect(shouldHidePokOptionalField("Card number")).toBe(false);
  });
});

describe("pokCountryRequiresBillingExtras", () => {
  it("is only US and CA", () => {
    expect(pokCountryRequiresBillingExtras("US")).toBe(true);
    expect(pokCountryRequiresBillingExtras("CA")).toBe(true);
    expect(pokCountryRequiresBillingExtras("AL")).toBe(false);
    expect(pokCountryRequiresBillingExtras(undefined)).toBe(false);
  });
});

describe("openPokUsCaBillingIfNeeded", () => {
  it("clicks the disabled US/CA billing checkbox once so State/ZIP can render", () => {
    const root = document.createElement("div");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = "addBillingCheckbox";
    box.disabled = true;
    let clicks = 0;
    box.addEventListener("click", () => {
      clicks += 1;
      box.checked = true;
    });
    root.appendChild(box);

    expect(openPokUsCaBillingIfNeeded(root, "US", false)).toBe(true);
    expect(clicks).toBe(1);
    expect(box.checked).toBe(true);
    expect(openPokUsCaBillingIfNeeded(root, "US", true)).toBe(false);
    expect(clicks).toBe(1);
  });

  it("does not click for a non-US/CA prefill", () => {
    const root = document.createElement("div");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = "addBillingCheckbox";
    root.appendChild(box);
    expect(openPokUsCaBillingIfNeeded(root, "DE", false)).toBe(false);
    expect(box.checked).toBe(false);
  });
});

describe("syncPokGuestVisibleFields", () => {
  it("leaves Country visible and hides optional address", () => {
    const root = document.createElement("div");
    const country = document.createElement("div");
    country.className = "pok-payment-relative";
    country.innerHTML = '<span class="pok-payment-label">Country *</span>';
    const address = document.createElement("div");
    address.className = "pok-payment-relative";
    address.innerHTML = '<span class="pok-payment-label">Address</span>';
    root.append(country, address);

    const next = syncPokGuestVisibleFields(root, "AL", { billingClickAttempted: false });

    expect(next.billingClickAttempted).toBe(false);
    expect(country.getAttribute("data-kmcheck-pok-hidden")).toBeNull();
    expect(address.getAttribute("data-kmcheck-pok-hidden")).toBe("1");
    expect(address.style.display).toBe("none");
  });

  it("unhides a Country row that was previously forced hidden", () => {
    const root = document.createElement("div");
    const country = document.createElement("div");
    country.className = "pok-payment-relative";
    country.setAttribute("data-kmcheck-pok-hidden", "1");
    country.style.display = "none";
    country.innerHTML = '<span class="pok-payment-label">Country</span>';
    root.append(country);

    syncPokGuestVisibleFields(root, undefined, { billingClickAttempted: false });

    expect(country.getAttribute("data-kmcheck-pok-hidden")).toBeNull();
    expect(country.style.display).toBe("");
  });

  it("does not hide State/ZIP when POK has opened US billing extras", () => {
    const root = document.createElement("div");
    const state = document.createElement("div");
    state.className = "pok-payment-relative";
    state.innerHTML = '<span class="pok-payment-label">State/Province *</span>';
    const zip = document.createElement("div");
    zip.className = "pok-payment-relative";
    zip.innerHTML = '<span class="pok-payment-label">ZIP Code *</span>';
    root.append(state, zip);

    syncPokGuestVisibleFields(root, "US", { billingClickAttempted: true });

    expect(state.getAttribute("data-kmcheck-pok-hidden")).toBeNull();
    expect(zip.getAttribute("data-kmcheck-pok-hidden")).toBeNull();
  });
});
