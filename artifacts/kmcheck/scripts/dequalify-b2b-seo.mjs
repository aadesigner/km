/**
 * Rewrite B2B SEO titles/descriptions away from consumer "mileage check / car history" head terms.
 * Run: node artifacts/kmcheck/scripts/dequalify-b2b-seo.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const copyPath = path.join(__dirname, "..", "src", "pages", "api-b2b", "copy.ts");

/** @type {Record<string, Record<string, string>>} */
const SEO = {
  en: {
    seoHomeTitle: "Vehicle History API & White-Label Reseller Platform | kmcheck B2B",
    seoHomeDesc:
      "B2B vehicle-history API and managed white-label reseller sites for developers and partners. Coverage: USA, Canada, Korea, Dubai, China. ~50M vehicles.",
    seoPlansTitle: "B2B API & White-Label Plans | kmcheck Partners",
    seoPlansDesc:
      "Compare kmcheck partner plans: REST API access or a managed white-label reseller website for your business.",
    seoContactTitle: "Contact kmcheck B2B Sales | Partner API & White-Label",
    seoContactDesc:
      "Talk to kmcheck about partner API access or a managed reseller website. Email info@kmcheck.com.",
    seoRegionTitle: "{region} Vehicle Data API for Resellers | kmcheck B2B",
    seoRegionDesc:
      "Reseller API access for {region} vehicle data under your brand — white-label site or developer integration with kmcheck.",
    seoDecoderTitle: "VIN Decode API for Developers & Resellers | kmcheck B2B",
    seoDecoderDesc:
      "Developer VIN decode API (make, model, specs). Included with kmcheck partner API and managed reseller websites.",
    seoKeywords:
      "vehicle history API, white-label reseller, B2B VIN API, kmcheck partners, developer API",
  },
  de: {
    seoHomeTitle: "Fahrzeughistorie-API & White-Label für Reseller | kmcheck B2B",
    seoHomeDesc:
      "B2B-API und verwaltete White-Label-Reseller-Sites für Entwickler und Partner. USA, Kanada, Korea, Dubai, China. ~50 Mio. Fahrzeuge.",
    seoPlansTitle: "B2B-API- & White-Label-Tarife | kmcheck Partner",
    seoPlansDesc:
      "Vergleichen Sie kmcheck-Partnerpläne: REST-API oder verwaltete White-Label-Reseller-Website.",
    seoContactTitle: "kmcheck B2B-Vertrieb kontaktieren | Partner-API",
    seoContactDesc:
      "Sprechen Sie mit kmcheck über Partner-API oder White-Label-Reseller-Website. E-Mail info@kmcheck.com.",
    seoRegionTitle: "{region} Fahrzeugdaten-API für Reseller | kmcheck B2B",
    seoRegionDesc:
      "Reseller-API für {region}-Fahrzeugdaten unter Ihrer Marke — White-Label oder Entwickler-Integration.",
    seoDecoderTitle: "VIN-Decode-API für Entwickler & Reseller | kmcheck B2B",
    seoDecoderDesc:
      "VIN-Decode-API (Marke, Modell, Specs) für Partner — Teil von API und White-Label-Reseller.",
    seoKeywords:
      "Fahrzeughistorie API, White-Label Reseller, B2B VIN API, kmcheck Partner",
  },
  es: {
    seoHomeTitle: "API de historial y plataforma white-label | kmcheck B2B",
    seoHomeDesc:
      "API B2B y sitios white-label para desarrolladores y partners. EE. UU., Canadá, Corea, Dubái, China. ~50M vehículos.",
    seoPlansTitle: "Planes API B2B y white-label | Partners kmcheck",
    seoPlansDesc:
      "Compare planes partner de kmcheck: acceso API REST o sitio white-label gestionado.",
    seoContactTitle: "Contacto comercial B2B kmcheck | API y white-label",
    seoContactDesc:
      "Hable con kmcheck sobre API partner o sitio reseller. Email info@kmcheck.com.",
    seoRegionTitle: "API de datos de vehículos {region} para resellers | kmcheck B2B",
    seoRegionDesc:
      "API reseller para datos de vehículos {region} bajo su marca — white-label o integración para developers.",
    seoDecoderTitle: "API de decodificación VIN para developers | kmcheck B2B",
    seoDecoderDesc:
      "API de decode VIN (marca, modelo, specs) para partners — incluida en API y white-label.",
    seoKeywords:
      "API historial vehículos, white-label reseller, API VIN B2B, partners kmcheck",
  },
  fr: {
    seoHomeTitle: "API historique véhicule & white-label revendeur | kmcheck B2B",
    seoHomeDesc:
      "API B2B et sites white-label gérés pour développeurs et partenaires. USA, Canada, Corée, Dubaï, Chine. ~50M véhicules.",
    seoPlansTitle: "Offres API B2B & white-label | Partenaires kmcheck",
    seoPlansDesc:
      "Comparez les offres partenaires kmcheck : API REST ou site white-label géré.",
    seoContactTitle: "Contact commercial B2B kmcheck | API & white-label",
    seoContactDesc:
      "Parlez à kmcheck d’un accès API partenaire ou d’un site revendeur. Email info@kmcheck.com.",
    seoRegionTitle: "API données véhicules {region} pour revendeurs | kmcheck B2B",
    seoRegionDesc:
      "API revendeur pour données véhicules {region} sous votre marque — white-label ou intégration développeur.",
    seoDecoderTitle: "API décodage VIN pour développeurs | kmcheck B2B",
    seoDecoderDesc:
      "API de décodage VIN (marque, modèle, specs) pour partenaires — incluse dans API et white-label.",
    seoKeywords:
      "API historique véhicule, white-label revendeur, API VIN B2B, partenaires kmcheck",
  },
  sq: {
    seoHomeTitle: "API historiku automjetesh & white-label për rishitës | kmcheck B2B",
    seoHomeDesc:
      "API B2B dhe faqe white-label për zhvillues e partnerë. SHBA, Kanada, Kore, Dubai, Kinë. ~50M automjete.",
    seoPlansTitle: "Planet API B2B & white-label | Partnerët kmcheck",
    seoPlansDesc:
      "Krahasoni planet partner të kmcheck: API REST ose faqe white-label e menaxhuar.",
    seoContactTitle: "Kontakt shitje B2B kmcheck | API & white-label",
    seoContactDesc:
      "Flisni me kmcheck për API partner ose faqe rishitësi. Email info@kmcheck.com.",
    seoRegionTitle: "API të dhënash automjetesh {region} për rishitës | kmcheck B2B",
    seoRegionDesc:
      "API rishitësi për të dhëna automjetesh {region} nën markën tuaj — white-label ose integrim zhvilluesi.",
    seoDecoderTitle: "API dekodimi VIN për zhvillues | kmcheck B2B",
    seoDecoderDesc:
      "API dekodimi VIN (markë, model, specs) për partnerë — e përfshirë në API dhe white-label.",
    seoKeywords:
      "API historik automjetesh, white-label rishitës, API VIN B2B, partnerë kmcheck",
  },
  pl: {
    seoHomeTitle: "API historii pojazdów i white-label dla resellerów | kmcheck B2B",
    seoHomeDesc:
      "API B2B i zarządzane strony white-label dla deweloperów i partnerów. USA, Kanada, Korea, Dubaj, Chiny. ~50M pojazdów.",
    seoPlansTitle: "Plany API B2B i white-label | Partnerzy kmcheck",
    seoPlansDesc:
      "Porównaj plany partnerskie kmcheck: dostęp REST API lub zarządzana strona white-label.",
    seoContactTitle: "Kontakt handlowy B2B kmcheck | API i white-label",
    seoContactDesc:
      "Porozmawiaj z kmcheck o API partnerskim lub stronie resellera. Email info@kmcheck.com.",
    seoRegionTitle: "API danych pojazdów {region} dla resellerów | kmcheck B2B",
    seoRegionDesc:
      "API resellera dla danych pojazdów {region} pod Twoją marką — white-label lub integracja dla deweloperów.",
    seoDecoderTitle: "API dekodowania VIN dla deweloperów | kmcheck B2B",
    seoDecoderDesc:
      "API dekodowania VIN (marka, model, specs) dla partnerów — w API i white-label.",
    seoKeywords:
      "API historii pojazdów, white-label reseller, API VIN B2B, partnerzy kmcheck",
  },
  ka: {
    seoHomeTitle: "ავტომობილის ისტორიის API და white-label რესელერებისთვის | kmcheck B2B",
    seoHomeDesc:
      "B2B API და white-label საიტები დეველოპერებისა და პარტნიორებისთვის. აშშ, კანადა, კორეა, დუბაი, ჩინეთი. ~50M მანქანა.",
    seoPlansTitle: "B2B API და white-label გეგმები | kmcheck პარტნიორები",
    seoPlansDesc:
      "შეადარეთ kmcheck პარტნიორის გეგმები: REST API ან მართული white-label საიტი.",
    seoContactTitle: "კონტაქტი B2B გაყიდვები kmcheck | API და white-label",
    seoContactDesc:
      "ისაუბრეთ kmcheck-თან პარტნიორის API ან რესელერის საიტზე. Email info@kmcheck.com.",
    seoRegionTitle: "{region} მანქანების მონაცემების API რესელერებისთვის | kmcheck B2B",
    seoRegionDesc:
      "რესელერის API {region} მანქანების მონაცემებისთვის თქვენი ბრენდით — white-label ან დეველოპერის ინტეგრაცია.",
    seoDecoderTitle: "VIN decode API დეველოპერებისთვის | kmcheck B2B",
    seoDecoderDesc:
      "VIN decode API (მარკა, მოდელი, specs) პარტნიორებისთვის — API-სა და white-label-ში.",
    seoKeywords:
      "ავტომობილის ისტორიის API, white-label რესელერი, B2B VIN API, kmcheck პარტნიორები",
  },
  ro: {
    seoHomeTitle: "API istoric auto & white-label pentru reselleri | kmcheck B2B",
    seoHomeDesc:
      "API B2B și site-uri white-label pentru dezvoltatori și parteneri. SUA, Canada, Coreea, Dubai, China. ~50M vehicule.",
    seoPlansTitle: "Planuri API B2B & white-label | Parteneri kmcheck",
    seoPlansDesc:
      "Comparați planurile partner kmcheck: acces API REST sau site white-label gestionat.",
    seoContactTitle: "Contact vânzări B2B kmcheck | API & white-label",
    seoContactDesc:
      "Discutați cu kmcheck despre API partener sau site reseller. Email info@kmcheck.com.",
    seoRegionTitle: "API date vehicule {region} pentru reselleri | kmcheck B2B",
    seoRegionDesc:
      "API reseller pentru date vehicule {region} sub brandul dvs. — white-label sau integrare developer.",
    seoDecoderTitle: "API decodare VIN pentru developeri | kmcheck B2B",
    seoDecoderDesc:
      "API decodare VIN (marcă, model, specs) pentru parteneri — inclus în API și white-label.",
    seoKeywords:
      "API istoric auto, white-label reseller, API VIN B2B, parteneri kmcheck",
  },
  bg: {
    seoHomeTitle: "API за автоистория и white-label за реселъри | kmcheck B2B",
    seoHomeDesc:
      "B2B API и white-label сайтове за разработчици и партньори. САЩ, Канада, Корея, Дубай, Китай. ~50M автомобила.",
    seoPlansTitle: "B2B API и white-label планове | Партньори kmcheck",
    seoPlansDesc:
      "Сравнете партньорските планове на kmcheck: REST API или управляван white-label сайт.",
    seoContactTitle: "Контакт B2B продажби kmcheck | API и white-label",
    seoContactDesc:
      "Говорете с kmcheck за партньорски API или reseller сайт. Email info@kmcheck.com.",
    seoRegionTitle: "API за данни за {region} автомобили за реселъри | kmcheck B2B",
    seoRegionDesc:
      "Reseller API за данни за {region} автомобили под вашата марка — white-label или developer интеграция.",
    seoDecoderTitle: "VIN decode API за разработчици | kmcheck B2B",
    seoDecoderDesc:
      "VIN decode API (марка, модел, specs) за партньори — в API и white-label.",
    seoKeywords:
      "API автоистория, white-label реселър, B2B VIN API, партньори kmcheck",
  },
  ar: {
    seoHomeTitle: "واجهة برمجة تاريخ المركبات ومنصة White-Label | kmcheck B2B",
    seoHomeDesc:
      "واجهة B2B ومواقع white-label للمطوّرين والشركاء. الولايات المتحدة وكندا وكوريا ودبي والصين. نحو 50 مليون مركبة.",
    seoPlansTitle: "خطط واجهة B2B وWhite-Label | شركاء kmcheck",
    seoPlansDesc:
      "قارن خطط شركاء kmcheck: وصول REST API أو موقع white-label مُدار.",
    seoContactTitle: "تواصل مبيعات B2B مع kmcheck | واجهة وWhite-Label",
    seoContactDesc:
      "تحدث مع kmcheck عن واجهة شريك أو موقع إعادة بيع. البريد info@kmcheck.com.",
    seoRegionTitle: "واجهة بيانات مركبات {region} للبائعين | kmcheck B2B",
    seoRegionDesc:
      "واجهة إعادة بيع لبيانات مركبات {region} تحت علامتك — white-label أو تكامل للمطوّرين.",
    seoDecoderTitle: "واجهة فك VIN للمطوّرين | kmcheck B2B",
    seoDecoderDesc:
      "واجهة فك VIN (الماركة والموديل والمواصفات) للشركاء — ضمن الواجهة وwhite-label.",
    seoKeywords:
      "واجهة تاريخ المركبات, white-label, واجهة VIN B2B, شركاء kmcheck",
  },
  uk: {
    seoHomeTitle: "API історії авто та white-label для реселерів | kmcheck B2B",
    seoHomeDesc:
      "B2B API та white-label сайти для розробників і партнерів. США, Канада, Корея, Дубай, Китай. ~50M авто.",
    seoPlansTitle: "Тарифи B2B API та white-label | Партнери kmcheck",
    seoPlansDesc:
      "Порівняйте партнерські плани kmcheck: REST API або керований white-label сайт.",
    seoContactTitle: "Контакт B2B продажів kmcheck | API та white-label",
    seoContactDesc:
      "Обговоріть з kmcheck партнерський API або сайт реселера. Email info@kmcheck.com.",
    seoRegionTitle: "API даних авто {region} для реселерів | kmcheck B2B",
    seoRegionDesc:
      "Reseller API для даних авто {region} під вашим брендом — white-label або інтеграція для розробників.",
    seoDecoderTitle: "API декодування VIN для розробників | kmcheck B2B",
    seoDecoderDesc:
      "API декодування VIN (марка, модель, specs) для партнерів — в API та white-label.",
    seoKeywords:
      "API історії авто, white-label реселер, B2B VIN API, партнери kmcheck",
  },
  ru: {
    seoHomeTitle: "API истории авто и white-label для реселлеров | kmcheck B2B",
    seoHomeDesc:
      "B2B API и white-label сайты для разработчиков и партнёров. США, Канада, Корея, Дубай, Китай. ~50M авто.",
    seoPlansTitle: "Тарифы B2B API и white-label | Партнёры kmcheck",
    seoPlansDesc:
      "Сравните партнёрские планы kmcheck: REST API или управляемый white-label сайт.",
    seoContactTitle: "Контакт B2B продаж kmcheck | API и white-label",
    seoContactDesc:
      "Обсудите с kmcheck партнёрский API или сайт реселлера. Email info@kmcheck.com.",
    seoRegionTitle: "API данных авто {region} для реселлеров | kmcheck B2B",
    seoRegionDesc:
      "Reseller API для данных авто {region} под вашим брендом — white-label или интеграция для разработчиков.",
    seoDecoderTitle: "API декодирования VIN для разработчиков | kmcheck B2B",
    seoDecoderDesc:
      "API декодирования VIN (марка, модель, specs) для партнёров — в API и white-label.",
    seoKeywords:
      "API истории авто, white-label реселлер, B2B VIN API, партнёры kmcheck",
  },
  zh: {
    seoHomeTitle: "车辆历史 API 与白标分销平台 | kmcheck B2B",
    seoHomeDesc:
      "面向开发者与合作伙伴的 B2B API 与托管白标站点。覆盖美国、加拿大、韩国、迪拜、中国。约 5000 万辆车。",
    seoPlansTitle: "B2B API 与白标方案 | kmcheck 合作伙伴",
    seoPlansDesc:
      "比较 kmcheck 合作伙伴方案：REST API 或托管白标分销网站。",
    seoContactTitle: "联系 kmcheck B2B 销售 | API 与白标",
    seoContactDesc:
      "咨询合作伙伴 API 或分销网站。邮箱 info@kmcheck.com。",
    seoRegionTitle: "{region} 车辆数据 API（分销商）| kmcheck B2B",
    seoRegionDesc:
      "以您的品牌提供 {region} 车辆数据的分销 API — 白标站点或开发者集成。",
    seoDecoderTitle: "面向开发者的 VIN 解码 API | kmcheck B2B",
    seoDecoderDesc:
      "合作伙伴 VIN 解码 API（品牌、车型、规格）— 包含在 API 与白标方案中。",
    seoKeywords:
      "车辆历史 API, 白标分销, B2B VIN API, kmcheck 合作伙伴",
  },
};

let src = fs.readFileSync(copyPath, "utf8");

/**
 * Replace a quoted string field assignment (single-line or next-line string).
 * @param {string} key
 * @param {string} value
 * @param {number} fromIndex search from (to stay inside one locale block)
 * @param {number} toIndex
 */
function replaceField(key, value, fromIndex, toIndex) {
  const slice = src.slice(fromIndex, toIndex);
  const escaped = JSON.stringify(value);
  // single-line: key: "..."
  const single = new RegExp(`(${key}:\\s*)"[^"]*"`);
  if (single.test(slice)) {
    const next = slice.replace(single, `$1${escaped}`);
    src = src.slice(0, fromIndex) + next + src.slice(toIndex);
    return true;
  }
  // multi-line: key:\n    "..."
  const multi = new RegExp(`(${key}:\\s*\\n\\s*)"[^"]*"`);
  if (multi.test(slice)) {
    const next = slice.replace(multi, `$1${escaped}`);
    src = src.slice(0, fromIndex) + next + src.slice(toIndex);
    return true;
  }
  console.warn(`MISS ${key} in range ${fromIndex}-${toIndex}`);
  return false;
}

const titles = [...src.matchAll(/seoHomeTitle:\s*"/g)];
const langs = Object.keys(SEO);
if (titles.length !== langs.length) {
  console.warn(`Expected ${langs.length} seoHomeTitle blocks, found ${titles.length}`);
}

for (let i = 0; i < titles.length && i < langs.length; i++) {
  const lang = langs[i];
  const from = titles[i].index;
  const to = i + 1 < titles.length ? titles[i + 1].index : src.indexOf("export const B2B_COPY");
  const fields = SEO[lang];
  // Re-find indices each time because src mutates — use fresh search by occurrence order
}

// Re-run with stable approach: for each lang occurrence in order, replace fields from that seoHomeTitle to next
{
  let searchFrom = 0;
  for (const lang of langs) {
    const fields = SEO[lang];
    const start = src.indexOf('seoHomeTitle: "', searchFrom);
    if (start < 0) {
      console.error("no seoHomeTitle for", lang);
      break;
    }
    const next = src.indexOf('seoHomeTitle: "', start + 1);
    const endMarker = src.indexOf("export const B2B_COPY", start);
    const end = next > 0 ? next : endMarker;
    for (const [key, value] of Object.entries(fields)) {
      replaceField(key, value, start, end);
    }
    const newStart = src.indexOf('seoHomeTitle: "', searchFrom);
    const newNext = src.indexOf('seoHomeTitle: "', newStart + 1);
    searchFrom = newNext > 0 ? newNext : src.length;
    console.log("patched", lang);
  }
}

fs.writeFileSync(copyPath, src);
console.log("Wrote", copyPath);
