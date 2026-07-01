import { Link } from "wouter";
import { useTranslation } from "@/i18n/context";
import { useLegalTranslation } from "@/i18n/useLegalTranslation";
import { SEOHead, usePageSeo } from "@/components/seo";
import { Skeleton } from "@/components/ui/skeleton";

const COOKIE_TYPES = [
  { typeKey: "legal_cookie_essential_type", descKey: "legal_cookie_essential_desc", required: true },
  { typeKey: "legal_cookie_functional_type", descKey: "legal_cookie_functional_desc", required: false },
  { typeKey: "legal_cookie_analytics_type", descKey: "legal_cookie_analytics_desc", required: false },
] as const;

export default function Privacy() {
  const { language, dir } = useTranslation();
  const { t, ready } = useLegalTranslation();
  const seo = usePageSeo("privacy");

  if (!ready) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const useItems = [
    t("legal_privacy_s2_li1"),
    t("legal_privacy_s2_li2"),
    t("legal_privacy_s2_li3"),
    t("legal_privacy_s2_li4"),
    t("legal_privacy_s2_li5"),
    t("legal_privacy_s2_li6"),
  ];

  const rightsItems = [
    t("legal_privacy_s7_access"),
    t("legal_privacy_s7_rectification"),
    t("legal_privacy_s7_erasure"),
    t("legal_privacy_s7_portability"),
    t("legal_privacy_s7_objection"),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16" dir={dir}>
      <SEOHead
        title={seo.title}
        description={seo.description}
        lang={seo.lang}
        canonicalPath={seo.canonicalPath}
      />
      <div className="mb-10">
        <p className="text-sm text-muted-foreground mb-2">{t("legal_updated")}</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t("legal_privacy_title")}</h1>
        <p className="text-muted-foreground text-lg">{t("legal_privacy_intro")}</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s1_title")}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("legal_privacy_s1_account_title")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s1_account_body")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("legal_privacy_s1_usage_title")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s1_usage_body")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("legal_privacy_s1_technical_title")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s1_technical_body")}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s2_title")}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {useItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("legal_privacy_s2_footer")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s3_title")}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t("legal_privacy_s3_intro")}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t("legal_privacy_s3_auth")}</li>
            <li>{t("legal_privacy_s3_paypal")}</li>
            <li>{t("legal_privacy_s3_providers")}</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("legal_privacy_s3_footer")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s4_title")}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t("legal_privacy_s4_body1")}</p>
          <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s4_body2")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s5_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s5_body")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s6_title")}</h2>
          <div id="cookies" className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {t("legal_privacy_cookies_intro_before")}{" "}
              <Link href={`/${language}/terms`} className="text-primary hover:underline">
                {t("legal_link_terms")}
              </Link>
              {t("legal_privacy_cookies_intro_after")}
            </p>
            <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_cookies_types")}</p>
            <div className="space-y-3">
              {COOKIE_TYPES.map(({ typeKey, descKey, required }) => (
                <div key={typeKey} className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30">
                  <div className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 mt-0.5 ${required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {required ? t("legal_cookie_required") : t("legal_cookie_optional")}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t(typeKey)}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t(descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s7_title")}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t("legal_privacy_s7_intro")}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {rightsItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t("legal_privacy_s7_footer_before")}{" "}
            <Link href={`/${language}/terms`} className="text-primary hover:underline">
              {t("legal_link_terms")}
            </Link>
            {t("legal_privacy_s7_footer_after")}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s8_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s8_body")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s9_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s9_body")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s10_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s10_body")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">{t("legal_privacy_s11_title")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("legal_privacy_s11_body")}</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t flex gap-4 flex-wrap">
        <Link href={`/${language}/terms`} className="text-sm text-primary hover:underline">
          {t("legal_link_terms")} →
        </Link>
        <Link href={`/${language}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("legal_link_home")}
        </Link>
      </div>
    </div>
  );
}
