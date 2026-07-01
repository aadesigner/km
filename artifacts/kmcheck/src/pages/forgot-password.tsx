import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/i18n/context";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { SEOHead, usePageSeo } from "@/components/seo";
import { translateClientError } from "@/lib/translate-client-error";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPasswordPage() {
  const { language, t } = useTranslation();
  const { getToken, enabled: rcEnabled, ready: rcReady } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const seo = usePageSeo("forgot_password");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rcEnabled && !rcReady) {
      setError(t("error_recaptcha_loading"));
      return;
    }

    setLoading(true);
    try {
      const recaptchaToken = await getToken("forgot_password") ?? undefined;
      if (rcEnabled && !recaptchaToken) {
        setError(t("error_recaptcha_failed"));
        return;
      }

      const res = await fetch(`${basePath}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, recaptchaToken, lang: language }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; code?: string };
      if (!res.ok) {
        setError(translateClientError(t, data.code, data.error));
      } else {
        setSent(true);
      }
    } catch {
      setError(t("error_network"));
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled = loading || (rcEnabled && !rcReady);

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
        noIndex
      />
      <AuthPageShell>
        {sent ? (
          <div className="space-y-4 text-center">
            <MailCheck className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("forgot_sent_title")}</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {t("forgot_sent_desc").replace("{email}", email)}
              </p>
            </div>
            <Link href={`/${language}/sign-in`} className="inline-block text-primary font-semibold hover:underline text-sm">
              {t("back_to_sign_in")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("forgot_title")}</h1>
              <p className="text-sm text-muted-foreground">{t("forgot_subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("forgot_sending")}</>
                ) : (
                  t("forgot_send_button")
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
