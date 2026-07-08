/**
 * Authentic DE / FR / BG SEO entries for seo-data.json — mirrors add-pl-seo-data.mjs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seoPath = path.join(__dirname, "../src/lib/seo-data.json");
const seoData = JSON.parse(fs.readFileSync(seoPath, "utf8"));

const DE = {
    home: {
      title: "Kilometerstand prüfen — Unfälle & Totalschaden | kmcheck.com",
      description:
        "Sofortiger VIN-Check: echten Kilometerstand prüfen, Unfallhistorie und Totalschaden-Einträge für jedes Auto aufdecken.",
    },
    pricing: {
      title: "Preise — Fahrzeughistorie & VIN-Bericht | kmcheck.com",
      description:
        "Ein günstiger VIN-Bericht: Kilometerstand, Unfälle, Totalschaden und Diebstahl. Sofortige Lieferung. Kein Abo.",
    },
  auth: {
    title: "Anmelden — kmcheck.com",
    description:
      "Melden Sie sich an oder erstellen Sie ein kostenloses Konto für sofortige VIN-Checks und Zugriff auf Fahrzeughistorien.",
  },
  dashboard: {
    title: "Meine Berichte — VIN-Historie | kmcheck.com",
    description: "Ihre Fahrzeughistorienberichte ansehen und neue VIN-Checks durchführen.",
  },
  vin_result: {
    title: "VIN-Historienbericht — kmcheck.com",
    description:
      "Vollständiger Fahrzeughistorienbericht: Kilometerstand, Unfälle, Halter, Versicherung und Auktionen. Sofortiger Zugriff nach Kauf.",
  },
  country_usa: {
    title: "USA-Importe — VIN-Check, Kilometerstand & Unfallhistorie | kmcheck.com",
    description:
      "US-Importe per VIN prüfen: Kilometerstand, Unfälle, Totalschaden, Diebstahl und Auktionen. Sofortbericht auf kmcheck.com.",
  },
  country_korea: {
    title: "Korea-Importe — VIN-Check & Fahrzeughistorie | kmcheck.com",
    description:
      "Koreanisches Importfahrzeug per VIN prüfen: Kilometerstand, Unfälle, Export und Auktionen. Vollständiger Historienbericht auf kmcheck.com.",
  },
  country_canada: {
    title: "Kanada-Importe — VIN-Check & Fahrzeughistorie | kmcheck.com",
    description:
      "Kanadische Fahrzeuge per VIN prüfen: Kilometerstand, Unfälle, Totalschaden und Diebstahl. Sofortbericht auf kmcheck.com.",
  },
  free_decoder: {
    title: "Kostenloser VIN-Decoder — VIN-Nummer dekodieren | kmcheck.com",
    description:
      "Kostenloser VIN-Decoder: Baujahr, Marke, Modell und Ausstattung. VIN prüfen und vollständigen Historienbericht auf kmcheck.com bestellen.",
  },
  how_it_works: {
    title: "So funktioniert's — VIN-Check Schritt für Schritt | kmcheck.com",
    description:
      "VIN eingeben, sicher bezahlen und in Sekunden den vollständigen Historienbericht erhalten. Kilometerstand, Unfälle, Totalschaden und mehr.",
  },
  faq: {
    title: "FAQ — VIN-Check & Historienberichte | kmcheck.com",
    description:
      "Antworten zu VIN-Checks, Kilometerstand, Unfällen, Totalschaden, Zahlung und Fahrzeughistorienberichten auf kmcheck.com.",
  },
  terms: {
    title: "Nutzungsbedingungen — kmcheck.com",
    description: "Nutzungsbedingungen für kmcheck.com und VIN-Historienberichte.",
  },
  privacy: {
    title: "Datenschutz — kmcheck.com",
    description: "Wie kmcheck.com Ihre personenbezogenen Daten erhebt, nutzt und schützt.",
  },
  not_found: {
    title: "Seite nicht gefunden — kmcheck.com",
    description: "Die angeforderte Seite existiert nicht. Zurück zu kmcheck.com für Ihren VIN-Check.",
  },
  sign_up: {
    title: "Registrieren — kmcheck.com",
    description:
      "Kostenloses kmcheck-Konto erstellen, um VIN-Berichte zu speichern und schneller Fahrzeughistorien zu prüfen.",
  },
  checkout: {
    title: "Kasse — VIN-Bericht | kmcheck.com",
    description: "Sichere Zahlung für Ihren VIN-Historienbericht. Sofortiger Zugriff nach Bestätigung.",
  },
  purchases: {
    title: "Käufe — kmcheck.com",
    description: "Übersicht Ihrer VIN-Berichtkäufe und Zugriff auf frühere Berichte.",
  },
  forgot_password: {
    title: "Passwort vergessen — kmcheck.com",
    description: "Passwort für Ihr kmcheck-Konto zurücksetzen und wieder Zugriff auf VIN-Berichte erhalten.",
  },
  reset_password: {
    title: "Passwort zurücksetzen — kmcheck.com",
    description: "Neues Passwort für Ihr kmcheck-Konto festlegen.",
  },
};

const FR = {
  home: {
    title: "Vérifier le kilométrage — accidents & épave | kmcheck.com",
    description:
      "Contrôle VIN instantané : vérifiez le kilométrage réel, l'historique des accidents et le statut épave de tout véhicule.",
  },
  pricing: {
    title: "Tarifs — rapports historique VIN | kmcheck.com",
    description:
      "Un rapport VIN abordable : kilométrage, accidents, statut épave et vol. Livraison instantanée. Sans abonnement.",
  },
  auth: {
    title: "Connexion — kmcheck.com",
    description:
      "Connectez-vous ou créez un compte gratuit pour des contrôles VIN instantanés et l'accès aux rapports d'historique.",
  },
  dashboard: {
    title: "Mes rapports — historique VIN | kmcheck.com",
    description: "Consultez vos rapports d'historique véhicule et lancez de nouveaux contrôles VIN.",
  },
  vin_result: {
    title: "Rapport historique VIN — kmcheck.com",
    description:
      "Rapport complet : kilométrage, accidents, propriétaires, assurance et enchères. Accès instantané après achat.",
  },
  country_usa: {
    title: "Voitures des USA — contrôle VIN, kilométrage et accidents | kmcheck.com",
    description:
      "Vérifiez l'historique d'un import USA par VIN : kilométrage, accidents, épave, vol et enchères. Rapport instantané sur kmcheck.com.",
  },
  country_korea: {
    title: "Voitures de Corée — contrôle VIN et historique | kmcheck.com",
    description:
      "Vérifiez un import coréen par VIN : kilométrage, accidents, export et enchères. Rapport complet sur kmcheck.com.",
  },
  country_canada: {
    title: "Voitures du Canada — contrôle VIN et historique | kmcheck.com",
    description:
      "Vérifiez un véhicule canadien par VIN : kilométrage, accidents, épave et vol. Rapport instantané sur kmcheck.com.",
  },
  free_decoder: {
    title: "Décodeur VIN gratuit — décoder un numéro VIN | kmcheck.com",
    description:
      "Décodeur VIN gratuit : année, marque, modèle et équipement. Vérifiez le VIN et commandez le rapport complet sur kmcheck.com.",
  },
  how_it_works: {
    title: "Comment ça marche — contrôle VIN étape par étape | kmcheck.com",
    description:
      "Saisissez le VIN, payez en toute sécurité et recevez le rapport complet en quelques secondes. Kilométrage, accidents, épave et plus.",
  },
  faq: {
    title: "FAQ — contrôle VIN et rapports historique | kmcheck.com",
    description:
      "Réponses sur les contrôles VIN, le kilométrage, les accidents, le statut épave, les paiements et les rapports sur kmcheck.com.",
  },
  terms: {
    title: "Conditions d'utilisation — kmcheck.com",
    description: "Conditions d'utilisation de kmcheck.com et des rapports historique VIN.",
  },
  privacy: {
    title: "Confidentialité — kmcheck.com",
    description: "Comment kmcheck.com collecte, utilise et protège vos données personnelles.",
  },
  not_found: {
    title: "Page introuvable — kmcheck.com",
    description: "La page demandée n'existe pas. Retournez sur kmcheck.com pour votre contrôle VIN.",
  },
  sign_up: {
    title: "Inscription — kmcheck.com",
    description:
      "Créez un compte kmcheck gratuit pour enregistrer vos rapports VIN et vérifier l'historique plus rapidement.",
  },
  checkout: {
    title: "Paiement — rapport VIN | kmcheck.com",
    description: "Paiement sécurisé pour votre rapport historique VIN. Accès instantané après confirmation.",
  },
  purchases: {
    title: "Achats — kmcheck.com",
    description: "Historique de vos achats de rapports VIN et accès aux rapports précédents.",
  },
  forgot_password: {
    title: "Mot de passe oublié — kmcheck.com",
    description: "Réinitialisez le mot de passe de votre compte kmcheck pour retrouver l'accès aux rapports VIN.",
  },
  reset_password: {
    title: "Réinitialiser le mot de passe — kmcheck.com",
    description: "Définissez un nouveau mot de passe pour votre compte kmcheck.",
  },
};

const BG = {
  home: {
    title: "Проверка VIN на автомобил — пробег, катастрофи и тотална щета | kmcheck.com",
    description:
      "Мигновена проверка на VIN — потвърдете реалния пробег, разкрийте пълната история на катастрофи и записи за тотална щета за всеки автомобил.",
  },
  pricing: {
    title: "Цени — отчети за история на VIN | kmcheck.com",
    description:
      "Един достъпен VIN отчет: пробег, катастрофи, тотална щета и кражба. Мигновена доставка. Без абонамент.",
  },
  auth: {
    title: "Вход — kmcheck.com",
    description:
      "Влезте или създайте безплатен акаунт за мигновени VIN проверки и достъп до отчети за история.",
  },
  dashboard: {
    title: "Моите отчети — история VIN | kmcheck.com",
    description: "Прегледайте отчетите за история на автомобили и направете нови VIN проверки.",
  },
  vin_result: {
    title: "Отчет за история на VIN — kmcheck.com",
    description:
      "Пълен отчет: пробег, катастрофи, собственици, застраховка и търгове. Мигновен достъп след покупка.",
  },
  country_usa: {
    title: "Автомобили от САЩ — VIN проверка, пробег и катастрофи | kmcheck.com",
    description:
      "Проверете история на внос от САЩ по VIN: пробег, катастрофи, тотална щета, кражба и търгове. Мигновен отчет на kmcheck.com.",
  },
  country_korea: {
    title: "Автомобили от Корея — VIN проверка и история | kmcheck.com",
    description:
      "Проверете корейски внос по VIN: пробег, катастрофи, експорт и търгове. Пълен отчет на kmcheck.com.",
  },
  country_canada: {
    title: "Автомобили от Канада — VIN проверка и история | kmcheck.com",
    description:
      "Проверете канадски автомобил по VIN: пробег, катастрофи, тотална щета и кражба. Мигновен отчет на kmcheck.com.",
  },
  free_decoder: {
    title: "Безплатен VIN декодер — декодиране на VIN номер | kmcheck.com",
    description:
      "Безплатен VIN декодер: година, марка, модел и комплектация. Проверете VIN и поръчайте пълен отчет на kmcheck.com.",
  },
  how_it_works: {
    title: "Как работи — VIN проверка стъпка по стъпка | kmcheck.com",
    description:
      "Въведете VIN, платете сигурно и получете пълния отчет за секунди. Пробег, катастрофи, тотална щета и още.",
  },
  faq: {
    title: "ЧЗВ — VIN проверка и отчети за история | kmcheck.com",
    description:
      "Отговори за VIN проверки, пробег, катастрофи, тотална щета, плащания и отчети за история на kmcheck.com.",
  },
  terms: {
    title: "Общи условия — kmcheck.com",
    description: "Общи условия за kmcheck.com и услугите за VIN отчети.",
  },
  privacy: {
    title: "Поверителност — kmcheck.com",
    description: "Как kmcheck.com събира, използва и защитава вашите лични данни.",
  },
  not_found: {
    title: "Страницата не е намерена — kmcheck.com",
    description: "Заявената страница не съществува. Върнете се на kmcheck.com за VIN проверка.",
  },
  sign_up: {
    title: "Регистрация — kmcheck.com",
    description:
      "Създайте безплатен kmcheck акаунт, за да запазвате VIN отчети и по-бързо да проверявате история.",
  },
  checkout: {
    title: "Плащане — VIN отчет | kmcheck.com",
    description: "Сигурно плащане за VIN отчет. Мигновен достъп след потвърждение.",
  },
  purchases: {
    title: "Покупки — kmcheck.com",
    description: "История на покупките на VIN отчети и достъп до предишни отчети.",
  },
  forgot_password: {
    title: "Забравена парола — kmcheck.com",
    description: "Нулирайте паролата на kmcheck акаунта си, за да възстановите достъп до VIN отчети.",
  },
  reset_password: {
    title: "Нова парола — kmcheck.com",
    description: "Задайте нова парола за kmcheck акаунта си.",
  },
};

for (const [pageKey, entry] of Object.entries(DE)) {
  if (!seoData[pageKey]) {
    console.error("Unknown page key:", pageKey);
    process.exit(1);
  }
  seoData[pageKey].de = entry;
}

for (const [pageKey, entry] of Object.entries(FR)) {
  seoData[pageKey].fr = entry;
}

for (const [pageKey, entry] of Object.entries(BG)) {
  seoData[pageKey].bg = entry;
}

fs.writeFileSync(seoPath, JSON.stringify(seoData, null, 2) + "\n", "utf8");
console.log("Updated de/fr/bg SEO for", Object.keys(DE).length, "pages each");
