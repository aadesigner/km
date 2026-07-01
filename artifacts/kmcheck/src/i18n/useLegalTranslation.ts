import { useEffect, useState } from "react";
import { useTranslation } from "./context";

type LegalDict = Record<string, string>;

const loaders: Record<string, () => Promise<{ default: LegalDict }>> = {
  en: () => import("./legal/en.json"),
  ar: () => import("./legal/ar.json"),
  uk: () => import("./legal/uk.json"),
  ru: () => import("./legal/ru.json"),
  sq: () => import("./legal/sq.json"),
};

export function useLegalTranslation() {
  const { language } = useTranslation();
  const [dict, setDict] = useState<LegalDict | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDict(null);
    const load = loaders[language] ?? loaders.en;
    load()
      .then((mod) => { if (!cancelled) setDict(mod.default); })
      .catch(() => loaders.en().then((mod) => { if (!cancelled) setDict(mod.default); }));
    return () => { cancelled = true; };
  }, [language]);

  const t = (key: string) => dict?.[key] ?? key;
  return { t, ready: dict !== null, language };
}
