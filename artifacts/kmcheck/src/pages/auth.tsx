import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, ApiRequestError } from "@/lib/auth-context";
import { useTranslation } from "@/i18n/context";
import { useRecaptcha, executeRecaptchaToken } from "@/hooks/use-recaptcha";
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
import {
  readAuthCredentials,
  resolveAuthRecaptchaToken,
  validateAuthSignupInput,
} from "@/lib/auth-email-submit";
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

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  publicSettingsQueryOptions,
  parseOAuthPublicFlags,
  readPersistedOAuthFlags,
  persistOAuthFlags,
  resolveOAuthPublicFlags,
  readPersistedOAuthAsPublicSettings,
  oauthFlagsAnyEnabled,
} from "@/lib/public-settings";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

const SOCIAL_BTN_COMPACT = "flex flex-1 items-center justify-center gap-2 h-11 min-w-0 rounded-xl text-sm font-medium transition-all";
const SOCIAL_BTN_FULL = "flex w-full h-12 items-center justify-center gap-2.5 rounded-xl text-sm font-medium transition-all";

type SocialProviderId = "facebook" | "google" | "linkedin";

function SocialAuthButtons({
  language,
  mode,
  googleEnabled,
  facebookEnabled,
  linkedinEnabled,
  loading,
}: {
  language: string;
  mode: "sign-in" | "sign-up";
  googleEnabled: boolean;
  facebookEnabled: boolean;
  linkedinEnabled: boolean;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const isSignIn = mode === "sign-in";

  const providers: Array<{
    id: SocialProviderId;
    enabled: boolean;
    href: string;
    shortLabel: string;
    fullLabel: string;
    className: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "facebook",
      enabled: facebookEnabled,
      href: `${basePath}/api/auth/facebook?lang=${language}`,
      shortLabel: "Facebook",
      fullLabel: isSignIn ? t("auth_continue_with_facebook") : t("auth_signup_with_facebook"),
      className: "bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-sm shadow-[#1877F2]/20",
      icon: <FacebookIcon className="h-4 w-4 shrink-0" />,
    },
    {
      id: "google",
      enabled: googleEnabled,
      href: `${basePath}/api/auth/google?lang=${language}`,
      shortLabel: "Google",
      fullLabel: isSignIn ? t("auth_continue_with_google") : t("auth_signup_with_google"),
      className: "border border-border/70 bg-background/80 hover:bg-muted/40 hover:border-border shadow-sm",
      icon: <GoogleIcon className="h-4 w-4 shrink-0" />,
    },
    {
      id: "linkedin",
      enabled: linkedinEnabled,
      href: `${basePath}/api/auth/linkedin?lang=${language}`,
      shortLabel: "LinkedIn",
      fullLabel: isSignIn ? t("auth_continue_with_linkedin") : t("auth_signup_with_linkedin"),
      className: "bg-[#0A66C2] hover:bg-[#004182] text-white shadow-sm shadow-[#0A66C2]/20",
      icon: <LinkedInIcon className="h-4 w-4 shrink-0" />,
    },
  ];

  const active = providers.filter((p) => p.enabled);
  const count = active.length;

  if (loading) {
    return (
      <div className="mt-6 space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            <span className="bg-card px-3">{t("or")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: Math.max(count, 3) }).map((_, i) => (
            <div key={i} className="flex-1 h-11 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (count === 0) return null;

  const compact = count > 1;

  return (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          <span className="bg-card px-3">{t("or")}</span>
        </div>
      </div>

      <div className={cn("flex items-stretch gap-2", count === 1 && "flex-col")}>
        {active.map((provider) => (
          <a
            key={provider.id}
            href={provider.href}
            className={cn(
              compact ? SOCIAL_BTN_COMPACT : SOCIAL_BTN_FULL,
              provider.className,
            )}
          >
            {provider.icon}
            <span>{compact ? provider.shortLabel : provider.fullLabel}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

interface AuthFormProps {
  lang: string;
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const { user, login, register, isSignedIn, isLoaded } = useAuth();
  const { language, t } = useTranslation();
  const { getToken: getRecaptchaToken, enabled: rcEnabled, ready: rcReady, siteKey: rcSiteKey } = useRecaptcha();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const oauthError = searchParams.get("error");
  const persistedOAuthRef = useRef(readPersistedOAuthFlags());
  const {
    data: oauthSettings,
    isPending: oauthSettingsPending,
    isFetched: oauthSettingsFetched,
    isError: oauthSettingsError,
    refetch: refetchOAuthSettings,
  } = useQuery({
    ...publicSettingsQueryOptions(),
    initialData: readPersistedOAuthAsPublicSettings,
    initialDataUpdatedAt: () => (readPersistedOAuthFlags() ? 0 : undefined),
    placeholderData: (previous) => previous,
    retry: 2,
    retryDelay: 400,
  });

  useEffect(() => {
    void queryClient.ensureQueryData(publicSettingsQueryOptions());
  }, [queryClient]);

  useEffect(() => {
    if (!oauthSettingsFetched || !oauthSettings) return;
    const flags = parseOAuthPublicFlags(oauthSettings);
    if (oauthFlagsAnyEnabled(flags)) {
      persistOAuthFlags(flags);
      persistedOAuthRef.current = flags;
      return;
    }
    const cached = persistedOAuthRef.current ?? readPersistedOAuthFlags();
    if (!oauthFlagsAnyEnabled(cached)) {
      persistOAuthFlags(flags);
      persistedOAuthRef.current = null;
    }
  }, [oauthSettingsFetched, oauthSettings]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refetchOAuthSettings();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refetchOAuthSettings();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetchOAuthSettings]);

  // After OAuth cancel the server redirects here with ?error=… — refetch flags in background.
  useEffect(() => {
    if (!oauthError) return;
    void refetchOAuthSettings();
  }, [oauthError, refetchOAuthSettings]);

  const liveOAuthFlags = oauthSettingsFetched && oauthSettings
    ? parseOAuthPublicFlags(oauthSettings)
    : null;
  const cachedOAuthFlags = persistedOAuthRef.current ?? readPersistedOAuthFlags();
  const resolvedOAuth = resolveOAuthPublicFlags(liveOAuthFlags, cachedOAuthFlags);
  const googleEnabled = resolvedOAuth.googleEnabled;
  const facebookEnabled = resolvedOAuth.facebookEnabled;
  const linkedinEnabled = resolvedOAuth.linkedinEnabled;
  const socialSettingsLoading = !oauthFlagsAnyEnabled(resolvedOAuth)
    && oauthSettingsPending
    && !oauthSettingsError;
  const [mode, setMode] = useState(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const recaptchaPrimeRef = useRef<Promise<string | null> | null>(null);
  const recaptchaPrimeAtRef = useRef(0);

  const recaptchaAction = mode === "sign-in" ? "login" : "register";

  const primeRecaptcha = () => {
    if (!rcEnabled || !rcSiteKey || loading) return;
    const now = Date.now();
    if (recaptchaPrimeRef.current && now - recaptchaPrimeAtRef.current < 800) return;
    recaptchaPrimeAtRef.current = now;
    recaptchaPrimeRef.current = rcReady
      ? executeRecaptchaToken(rcSiteKey, recaptchaAction)
      : getRecaptchaToken(recaptchaAction);
  };

  const syncFieldFromInput = (field: "email" | "password" | "name", value: string) => {
    if (field === "email") setEmail(value);
    else if (field === "password") setPassword(value);
    else setName(value);
  };

  const [error, setError] = useState("");

  useEffect(() => {
    if (oauthError) setError(translateAuthOAuthError(t, oauthError));
  }, [oauthError, t]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setLocation(getPostAuthRedirectPath(language));
  }, [isLoaded, isSignedIn, language, setLocation]);

  useEffect(() => {
    if (!isLoaded || isSignedIn || mode !== "sign-up") return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const attach = () => {
      const el = passwordRef.current;
      if (!el || cancelled) return;
      cleanup?.();

      const syncPasswordFromDom = () => {
        if (el.value) syncFieldFromInput("password", el.value);
      };
      const onAutofillAnim = (e: AnimationEvent) => {
        if (e.animationName === "native-autofill-start") syncPasswordFromDom();
      };
      el.addEventListener("animationstart", onAutofillAnim);
      const timer = window.setTimeout(syncPasswordFromDom, 200);
      const timer2 = window.setTimeout(syncPasswordFromDom, 600);
      cleanup = () => {
        el.removeEventListener("animationstart", onAutofillAnim);
        window.clearTimeout(timer);
        window.clearTimeout(timer2);
      };
    };

    attach();
    const retry = window.setTimeout(attach, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      cleanup?.();
    };
  }, [isLoaded, isSignedIn, mode]);

  // Signed-in users redirect; guests see the form immediately (don't wait on /me).
  if (isSignedIn || (user !== null && !isLoaded)) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const isSignInMode = mode === "sign-in";
    const creds = readAuthCredentials(form, { email, password, name });

    if (!isSignInMode) {
      const signupCheck = validateAuthSignupInput(creds, acceptedTerms, t);
      if (!signupCheck.ok) {
        setError(signupCheck.error);
        return;
      }
    }

    setLoading(true);
    try {
      if (rcEnabled && !rcReady) {
        setError(t("error_recaptcha_loading"));
        return;
      }

      const primed = recaptchaPrimeRef.current;
      recaptchaPrimeRef.current = null;

      const recaptchaToken = await resolveAuthRecaptchaToken({
        enabled: rcEnabled,
        siteKey: rcSiteKey,
        action: recaptchaAction,
        primed,
        getToken: getRecaptchaToken,
      });

      if (rcEnabled && !recaptchaToken) {
        setError(t("error_recaptcha_failed"));
        return;
      }

      if (isSignInMode) {
        await login(creds.email, creds.password, recaptchaToken);
      } else {
        await register(creds.email, creds.password, creds.name || undefined, recaptchaToken);
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
  const submitDisabled = loading || (!isSignIn && !acceptedTerms);

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} lang={seo.lang} noIndex />
      <AuthPageShell>
            {/* Mode switch */}
            <div className="flex p-1 rounded-xl bg-muted/45 border border-border/50 mb-4">
              <button
                type="button"
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
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
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
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
                <div className="mb-5 text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {isSignIn ? t("auth_welcome_back") : t("auth_create_account")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {isSignIn ? t("auth_signin_subtitle") : t("auth_signup_subtitle")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
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
                            name="name"
                            type="text"
                            placeholder={t("auth_name_placeholder")}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onInput={e => syncFieldFromInput("name", e.currentTarget.value)}
                            autoComplete="name"
                            disabled={loading}
                            className={cn(AUTH_INPUT, "pl-9 auth-field-input")}
                          />
                        </div>
                      </AuthField>

                      <AuthField id="email" label={t("email")}>
                        <div className="relative min-w-0">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={t("auth_email_placeholder")}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onInput={e => syncFieldFromInput("email", e.currentTarget.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                            className={cn(AUTH_INPUT, "pl-9 auth-field-input")}
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
                          name="email"
                          type="email"
                          placeholder={t("auth_email_placeholder")}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onInput={e => syncFieldFromInput("email", e.currentTarget.value)}
                          required
                          autoComplete="username"
                          disabled={loading}
                          className={cn(AUTH_INPUT, "pl-10 auth-field-input")}
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
                        ref={passwordRef}
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={isSignIn ? t("auth_password_placeholder_signin") : t("auth_password_placeholder_signup")}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onInput={e => syncFieldFromInput("password", e.currentTarget.value)}
                        required
                        minLength={isSignIn ? 1 : 6}
                        autoComplete={isSignIn ? "current-password" : "new-password"}
                        disabled={loading}
                        className={cn(AUTH_INPUT, "pl-10 pr-11 auth-field-input")}
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
                        className="mt-0.5 h-[1.15rem] w-[1.15rem] rounded-[4px] border-muted-foreground/40 data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor="accept-terms"
                        className="text-[13px] leading-snug text-muted-foreground/80 cursor-pointer select-none"
                      >
                        {t("auth_accept_terms_lead")}{" "}
                        <a
                          href={`/${language}/terms`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("terms")}
                        </a>{" "}
                        {t("auth_accept_terms_and")}{" "}
                        <a
                          href={`/${language}/privacy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("auth_privacy_link")}
                        </a>
                      </label>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(158,72%,34%)] hover:opacity-[0.97] shadow-lg shadow-primary/20 transition-opacity"
                    disabled={submitDisabled}
                    onPointerDown={primeRecaptcha}
                    onTouchStart={primeRecaptcha}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isSignIn ? t("auth_signing_in") : t("auth_creating_account")}</>
                    ) : (
                      isSignIn ? t("sign_in") : t("sign_up")
                    )}
                  </Button>
                </form>
              </motion.div>
            </AnimatePresence>

            <SocialAuthButtons
              language={language}
              mode={mode}
              googleEnabled={googleEnabled}
              facebookEnabled={facebookEnabled}
              linkedinEnabled={linkedinEnabled}
              loading={socialSettingsLoading}
            />

            <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
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
      </AuthPageShell>
    </>
  );
}
