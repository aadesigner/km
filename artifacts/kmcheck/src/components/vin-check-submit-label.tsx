import { useTranslation } from "@/i18n/context";

/** Hero / country VIN form — full label on sm+, short verb only on mobile. */
export function VinCheckSubmitLabel() {
  const { t } = useTranslation();
  return (
    <>
      <span className="sm:hidden">{t("check_vin_short")}</span>
      <span className="hidden sm:inline">{t("check_vin")}</span>
    </>
  );
}
