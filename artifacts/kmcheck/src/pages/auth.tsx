import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, ApiRequestError } from "@/lib/auth-context";
import { useTranslation } from "@/i18n/context";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthPageShell } from "@/components/auth-page-shell";
import { SEOHead, usePageSeo } from "@/components/seo";
import { translateAuthOAuthError, translateClientError } from "@/lib/translate-client-error";
import { getPostAuthRedirectPath } from "@/lib/checkout-vin-flow";
import {
  getPasswordStrength,
  isPasswordStrongEnough,
  getPasswordIssueCode,
} from "@/lib/password-policy";

function passwordErrorMessage(t: (k: string) => string, password: string): string {
  const code = getPasswordIssueCode(password);
  if (code === "PASSWORD_TOO_SHORT") return t("reset_password_too_short");
  if (code === "PASSWORD_NEEDS_LETTER") return t("error_password_needs_letter");
  if (code === "PASSWORD_NEEDS_LOWERCASE") return t("error_password_needs_letter");
  if (code === "PASSWORD_NEEDS_UPPERCASE") return t("error_password_needs_letter");
  if (code === "PASSWORD_NEEDS_NUMBER") return t("error_password_needs_number");
  return t("error_password_weak");
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type PublicSettings = {
  googleEnabled?: boolean;
  facebookEnabled?: boolean;
};

function useOAuthSettings() {
  const [settings, setSettings] = useState<PublicSettings>({});
  useEffect(() => {
    fetch(`${basePath}/api/payments/public-settings`)
      .then(r => r.json())
      .then((d: PublicSettings) => setSettings(d))
      .catch(() => {});
  }, []);
  return settings;
}

interface AuthFormProps {
  lang: string;
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const { login, register, isSignedIn, isLoaded } = useAuth();
  const { language, t } = useTranslation();
  const { getToken: getRecaptchaToken, enabled: rcEnabled, ready: rcReady } = useRecaptcha();
  const { googleEnabled, facebookEnabled } = useOAuthSettings();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const oauthError = searchParams.get("error");
  const [error, setError] = useState("");

  useEffect(() => {
    if (oauthError) setError(translateAuthOAuthError(t, oauthError));
  }, [oauthError, t]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setLocation(getPostAuthRedirectPath(language));
  }, [isLoaded, isSignedIn, language, setLocation]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rcEnabled && !rcReady) {
      setError(t("error_recaptcha_loading"));
      return;
    }

    setLoading(true);
    try {
      const action = mode === "sign-in" ? "login" : "register";
      const recaptchaToken = await getRecaptchaToken(action) ?? undefined;

      if (rcEnabled && !recaptchaToken) {
        setError(t("error_recaptcha_failed"));
        return;
      }

      if (mode === "sign-in") {
        await login(email, password, recaptchaToken);
      } else {
        if (!isPasswordStrongEnough(password)) {
          setError(passwordErrorMessage(t, password));
          return;
        }
        await register(email, password, name || undefined, recaptchaToken);
      }
      setLocation(getPostAuthRedirectPath(language));
    } catch (err) {
      const code = err instanceof ApiRequestError ? err.code : undefined;
      const message = err instanceof Error ? err.message : undefined;
      setError(translateClientError(t, code, message));
    } finally {
      setLoading(false);
    }
  };

  const isSignIn = mode === "sign-in";
  const seo = usePageSeo(isSignIn ? "auth" : "sign_up");
  const signupPasswordOk = isSignIn || isPasswordStrongEnough(password);
  const submitDisabled = loading || !signupPasswordOk;
  const hasSocial = googleEnabled || facebookEnabled;

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} lang={seo.lang} noIndex />
      <AuthPageShell>
            {/* Tabs */}
            <div className="flex rounded-xl border border-border overflow-hidden mb-5">
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  isSignIn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
                onClick={() => { setMode("sign-in"); setError(""); }}
              >
                {t("sign_in")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  !isSignIn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
                onClick={() => { setMode("sign-up"); setError(""); }}
              >
                {t("sign_up")}
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <div className="mb-4">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {isSignIn ? t("auth_welcome_back") : t("auth_create_account")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSignIn ? t("auth_signin_subtitle") : t("auth_signup_subtitle")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {!isSignIn && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">
                        {t("auth_name_label")}{" "}
                        <span className="text-muted-foreground font-normal">{t("auth_name_optional")}</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t("auth_name_placeholder")}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoComplete="name"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="password" className="text-sm font-medium">{t("auth_password_label")}</Label>
                      {isSignIn && (
                        <Link
                          href={`/${language}/forgot-password`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {t("forgot_password_link")}
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={isSignIn ? t("auth_password_placeholder_signin") : t("auth_password_placeholder_signup")}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={isSignIn ? 1 : 8}
                        autoComplete={isSignIn ? "current-password" : "new-password"}
                        disabled={loading}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {!isSignIn && password.length > 0 && (() => {
                        const strength = getPasswordStrength(password);
                        const labels = ["", t("pw_strength_weak"), t("pw_strength_fair"), t("pw_strength_good"), t("pw_strength_strong")];
                        const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
                        const textColors = ["", "text-red-600", "text-orange-500", "text-yellow-600", "text-green-600"];
                        return (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-1 space-y-1">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map(i => (
                                  <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : "bg-muted"}`}
                                  />
                                ))}
                              </div>
                              <p className={`text-xs font-medium ${textColors[strength]}`}>{labels[strength]}</p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-xl">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold rounded-xl shadow-md shadow-primary/20"
                    disabled={submitDisabled}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isSignIn ? t("auth_signing_in") : t("auth_creating_account")}</>
                    ) : (
                      isSignIn ? t("sign_in") : t("sign_up")
                    )}
                  </Button>
                </form>

                {hasSocial && (
                  <div className="mt-4 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs text-muted-foreground">
                        <span className="bg-card px-2">{t("or")}</span>
                      </div>
                    </div>

                    {googleEnabled && (
                      <a
                        href={`${basePath}/api/auth/google?lang=${language}`}
                        className="flex w-full h-11 items-center justify-center gap-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors text-sm font-medium"
                      >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {isSignIn ? t("auth_continue_with_google") : t("auth_signup_with_google")}
                      </a>
                    )}

                    {facebookEnabled && (
                      <a
                        href={`${basePath}/api/auth/facebook?lang=${language}`}
                        className="flex w-full h-11 items-center justify-center gap-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors text-sm font-medium text-white"
                      >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        {isSignIn ? t("auth_continue_with_facebook") : t("auth_signup_with_facebook")}
                      </a>
                    )}
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {isSignIn ? (
                    <>
                      {t("auth_no_account")}{" "}
                      <button type="button" className="text-primary font-semibold hover:underline" onClick={() => { setMode("sign-up"); setError(""); }}>
                        {t("auth_sign_up_free")}
                      </button>
                    </>
                  ) : (
                    <>
                      {t("auth_have_account")}{" "}
                      <button type="button" className="text-primary font-semibold hover:underline" onClick={() => { setMode("sign-in"); setError(""); }}>
                        {t("sign_in")}
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            </AnimatePresence>
      </AuthPageShell>
    </>
  );
}
