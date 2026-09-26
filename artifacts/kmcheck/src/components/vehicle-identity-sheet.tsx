import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

export type VehicleIdentityField = {
  key: string;
  label: string;
  value: string | null | undefined;
};

type Props = {
  fields: VehicleIdentityField[];
  className?: string;
};

const FEATURED_KEYS = new Set(["make", "model", "year", "trim"]);

function formatSpecValue(key: string, value: string) {
  const raw = value.trim();
  if (key === "engine" && /^\d{3,5}$/.test(raw)) {
    return `${Number(raw).toLocaleString()} cc`;
  }
  return raw;
}

function fieldValue(fields: VehicleIdentityField[], key: string) {
  const match = fields.find((field) => field.key === key && field.value);
  return match?.value?.trim() || null;
}

/** Featured make/model + year, then a two-column spec sheet — kmcheck card language. */
export function VehicleIdentitySheet({ fields, className }: Props) {
  const { t } = useTranslation();
  const make = fieldValue(fields, "make");
  const model = fieldValue(fields, "model");
  const year = fieldValue(fields, "year");
  const trim = fieldValue(fields, "trim");
  const title = [make, model].filter(Boolean).join(" ");
  const rows = fields
    .filter((field) => field.value && !FEATURED_KEYS.has(field.key))
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: formatSpecValue(field.key, String(field.value)),
    }));

  if (!title && !year && rows.length === 0) return null;

  return (
    <div className={cn(className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          {title ? (
            <p className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {title}
            </p>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">{t("vehicle_info")}</p>
          )}
          {trim ? (
            <p className="mt-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {t("trim_generation")}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{trim}</span>
            </p>
          ) : null}
        </div>
        {year ? (
          <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/[0.07] px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("year")}
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums leading-none text-primary">{year}</p>
          </div>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={`${row.key}-${row.label}`}
              className="flex items-baseline justify-between gap-4 border-b border-border/50 px-5 py-3 last:border-b-0 sm:px-6 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="min-w-0 text-right text-sm font-semibold text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
