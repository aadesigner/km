type TFn = (key: string) => string;

function matchError(error: string | undefined, patterns: RegExp[]): boolean {
  if (!error) return false;
  return patterns.some((p) => p.test(error));
}

/** Maps API / PayPal English error strings and codes to i18n keys for all client pages. */
export function translateClientError(t: TFn, code?: string, error?: string): string {
  if (code === "RATE_LIMIT" || matchError(error, [/too many requests/i, /rate limit/i])) {
    return t("error_rate_limit");
  }
  if (code === "VIN_NO_DATA" || matchError(error, [/vin not found/i, /no vehicle history data found/i, /no history data/i])) {
    return t("vin_not_in_db");
  }
  if (code === "VIN_CHECK_UNAVAILABLE" || code === "PROVIDER_UNAVAILABLE" || code === "PROVIDER_NOT_CONFIGURED") {
    return t("checkout_check_unavailable_desc");
  }
  if (matchError(error, [/invalid or inactive coupon/i])) {
    return t("checkout_error_coupon_inactive");
  }
  if (matchError(error, [/invalid coupon code format/i, /^invalid coupon$/i])) {
    return t("checkout_error_invalid_coupon");
  }
  if (matchError(error, [/too many coupon attempts/i])) {
    return t("checkout_error_coupon_rate_limit");
  }
  if (matchError(error, [/payment capture failed/i])) {
    return t("checkout_error_capture");
  }
  if (matchError(error, [/failed to create payment/i, /order creation failed/i, /failed to create order/i])) {
    return t("checkout_error_payment_create");
  }
  if (matchError(error, [/failed to fetch vin data/i])) {
    return t("checkout_error_payment_fetch");
  }
  if (matchError(error, [/paypal failed to load/i])) {
    return t("checkout_error_paypal_load");
  }
  if (matchError(error, [/payment failed/i])) {
    return t("checkout_error_payment_failed");
  }
  if (matchError(error, [/card fields not ready/i])) {
    return t("checkout_error_card_not_ready");
  }
  if (matchError(error, [/card declined/i])) {
    return t("checkout_error_card_declined");
  }
  if (matchError(error, [/card payment failed/i])) {
    return t("checkout_error_card_failed");
  }
  if (code === "SIGN_IN_REQUIRED" || matchError(error, [/sign in required/i])) {
    return t("free_decoder_register_required");
  }
  if (matchError(error, [/invalid vin/i])) {
    return t("vin_error_length");
  }
  if (matchError(error, [/too many password reset/i])) {
    return t("error_forgot_rate_limit");
  }
  if (code === "RECAPTCHA_FAILED" || code === "RECAPTCHA_REQUIRED" || matchError(error, [/security verification required/i, /security check failed/i])) {
    return t("error_recaptcha_failed");
  }
  if (matchError(error, [/invalid email or password/i])) {
    return t("auth_error_invalid_credentials");
  }
  if (matchError(error, [/too many failed login attempts/i, /too many login attempts/i])) {
    return t("auth_error_login_lockout");
  }
  if (matchError(error, [/account has been suspended/i, /account suspended/i])) {
    return t("auth_error_banned");
  }
  if (code === "PASSWORD_TOO_SHORT" || matchError(error, [/at least \d+ characters/i])) {
    return t("reset_password_too_short");
  }
  if (code === "PASSWORD_NEEDS_LETTER" || code === "PASSWORD_NEEDS_LOWERCASE" || code === "PASSWORD_NEEDS_UPPERCASE" || matchError(error, [/include a letter/i, /lowercase letter/i, /uppercase letter/i])) {
    return t("error_password_needs_letter");
  }
  if (code === "PASSWORD_NEEDS_NUMBER" || matchError(error, [/include a number/i])) {
    return t("error_password_needs_number");
  }
  if (code === "PASSWORD_ALREADY_SET" || matchError(error, [/password is already set/i])) {
    return t("error_password_already_set");
  }
  if (matchError(error, [/daily limit.*free decodes/i])) {
    return t("free_decoder_daily_limit");
  }
  if (matchError(error, [/free vin decoder is currently disabled/i])) {
    return t("free_decoder_disabled");
  }
  return t("error_try_again");
}

export function translateCouponError(t: TFn, error?: string): string {
  if (!error) return t("checkout_error_invalid_coupon");
  return translateClientError(t, undefined, error);
}

export function translateAuthOAuthError(t: TFn, oauthError: string | null): string {
  if (!oauthError) return "";
  const key = `auth_error_${oauthError}`;
  const translated = t(key);
  return translated !== key ? translated : t("auth_error_signin_failed");
}
