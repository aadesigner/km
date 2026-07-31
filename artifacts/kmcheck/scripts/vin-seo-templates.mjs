/** Shared VIN page title/description templates — used by seo-inject and seo-bootstrap. */

export function vinSeoTemplates(vin, lang) {
  const titles = {
    en: `VIN ${vin} — Vehicle History Report | kmcheck`,
    de: `VIN ${vin} — Fahrzeughistorienbericht | kmcheck`,
    es: `VIN ${vin} — Informe historial del vehículo | kmcheck`,
    fr: `VIN ${vin} — Rapport historique véhicule | kmcheck`,
    sq: `VIN ${vin} — raport historiku automjeti | kmcheck`,
    pl: `VIN ${vin} — raport historii pojazdu | kmcheck`,
    ka: `VIN ${vin} — \u10D0\u10D5\u10E2\u10DD\u10DB\u10DD\u10D1\u10D8\u10DA\u10D8\u10E1 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D8\u10E1 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 | kmcheck`,
    ro: `VIN ${vin} — raport istoric vehicul | kmcheck`,
    bg: `VIN ${vin} — отчет за история на автомобил | kmcheck`,
    ar: `VIN ${vin} — تقرير تاريخ المركبة | kmcheck`,
    uk: `VIN ${vin} — звіт історії авто | kmcheck`,
    ru: `VIN ${vin} — отчёт по истории авто | kmcheck`,
  };
  const descriptions = {
    en: `Check VIN ${vin}: mileage, accidents, ownership history, insurance & auction records. Instant full report on kmcheck.com.`,
    de: `VIN ${vin} prüfen: Kilometerstand, Unfälle, Halterhistorie, Versicherung und Auktionen. Sofortiger Vollbericht auf kmcheck.com.`,
    es: `Consulta VIN ${vin}: kilometraje, accidentes, historial de propietarios, seguro y subastas. Informe completo al instante en kmcheck.com.`,
    fr: `Vérifiez VIN ${vin} : kilométrage, accidents, historique des propriétaires, assurance et enchères. Rapport complet instantané sur kmcheck.com.`,
    sq: `Kontrollo VIN ${vin}: kilometrat, aksidentet, historinë e pronarëve, sigurimin dhe ankandet. Raport i menjëhershëm në kmcheck.com.`,
    pl: `Sprawdź VIN ${vin}: przebieg, wypadki, historia właścicieli, ubezpieczenie i aukcje. Pełny raport natychmiast na kmcheck.com.`,
    ka: `\u10E8\u10D4\u10D0\u10DB\u10DD\u10EC\u10DB\u10D4\u10D7 VIN ${vin}: \u10D2\u10D0\u10E0\u10D1\u10D4\u10DC\u10D8, \u10D0\u10D5\u10D0\u10E0\u10D8\u10D4\u10D1\u10D8, \u10DB\u10E4\u10DA\u10DD\u10D1\u10D4\u10DA\u10D7\u10D0 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0, \u10D3\u10D0\u10D6\u10E6\u10D5\u10D4\u10D5\u10D0 \u10D3\u10D0 \u10D0\u10E3\u10E5\u10EA\u10D8\u10DD\u10DC\u10D4\u10D1\u10D8. \u10E1\u10E0\u10E3\u10DA\u10D8 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 \u10DB\u10D0\u10E8\u10D8\u10DC\u10D5\u10D4 kmcheck.com-\u10D6\u10D4.`,
    ro: `Verificați VIN ${vin}: kilometraj, accidente, istoric proprietari, asigurare și licitații. Raport complet instant pe kmcheck.com.`,
    bg: `Проверете VIN ${vin}: пробег, катастрофи, история на собственици, застраховка и търгове. Пълен отчет мигновено на kmcheck.com.`,
    ar: `تحقق من VIN ${vin}: الكيلومترات، الحوادث، سجل الملكية، التأمين ومزادات البيع. تقرير فوري على kmcheck.com.`,
    uk: `Перевірте VIN ${vin}: пробіг, ДТП, історія власників, страхування та аукціони. Миттєвий звіт на kmcheck.com.`,
    ru: `Проверьте VIN ${vin}: пробег, ДТП, история владельцев, страхование и аукционы. Мгновенный отчёт на kmcheck.com.`,
  };
  return {
    title: titles[lang] ?? titles.en,
    description: descriptions[lang] ?? descriptions.en,
  };
}

/** Serialize templates for seo-bootstrap.js (vin interpolated at runtime). */
export function vinSeoBootstrapSnippet() {
  return `
  function vinSeoFallback(rest, lang) {
    var m = rest.match(VIN_INDEX_RE);
    if (!m) return null;
    var vin = m[1].toUpperCase();
    var titles = {
      en: "VIN " + vin + " — Vehicle History Report | kmcheck",
      de: "VIN " + vin + " — Fahrzeughistorienbericht | kmcheck",
      es: "VIN " + vin + " — Informe historial del vehículo | kmcheck",
      fr: "VIN " + vin + " — Rapport historique véhicule | kmcheck",
      sq: "VIN " + vin + " — raport historiku automjeti | kmcheck",
      pl: "VIN " + vin + " — raport historii pojazdu | kmcheck",
      ka: "VIN " + vin + " — \u10D0\u10D5\u10E2\u10DD\u10DB\u10DD\u10D1\u10D8\u10DA\u10D8\u10E1 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D8\u10E1 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 | kmcheck",
      ro: "VIN " + vin + " — raport istoric vehicul | kmcheck",
      bg: "VIN " + vin + " — отчет за история на автомобил | kmcheck",
      ar: "VIN " + vin + " — تقرير تاريخ المركبة | kmcheck",
      uk: "VIN " + vin + " — звіт історії авто | kmcheck",
      ru: "VIN " + vin + " — отчёт по истории авто | kmcheck"
    };
    var descriptions = {
      en: "Check VIN " + vin + ": mileage, accidents, ownership history, insurance & auction records. Instant full report on kmcheck.com.",
      de: "VIN " + vin + " prüfen: Kilometerstand, Unfälle, Halterhistorie, Versicherung und Auktionen. Sofortiger Vollbericht auf kmcheck.com.",
      es: "Consulta VIN " + vin + ": kilometraje, accidentes, historial de propietarios, seguro y subastas. Informe completo al instante en kmcheck.com.",
      fr: "Vérifiez VIN " + vin + " : kilométrage, accidents, historique des propriétaires, assurance et enchères. Rapport complet instantané sur kmcheck.com.",
      sq: "Kontrollo VIN " + vin + ": kilometrat, aksidentet, historinë e pronarëve, sigurimin dhe ankandet. Raport i menjëhershëm në kmcheck.com.",
      pl: "Sprawdź VIN " + vin + ": przebieg, wypadki, historia właścicieli, ubezpieczenie i aukcje. Pełny raport natychmiast na kmcheck.com.",
      ka: "\u10E8\u10D4\u10D0\u10DB\u10DD\u10EC\u10DB\u10D4\u10D7 VIN " + vin + ": \u10D2\u10D0\u10E0\u10D1\u10D4\u10DC\u10D8, \u10D0\u10D5\u10D0\u10E0\u10D8\u10D4\u10D1\u10D8, \u10DB\u10E4\u10DA\u10DD\u10D1\u10D4\u10DA\u10D7\u10D0 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0, \u10D3\u10D0\u10D6\u10E6\u10D5\u10D4\u10D5\u10D0 \u10D3\u10D0 \u10D0\u10E3\u10E5\u10EA\u10D8\u10DD\u10DC\u10D4\u10D1\u10D8. \u10E1\u10E0\u10E3\u10DA\u10D8 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8 \u10DB\u10D0\u10E8\u10D8\u10DC\u10D5\u10D4 kmcheck.com-\u10D6\u10D4.",
      ro: "Verificați VIN " + vin + ": kilometraj, accidente, istoric proprietari, asigurare și licitații. Raport complet instant pe kmcheck.com.",
      bg: "Проверете VIN " + vin + ": пробег, катастрофи, история на собственици, застраховка и търгове. Пълен отчет мигновено на kmcheck.com.",
      ar: "تحقق من VIN " + vin + ": الكيلومترات، الحوادث، سجل الملكية، التأمين ومزادات البيع. تقرير فوري على kmcheck.com.",
      uk: "Перевірте VIN " + vin + ": пробіг, ДТП, історія власників, страхування та аукціони. Миттєвий звіт на kmcheck.com.",
      ru: "Проверьте VIN " + vin + ": пробег, ДТП, история владельцев, страхование и аукционы. Мгновенный отчёт на kmcheck.com."
    };
    return {
      title: titles[lang] || titles.en,
      description: descriptions[lang] || descriptions.en
    };
  }`.trim();
}
