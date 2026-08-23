/**
 * VIN page SSR body injection — mirrors @workspace/vin-page-seo for Node scripts.
 */
import { vinSeoFromRest } from "./seo-inject.mjs";

const NAV = {
  en: { home: "Check VIN", pricing: "Pricing", howItWorks: "How it works", freeDecoder: "Free VIN Decoder", faq: "FAQ" },
  de: { home: "VIN prüfen", pricing: "Preise", howItWorks: "So funktioniert's", freeDecoder: "Kostenloser VIN-Decoder", faq: "Häufig gestellte Fragen" },
  es: { home: "Consultar VIN", pricing: "Precios", howItWorks: "Cómo funciona", freeDecoder: "Decodificador VIN gratis", faq: "Preguntas frecuentes" },
  fr: { home: "Vérifier le VIN", pricing: "Tarifs", howItWorks: "Comment ça marche", freeDecoder: "Décodeur VIN gratuit", faq: "FAQ" },
  sq: { home: "Kontrollo VIN", pricing: "Çmimet", howItWorks: "Si funksionon", freeDecoder: "Dekoder VIN falas", faq: "Pyetje të shpeshta" },
  pl: { home: "Sprawdź VIN", pricing: "Cennik", howItWorks: "Jak to działa", freeDecoder: "Darmowy dekoder VIN", faq: "FAQ" },
  ro: { home: "Verifică VIN", pricing: "Prețuri", howItWorks: "Cum funcționează", freeDecoder: "Decoder VIN gratuit", faq: "Întrebări frecvente" },
  bg: { home: "Провери VIN", pricing: "Цени", howItWorks: "Как работи", freeDecoder: "Безплатен VIN декодер", faq: "ЧЗВ" },
  ka: { home: "VIN შემოწმება", pricing: "ფასები", howItWorks: "როგორ მუშაობს", freeDecoder: "უფასო VIN დეკoderi", faq: "FAQ" },
  ar: { home: "تحقق من VIN", pricing: "الأسعار", howItWorks: "كيف يعمل", freeDecoder: "فك تشفير VIN مجاني", faq: "الأسئلة الشائعة" },
  uk: { home: "Перевірити VIN", pricing: "Ціни", howItWorks: "Як це працює", freeDecoder: "Безкоштовний VIN-декодер", faq: "FAQ" },
  ru: { home: "Проверить VIN", pricing: "Цены", howItWorks: "Как это работает", freeDecoder: "Бесплатный VIN-декодер", faq: "FAQ" },
  zh: { home: "查询 VIN", pricing: "价格", howItWorks: "如何运作", freeDecoder: "免费 VIN 解码", faq: "常见问题" },
};

const VIN_LABEL = {
  en: "VIN", de: "FIN", es: "VIN", fr: "VIN", sq: "VIN", pl: "VIN", ro: "VIN", bg: "VIN", ka: "VIN", ar: "VIN", uk: "VIN", ru: "VIN", zh: "VIN",
};

const CTA = {
  en: "Unlock the full vehicle history report on kmcheck.com.",
  de: "Vollständigen Fahrzeughistorienbericht auf kmcheck.com freischalten.",
  es: "Desbloquee el informe completo del historial del vehículo en kmcheck.com.",
  fr: "Débloquez le rapport historique complet sur kmcheck.com.",
  sq: "Zhbllokoni raportin e plotë të historikut të automjetit në kmcheck.com.",
  pl: "Odblokuj pełny raport historii pojazdu na kmcheck.com.",
  ro: "Deblocați raportul complet al istoricului vehiculului pe kmcheck.com.",
  bg: "Отключете пълния отчет за историята на автомобила на kmcheck.com.",
  ka: "\u10D2\u10D0\u10E0\u10EB\u10D8\u10D7 \u10E1\u10E0\u10E3\u10DA\u10D8 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 kmcheck.com-\u10D6\u10D4.",
  ar: "افتح تقرير تاريخ المركبة الكامل على kmcheck.com.",
  uk: "Відкрийте повний звіт історії авто на kmcheck.com.",
  ru: "Откройте полный отчёт по истории авто на kmcheck.com.",
  zh: "在 kmcheck.com 解锁完整车辆历史报告。",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildNavLinks(lang) {
  const nav = NAV[lang] ?? NAV.en;
  const base = `/${lang}`;
  return [
    { href: base, label: nav.home },
    { href: `${base}/pricing`, label: nav.pricing },
    { href: `${base}/how-it-works`, label: nav.howItWorks },
    { href: `${base}/free-vin-decoder`, label: nav.freeDecoder },
    { href: `${base}/faq`, label: nav.faq },
  ];
}

export function resolveVinSsrContent(rest, lang) {
  const seo = vinSeoFromRest(rest, lang);
  if (!seo?.title || !seo.description) return null;
  const m = rest.match(/^\/vin\/([A-HJ-NPR-Z0-9]{17})$/i);
  if (!m) return null;
  const vin = m[1].toUpperCase();
  return {
    heading: seo.title.replace(/\s*\|\s*kmcheck\s*$/i, ""),
    vin,
    vinLabel: VIN_LABEL[lang] ?? VIN_LABEL.en,
    intro: seo.description,
    specs: [],
    cta: CTA[lang] ?? CTA.en,
    links: buildNavLinks(lang),
  };
}

function buildVinSsrStyleBlock() {
  return `<style id="kmcheck-vin-ssr-style">
      #root{position:relative;z-index:1;min-height:100vh}
      #root .app-boot-shell{position:relative;z-index:1;min-height:100vh}
      .kmcheck-vin-ssr{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
    </style>`;
}

function buildVinSsrBodyBlock(content) {
  const navLinks = (content.links ?? [])
    .filter((link) => link.href?.trim() && link.label?.trim())
    .map(
      (link) =>
        `          <li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`,
    )
    .join("\n");

  const navBlock = navLinks
    ? `        <nav aria-label="Site navigation">
          <ul>
${navLinks}
          </ul>
        </nav>`
    : "";

  return `<main id="kmcheck-vin-ssr" class="kmcheck-vin-ssr">
      <article>
        <h1>${escapeHtml(content.heading)}</h1>
        <p><strong>${escapeHtml(content.vinLabel)}:</strong> ${escapeHtml(content.vin)}</p>
        <p class="lead">${escapeHtml(content.intro)}</p>
${navBlock}
        <p>${escapeHtml(content.cta)}</p>
      </article>
    </main>`;
}

export function removeVinSsrFromHtml(html) {
  return html
    .replace(/\n?\s*<style id="kmcheck-vin-ssr-style"[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/\n?\s*<main id="kmcheck-vin-ssr"[\s\S]*?<\/main>/g, "");
}

export function injectVinSsrIntoHtml(html, content) {
  if (!content?.heading?.trim() || !content.intro?.trim()) return html;

  let out = removeVinSsrFromHtml(html);
  const bodyBlock = buildVinSsrBodyBlock(content);

  out = out.replace(
    /(<div id="root">[\s\S]*?<\/div>)(\s*<script type="module")/i,
    `$1\n    ${bodyBlock}$2`,
  );

  if (!out.includes('id="kmcheck-vin-ssr-style"')) {
    out = out.replace(/<\/head>/i, `${buildVinSsrStyleBlock()}\n  </head>`);
  }

  return out;
}
