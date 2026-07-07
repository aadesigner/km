/**
 * Add Polish (pl) SEO entries to seo-data.json — mirrors en/ro patterns.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seoPath = path.join(__dirname, "../src/lib/seo-data.json");
const seoData = JSON.parse(fs.readFileSync(seoPath, "utf8"));

const PL = {
  home: {
    title: "Sprawdzenie VIN auta — przebieg, wypadki i historia salvage | kmcheck.com",
    description:
      "Natychmiastowe sprawdzenie VIN — zweryfikuj rzeczywisty przebieg, odkryj pełną historię wypadków i zapisy salvage dowolnego auta.",
  },
  pricing: {
    title: "Cennik — raporty historii VIN | kmcheck.com",
    description:
      "Jeden przystępny raport VIN obejmuje weryfikację przebiegu, wypadki, status salvage i kradzież. Natychmiastowa dostawa. Bez subskrypcji.",
  },
  auth: {
    title: "Logowanie — kmcheck.com",
    description:
      "Zaloguj się lub utwórz darmowe konto, aby wykonywać natychmiastowe sprawdzenia VIN i uzyskać dostęp do raportów historii pojazdu.",
  },
  dashboard: {
    title: "Moje raporty — historia VIN | kmcheck.com",
    description: "Przeglądaj raporty historii pojazdów i wykonuj nowe sprawdzenia VIN.",
  },
  vin_result: {
    title: "Raport historii VIN — kmcheck.com",
    description:
      "Pełny raport historii pojazdu: przebieg, wypadki, właściciele, ubezpieczenie i aukcje. Natychmiastowy dostęp po zakupie.",
  },
  country_usa: {
    title: "Auta z USA — sprawdzenie VIN, przebieg i historia wypadków | kmcheck.com",
    description:
      "Sprawdź historię auta z USA po VIN: przebieg, wypadki, salvage, kradzież i aukcje. Raport natychmiast na kmcheck.com.",
  },
  country_korea: {
    title: "Auta z Korei — sprawdzenie VIN i historia pojazdu | kmcheck.com",
    description:
      "Sprawdź auto z Korei po VIN: przebieg, wypadki, eksport i aukcje. Pełny raport historii na kmcheck.com.",
  },
  country_canada: {
    title: "Auta z Kanady — sprawdzenie VIN i historia pojazdu | kmcheck.com",
    description:
      "Sprawdź auto z Kanady po VIN: przebieg, wypadki, salvage i kradzież. Natychmiastowy raport na kmcheck.com.",
  },
  free_decoder: {
    title: "Darmowy dekoder VIN — dekoduj numer VIN | kmcheck.com",
    description:
      "Darmowy dekoder VIN: rok, marka, model i specyfikacja. Sprawdź VIN i zamów pełny raport historii na kmcheck.com.",
  },
  how_it_works: {
    title: "Jak to działa — sprawdzenie VIN krok po kroku | kmcheck.com",
    description:
      "Wpisz VIN, zapłać bezpiecznie i otrzymaj pełny raport historii w kilka sekund. Przebieg, wypadki, salvage i więcej.",
  },
  faq: {
    title: "FAQ — sprawdzenie VIN i raporty historii | kmcheck.com",
    description:
      "Odpowiedzi na pytania o sprawdzanie VIN, przebieg, wypadki, salvage, płatności i raporty historii pojazdu na kmcheck.com.",
  },
  terms: {
    title: "Regulamin — kmcheck.com",
    description: "Regulamin korzystania z kmcheck.com i usług raportów historii VIN.",
  },
  privacy: {
    title: "Polityka prywatności — kmcheck.com",
    description: "Jak kmcheck.com zbiera, wykorzystuje i chroni Twoje dane osobowe.",
  },
  not_found: {
    title: "Strona nie znaleziona — kmcheck.com",
    description: "Żądana strona nie istnieje. Wróć na kmcheck.com, aby sprawdzić VIN.",
  },
  sign_up: {
    title: "Rejestracja — kmcheck.com",
    description:
      "Utwórz darmowe konto kmcheck, aby zapisywać raporty VIN i szybciej sprawdzać historię pojazdów.",
  },
  checkout: {
    title: "Płatność — raport VIN | kmcheck.com",
    description: "Bezpieczna płatność za raport historii VIN. Natychmiastowy dostęp po potwierdzeniu.",
  },
  purchases: {
    title: "Zakupy — kmcheck.com",
    description: "Historia zakupów raportów VIN i dostęp do wcześniej wygenerowanych raportów.",
  },
  forgot_password: {
    title: "Przypomnienie hasła — kmcheck.com",
    description: "Zresetuj hasło do konta kmcheck, aby odzyskać dostęp do raportów VIN.",
  },
  reset_password: {
    title: "Reset hasła — kmcheck.com",
    description: "Ustaw nowe hasło do konta kmcheck.",
  },
};

for (const [pageKey, entry] of Object.entries(PL)) {
  if (!seoData[pageKey]) {
    console.error("Unknown page key:", pageKey);
    process.exit(1);
  }
  seoData[pageKey].pl = entry;
}

fs.writeFileSync(seoPath, JSON.stringify(seoData, null, 2) + "\n", "utf8");
console.log("Added pl SEO for", Object.keys(PL).length, "pages");
