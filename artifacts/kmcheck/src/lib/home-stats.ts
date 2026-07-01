export type HomeStatItem = {
  id: string;
  value: string;
  label: string;
  flag: "us" | "kr" | "ca";
};

export function useHomeStats(t: (k: string) => string): HomeStatItem[] {
  return [
    { id: "usa", value: "280M+", label: t("home_stat_usa"), flag: "us" },
    { id: "korea", value: "25M+", label: t("home_stat_korea"), flag: "kr" },
    { id: "canada", value: "30M+", label: t("home_stat_canada"), flag: "ca" },
  ];
}
