/**
 * Localize DE/FR/PL/RO/BG SEO copy: remove English "salvage", add market terms.
 * Touches only seo-data.json string values for those five langs — no logic changes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seoPath = path.join(__dirname, "../src/lib/seo-data.json");
const seo = JSON.parse(fs.readFileSync(seoPath, "utf8"));

/** @type {Record<string, Record<string, { title: string, description: string }>>} */
const PATCH = {
  de: {
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
    free_decoder: {
      title: "Kostenloser VIN-Decoder — Fahrgestellnummer prüfen | kmcheck.com",
      description:
        "Kostenloser VIN-Decoder: Baujahr, Marke, Modell und Ausstattung. VIN prüfen und vollständigen Historienbericht auf kmcheck.com bestellen.",
    },
    how_it_works: {
      title: "So funktioniert's — Kilometerstand & VIN prüfen | kmcheck.com",
      description:
        "VIN eingeben, sicher bezahlen und in Sekunden den vollständigen Historienbericht erhalten. Kilometerstand, Unfälle, Totalschaden und mehr.",
    },
    faq: {
      title: "FAQ — Kilometerstand prüfen & VIN-Bericht | kmcheck.com",
      description:
        "Antworten zu VIN-Checks, Kilometerstand, Unfällen, Totalschaden, Zahlung und Fahrzeughistorienberichten auf kmcheck.com.",
    },
    country_usa: {
      title: "USA-Importe prüfen — Kilometerstand & Unfallhistorie | kmcheck.com",
      description:
        "US-Importe per VIN prüfen: Kilometerstand, Unfälle, Totalschaden, Diebstahl und Auktionen. Sofortbericht auf kmcheck.com.",
    },
    country_korea: {
      title: "Korea-Importe prüfen — VIN & Fahrzeughistorie | kmcheck.com",
      description:
        "Koreanische Importfahrzeuge per VIN prüfen: Kilometerstand, Unfälle, Export und Auktionen. Vollständiger Historienbericht auf kmcheck.com.",
    },
    country_canada: {
      title: "Kanada-Importe prüfen — VIN & Fahrzeughistorie | kmcheck.com",
      description:
        "Kanadische Fahrzeuge per VIN prüfen: Kilometerstand, Unfälle, Totalschaden und Diebstahl. Sofortbericht auf kmcheck.com.",
    },
    vin_result: {
      title: "VIN-Historienbericht — kmcheck.com",
      description:
        "Vollständiger Fahrzeughistorienbericht: Kilometerstand, Unfälle, Halter, Versicherung und Auktionen. Sofortiger Zugriff nach Kauf.",
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
  },
  fr: {
    home: {
      title: "Vérifier le kilométrage — accidents & épave | kmcheck.com",
      description:
        "Contrôle VIN instantané : vérifiez le kilométrage réel, l'historique des accidents et le statut épave de tout véhicule.",
    },
    pricing: {
      title: "Tarifs — historique véhicule & rapport VIN | kmcheck.com",
      description:
        "Un rapport VIN abordable : kilométrage, accidents, statut épave et vol. Livraison instantanée. Sans abonnement.",
    },
    free_decoder: {
      title: "Décodeur VIN gratuit — numéro VIN | kmcheck.com",
      description:
        "Décodeur VIN gratuit : année, marque, modèle et équipement. Vérifiez le VIN et commandez le rapport complet sur kmcheck.com.",
    },
    how_it_works: {
      title: "Comment ça marche — vérifier le kilométrage | kmcheck.com",
      description:
        "Saisissez le VIN, payez en toute sécurité et recevez le rapport complet en quelques secondes. Kilométrage, accidents, épave et plus.",
    },
    faq: {
      title: "FAQ — historique véhicule & contrôle VIN | kmcheck.com",
      description:
        "Réponses sur les contrôles VIN, le kilométrage, les accidents, le statut épave, les paiements et les rapports sur kmcheck.com.",
    },
    country_usa: {
      title: "Voitures des USA — kilométrage, accidents & épave | kmcheck.com",
      description:
        "Vérifiez l'historique d'un import USA par VIN : kilométrage, accidents, épave, vol et enchères. Rapport instantané sur kmcheck.com.",
    },
    country_korea: {
      title: "Voitures de Corée — contrôle VIN & historique | kmcheck.com",
      description:
        "Vérifiez un import coréen par VIN : kilométrage, accidents, export et enchères. Rapport complet sur kmcheck.com.",
    },
    country_canada: {
      title: "Voitures du Canada — kilométrage, accidents & épave | kmcheck.com",
      description:
        "Vérifiez un véhicule canadien par VIN : kilométrage, accidents, épave et vol. Rapport instantané sur kmcheck.com.",
    },
    vin_result: {
      title: "Rapport historique VIN — kmcheck.com",
      description:
        "Rapport complet : kilométrage, accidents, propriétaires, assurance et enchères. Accès instantané après achat.",
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
  },
  pl: {
    home: {
      title: "Sprawdzenie VIN auta — przebieg, wypadki i szkoda całkowita | kmcheck.com",
      description:
        "Natychmiastowe sprawdzenie VIN — zweryfikuj rzeczywisty przebieg, odkryj pełną historię wypadków i zapisy szkody całkowitej dowolnego auta.",
    },
    pricing: {
      title: "Cennik — raporty historii VIN | kmcheck.com",
      description:
        "Jeden przystępny raport VIN obejmuje weryfikację przebiegu, wypadki, szkodę całkowitą i kradzież. Natychmiastowa dostawa. Bez subskrypcji.",
    },
    free_decoder: {
      title: "Darmowy dekoder VIN — dekoduj numer VIN | kmcheck.com",
      description:
        "Darmowy dekoder VIN: rok, marka, model i specyfikacja. Sprawdź VIN i zamów pełny raport historii na kmcheck.com.",
    },
    how_it_works: {
      title: "Jak to działa — sprawdzenie VIN krok po kroku | kmcheck.com",
      description:
        "Wpisz VIN, zapłać bezpiecznie i otrzymaj pełny raport historii w kilka sekund. Przebieg, wypadki, szkoda całkowita i więcej.",
    },
    faq: {
      title: "FAQ — sprawdzenie VIN i raporty historii | kmcheck.com",
      description:
        "Odpowiedzi na pytania o sprawdzanie VIN, przebieg, wypadki, szkodę całkowitą, płatności i raporty historii pojazdu na kmcheck.com.",
    },
    country_usa: {
      title: "Auta z USA — sprawdzenie VIN, przebieg i wypadki | kmcheck.com",
      description:
        "Sprawdź historię auta z USA po VIN: przebieg, wypadki, szkoda całkowita, kradzież i aukcje. Raport natychmiast na kmcheck.com.",
    },
    country_korea: {
      title: "Auta z Korei — sprawdzenie VIN i historia pojazdu | kmcheck.com",
      description:
        "Sprawdź auto z Korei po VIN: przebieg, wypadki, eksport i aukcje. Pełny raport historii na kmcheck.com.",
    },
    country_canada: {
      title: "Auta z Kanady — sprawdzenie VIN i historia pojazdu | kmcheck.com",
      description:
        "Sprawdź auto z Kanady po VIN: przebieg, wypadki, szkoda całkowita i kradzież. Natychmiastowy raport na kmcheck.com.",
    },
  },
  ro: {
    home: {
      title: "Verificare VIN auto — kilometraj, accidente și daună totală | kmcheck.com",
      description:
        "Verificare VIN instantanee — confirmați kilometrajul real, descoperiți accidentele și înregistrările de daună totală pentru orice mașină.",
    },
    pricing: {
      title: "Prețuri — Rapoarte istoric VIN | kmcheck.com",
      description:
        "Un raport VIN accesibil acoperă verificarea kilometrajului, accidentele, statusul de daună totală pe titlu și furtul. Livrare instantanee. Fără abonament.",
    },
    how_it_works: {
      title: "Cum funcționează verificarea VIN — 3 pași | kmcheck.com",
      description:
        "Introduceți VIN-ul, căutăm în bazele de date ale furnizorilor, primiți raportul complet în câteva secunde.",
    },
    faq: {
      title: "Întrebări frecvente — Verificare VIN | kmcheck.com",
      description:
        "Răspunsuri despre verificarea VIN, kilometraj, accidente, daună totală, plăți și rambursări pe kmcheck.com.",
    },
    country_usa: {
      title: "Mașini din SUA — verificare VIN, kilometraj și accidente | kmcheck.com",
      description:
        "Verificați mașinile importate din SUA: kilometraj, accidente, titluri cu daună totală și înregistrări de furt înainte de cumpărare.",
    },
    country_korea: {
      title: "Mașini din Coreea — verificare VIN și kilometraj | kmcheck.com",
      description:
        "Verificați mașinile coreene importate: kilometraj, accidente, daune structurale și înregistrări de furt.",
    },
    country_canada: {
      title: "Mașini din Canada — verificare VIN și istoric | kmcheck.com",
      description:
        "Verificați mașinile canadiene: kilometraj, accidente, titluri marcate și înregistrări transfrontaliere.",
    },
  },
  bg: {
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
    vin_result: {
      title: "Отчет за история на VIN — kmcheck.com",
      description:
        "Пълен отчет: пробег, катастрофи, собственици, застраховка и търгове. Мигновен достъп след покупка.",
    },
  },
};

let updated = 0;
for (const [lang, pages] of Object.entries(PATCH)) {
  for (const [pageKey, entry] of Object.entries(pages)) {
    if (!seo[pageKey]) {
      console.error("Unknown page:", pageKey);
      process.exit(1);
    }
    seo[pageKey][lang] = { ...(seo[pageKey][lang] ?? {}), ...entry };
    updated++;
  }
}

/** Safety: ensure target langs no longer contain bare "salvage" in indexable pages */
const checkPages = [
  "home",
  "pricing",
  "free_decoder",
  "how_it_works",
  "faq",
  "country_usa",
  "country_korea",
  "country_canada",
];
for (const lang of ["de", "fr", "pl", "ro", "bg"]) {
  for (const page of checkPages) {
    const blob = `${seo[page]?.[lang]?.title ?? ""} ${seo[page]?.[lang]?.description ?? ""}`.toLowerCase();
    if (blob.includes("salvage")) {
      console.error(`Still contains salvage: ${lang}.${page}`);
      process.exit(1);
    }
  }
}

fs.writeFileSync(seoPath, JSON.stringify(seo, null, 2) + "\n", "utf8");
console.log(`Patched ${updated} SEO entries for de/fr/pl/ro/bg`);
