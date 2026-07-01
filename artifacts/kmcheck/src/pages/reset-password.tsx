import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { SEOHead } from "@/components/seo";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

import { getPasswordStrength, isPasswordStrongEnough, getPasswordIssueCode, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

function passwordErrorMessage(t: (k: string) => string, password: string): string {
  const code = getPasswordIssueCode(password);
  if (code === "PASSWORD_TOO_SHORT") return t("reset_password_too_short");
  if (code === "PASSWORD_NEEDS_LETTER") return t("error_password_needs_letter");
  if (code === "PASSWORD_NEEDS_NUMBER") return t("error_password_needs_number");
  return t("error_password_weak");
}

export default function ResetPasswordPage() {
  const { language, t } = useTranslation();
  const [, setLocation] = useLocation();

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`${basePath}/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then(r => r.json())
      .then((data: { valid?: boolean; expired?: boolean }) => {
        setTokenValid(data.valid ?? false);
        setTokenExpired(data.expired ?? false);
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("reset_passwords_mismatch"));
      return;
    }
    if (!isPasswordStrongEnough(password)) {
      setError(passwordErrorMessage(t, password));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("error_generic"));
      } else {
        setDone(true);
        setTimeout(() => setLocation(`/${language}/sign-in`), 3000);
      }
    } catch {
      setError(t("error_network"));
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["", t("pw_strength_weak"), t("pw_strength_fair"), t("pw_strength_good"), t("pw_strength_strong")];
  const strengthColors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const strengthTextColors = ["", "text-red-600", "text-orange-500", "text-yellow-600", "text-green-600"];

  return (
    <>
      <SEOHead
        title={`${t("reset_title")} — kmcheck.com`}
        description={t("reset_subtitle")}
        lang={language as "en" | "ar" | "uk" | "ru" | "sq"}
        noIndex
      />
      <AuthPageShell>
        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("reset_done_title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("reset_done_desc")}</p>
            </div>
          </div>
        ) : tokenValid === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tokenValid === false ? (
          <>
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {tokenExpired ? t("reset_expired") : t("reset_invalid")}{" "}
                <Link href={`/${language}/forgot-password`} className="underline font-semibold">
                  {t("reset_request_new")}
                </Link>
                .
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <Link href={`/${language}/sign-in`} className="text-primary font-semibold hover:underline">
                {t("back_to_sign_in")}
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-5 space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("reset_title")}</h1>
              <p className="text-sm text-muted-foreground">{t("reset_subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">{t("reset_new_password_label")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("reset_new_password_placeholder")}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    disabled={loading}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthTextColors[strength]}`}>{strengthLabels[strength]}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm font-medium">{t("reset_confirm_label")}</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder={t("reset_confirm_placeholder")}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirm(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-semibold rounded-xl shadow-md shadow-primary/20"
                disabled={loading || !isPasswordStrongEnough(password) || password !== confirm}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("reset_submitting")}</>
                ) : (
                  t("reset_submit")
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              <Link href={`/${language}/sign-in`} className="text-primary font-semibold hover:underline">
                {t("back_to_sign_in")}
              </Link>
            </p>
          </>
        )}
      </AuthPageShell>
    </>
  );
}
