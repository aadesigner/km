import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, ApiRequestError } from "@/lib/auth-context";
import { useTranslation } from "@/i18n/context";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthPageShell } from "@/components/auth-page-shell";
import { SEOHead, usePageSeo } from "@/components/seo";
import { translateAuthOAuthError, translateClientError } from "@/lib/translate-client-error";
import { getPostAuthRedirectPath } from "@/lib/checkout-vin-flow";
import { PasswordRequirements } from "@/components/password-requirements";
import { isPasswordStrongEnough, getPasswordErrorMessage } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const AUTH_INPUT = cn(
  "h-12 rounded-xl border-border/60 bg-muted/25 px-3.5 text-[15px] shadow-none",
  "placeholder:text-muted-foreground/55",
  "hover:border-border hover:bg-muted/35",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/45",
  "transition-[color,background-color,border-color,box-shadow]",
);

function AuthField({
  id,
  label,
  optional,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2 min-w-0", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-[13px] font-semibold tracking-tight text-foreground/90">
          {label}
          {optional ? (
            <span className="ml-1 font-normal text-muted-foreground">{optional}</span>
          ) : null}
        </Label>
        {hint}
      </div>
      {children}
    </div>
  );
}

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
        if (!acceptedTerms) {
          setError(t("auth_error_terms_required"));
          return;
        }
        if (!isPasswordStrongEnough(password)) {
          setError(getPasswordErrorMessage(t, password));
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
  const submitDisabled = loading || (rcEnabled && !rcReady) || !signupPasswordOk || (!isSignIn && !acceptedTerms);
  const hasSocial = googleEnabled || facebookEnabled;

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} lang={seo.lang} noIndex />
      <AuthPageShell>
            {/* Mode switch */}
            <div className="flex p-1 rounded-xl bg-muted/45 border border-border/50 mb-6">
              <button
                type="button"
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                  isSignIn
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => { setMode("sign-in"); setError(""); setAcceptedTerms(false); }}
              >
                {t("sign_in")}
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                  !isSignIn
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => { setMode("sign-up"); setError(""); }}
              >
                {t("sign_up")}
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-6 text-center sm:text-left">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {isSignIn ? t("auth_welcome_back") : t("auth_create_account")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {isSignIn ? t("auth_signin_subtitle") : t("auth_signup_subtitle")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isSignIn ? (
                    <div className="grid grid-cols-2 gap-3">
                      <AuthField
                        id="name"
                        label={t("auth_name_label")}
                        optional={t("auth_name_optional")}
                      >
                        <div className="relative min-w-0">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input
                            id="name"
                            type="text"
                            placeholder={t("auth_name_placeholder")}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoComplete="name"
                            disabled={loading}
                            className={cn(AUTH_INPUT, "pl-9")}
                          />
                        </div>
                      </AuthField>

                      <AuthField id="email" label={t("email")}>
                        <div className="relative min-w-0">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input
                            id="email"
                            type="email"
                            placeholder={t("auth_email_placeholder")}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                            className={cn(AUTH_INPUT, "pl-9")}
                          />
                        </div>
                      </AuthField>
                    </div>
                  ) : (
                    <AuthField id="email" label={t("email")}>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("auth_email_placeholder")}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          disabled={loading}
                          className={cn(AUTH_INPUT, "pl-10")}
                        />
                      </div>
                    </AuthField>
                  )}

                  <AuthField
                    id="password"
                    label={t("auth_password_label")}
                    hint={isSignIn ? (
                      <Link
                        href={`/${language}/forgot-password`}
                        className="text-xs text-primary hover:underline font-medium shrink-0"
                      >
                        {t("forgot_password_link")}
                      </Link>
                    ) : undefined}
                  >
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={isSignIn ? t("auth_password_placeholder_signin") : t("auth_password_placeholder_signup")}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={isSignIn ? 1 : 6}
                        autoComplete={isSignIn ? "current-password" : "new-password"}
                        disabled={loading}
                        className={cn(AUTH_INPUT, "pl-10 pr-11")}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground/60 hover:text-foreground transition-colors rounded-r-xl"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {!isSignIn && password.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <PasswordRequirements password={password} className="pt-2" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AuthField>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-destructive bg-destructive/[0.07] border border-destructive/20 px-3.5 py-3 rounded-xl leading-snug"
                        role="alert"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isSignIn && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
                      <Checkbox
                        id="accept-terms"
                        checked={acceptedTerms}
                        onCheckedChange={(v) => setAcceptedTerms(v === true)}
                        disabled={loading}
                        className="mt-0.5 h-3.5 w-3.5 rounded-[3px] border-muted-foreground/40 data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor="accept-terms"
                        className="text-[11px] leading-snug text-muted-foreground/80 cursor-pointer select-none"
                      >
                        {t("auth_accept_terms_lead")}{" "}
                        <Link
                          href={`/${language}/terms`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("terms")}
                        </Link>{" "}
                        {t("auth_accept_terms_and")}{" "}
                        <Link
                          href={`/${language}/privacy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("auth_privacy_link")}
                        </Link>
                      </label>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(158,72%,34%)] hover:opacity-[0.97] shadow-lg shadow-primary/20 transition-opacity"
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
                  <div className="mt-6 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60" />
                      </div>
                      <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        <span className="bg-card px-3">{t("or")}</span>
                      </div>
                    </div>

                    {googleEnabled && (
                      <a
                        href={`${basePath}/api/auth/google?lang=${language}`}
                        className="flex w-full h-12 items-center justify-center gap-2.5 rounded-xl border border-border/70 bg-background/80 hover:bg-muted/40 hover:border-border transition-all text-sm font-medium shadow-sm"
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
                        className="flex w-full h-12 items-center justify-center gap-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors text-sm font-medium text-white shadow-sm shadow-[#1877F2]/25"
                      >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        {isSignIn ? t("auth_continue_with_facebook") : t("auth_signup_with_facebook")}
                      </a>
                    )}
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-6 pt-5 border-t border-border/50">
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
                      <button type="button" className="text-primary font-semibold hover:underline" onClick={() => { setMode("sign-in"); setError(""); setAcceptedTerms(false); }}>
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
