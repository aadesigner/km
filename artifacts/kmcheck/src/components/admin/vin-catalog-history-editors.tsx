import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminAmountWithCurrency,
  AdminDateField,
  AdminOdometerWithUnit,
  AdminSelectField,
  AdminTextField,
} from "@/components/admin/admin-vin-form-fields";
import { ADMIN_DAMAGE_VALUES } from "@/components/admin/admin-vin-form-constants";
import { useKrwPerUsd } from "@/hooks/use-krw-per-usd";
import { useTranslation } from "@/i18n/context";
import {
  formatCountryName,
  countryLabelsFromT,
  canonicalCountryStorageLabel,
} from "@/lib/format-country-name";
import { defaultAmountCurrencyForCountry } from "@/lib/korean-currency";
import { damageValueKey } from "@/lib/translate-damage-label";
import {
  buildCountrySelectOptions,
  resolveCountrySelectValue,
} from "@/lib/vehicle-attr-options";

export type CatalogAccidentForm = {
  date: string;
  severity: string;
  description: string;
  /** Free-text place (city/region). Replaces the old country select. */
  location: string;
  type: string;
  primaryDamage: string;
  secondaryDamage: string;
  airbagDeployed: "" | "yes" | "no";
  odometerAtLoss: string;
  lossAmount: string;
  currency: string;
};

export type CatalogInsuranceClaimForm = {
  date: string;
  type: string;
  lossAmount: string;
  partCost: string;
  laborCost: string;
  paintingCost: string;
  description: string;
  currency: string;
};

export type CatalogMileageForm = {
  date: string;
  odometer: string;
  unit: string;
  source: string;
  condition: string;
  damage: string;
  primaryDamage: string;
  secondaryDamage: string;
  titleStatus: string;
  auctionPrice: string;
  lotStatus: string;
  location: string;
  /** Free-text notes / services at this mileage (admin-entered; shown on report). */
  description: string;
};

export type CatalogServiceForm = {
  date: string;
  mileage: string;
  title: string;
  location: string;
  description: string;
};

export type CatalogOwnerForm = {
  date: string;
  location: string;
  mileage: string;
  auctionPrice: string;
  lotStatus: string;
  condition: string;
};

export type CatalogAuctionForm = {
  date: string;
  city: string;
  state: string;
  country: string;
  condition: string;
  damage: string;
  primaryDamage: string;
  secondaryDamage: string;
  titleStatus: string;
  openingBid: string;
  buyNowPrice: string;
  finalPrice: string;
  lotStatus: string;
};

export type CatalogRegistryDetailForm = { label: string; value: string };

export type CatalogRegistryForm = {
  date: string;
  type: string;
  title: string;
  subtitle: string;
  mileage: string;
  amount: string;
  location: string;
  details: CatalogRegistryDetailForm[];
};

export type CatalogMarketDataForm = {
  estimatedValue: string;
  currency: string;
  lastAuctionPrice: string;
  lastAuctionDate: string;
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function boolOrNull(s: "" | "yes" | "no"): boolean | null {
  if (s === "yes") return true;
  if (s === "no") return false;
  return null;
}

function boolFromUnknown(v: unknown): "" | "yes" | "no" {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "";
}

export const EMPTY_ACCIDENT: CatalogAccidentForm = {
  date: "", severity: "", description: "", location: "", type: "",
  primaryDamage: "", secondaryDamage: "", airbagDeployed: "",
  odometerAtLoss: "", lossAmount: "", currency: "",
};

export const EMPTY_INSURANCE_CLAIM: CatalogInsuranceClaimForm = {
  date: "", type: "", lossAmount: "", partCost: "", laborCost: "",
  paintingCost: "", description: "", currency: "",
};

export const EMPTY_MILEAGE: CatalogMileageForm = {
  date: "", odometer: "", unit: "km", source: "", condition: "", damage: "",
  primaryDamage: "", secondaryDamage: "", titleStatus: "",
  auctionPrice: "", lotStatus: "", location: "", description: "",
};

export const EMPTY_SERVICE: CatalogServiceForm = {
  date: "", mileage: "", title: "", location: "", description: "",
};

export const EMPTY_OWNER: CatalogOwnerForm = {
  date: "", location: "", mileage: "", auctionPrice: "", lotStatus: "", condition: "",
};

export const EMPTY_AUCTION: CatalogAuctionForm = {
  date: "", city: "", state: "", country: "", condition: "", damage: "",
  primaryDamage: "", secondaryDamage: "", titleStatus: "",
  openingBid: "", buyNowPrice: "", finalPrice: "", lotStatus: "",
};

export const EMPTY_REGISTRY: CatalogRegistryForm = {
  date: "", type: "", title: "", subtitle: "", mileage: "", amount: "",
  location: "", details: [],
};

export const EMPTY_MARKET_DATA: CatalogMarketDataForm = {
  estimatedValue: "", currency: "", lastAuctionPrice: "", lastAuctionDate: "",
};

export function normalizeAccidents(value: unknown): CatalogAccidentForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    // Prefer location; fall back to legacy country so old rows still show a place.
    const location = str(o.location) || str(o.country);
    return {
      date: str(o.date),
      severity: str(o.severity),
      description: str(o.description),
      location,
      type: str(o.type),
      primaryDamage: str(o.primaryDamage),
      secondaryDamage: str(o.secondaryDamage),
      airbagDeployed: boolFromUnknown(o.airbagDeployed),
      odometerAtLoss: str(o.odometerAtLoss),
      lossAmount: str(o.lossAmount),
      currency: str(o.currency),
    };
  });
}

export function normalizeInsuranceClaims(value: unknown): CatalogInsuranceClaimForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      date: str(o.date),
      type: str(o.type),
      lossAmount: str(o.lossAmount),
      partCost: str(o.partCost),
      laborCost: str(o.laborCost),
      paintingCost: str(o.paintingCost),
      description: str(o.description),
      currency: str(o.currency),
    };
  });
}

export function normalizeMileageHistory(value: unknown): CatalogMileageForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      date: str(o.date),
      odometer: str(o.odometer),
      unit: str(o.unit) || "km",
      source: str(o.source),
      condition: str(o.condition),
      damage: str(o.damage),
      primaryDamage: str(o.primaryDamage),
      secondaryDamage: str(o.secondaryDamage),
      titleStatus: str(o.titleStatus),
      auctionPrice: str(o.auctionPrice),
      lotStatus: str(o.lotStatus),
      location: str(o.location),
      description: str(o.description),
    };
  });
}

export function normalizeServiceHistory(value: unknown): CatalogServiceForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      date: str(o.date),
      mileage: str(o.mileage ?? o.odometer),
      title: str(o.title),
      location: str(o.location),
      description: str(o.description ?? o.service),
    };
  });
}

export function normalizeOwnerHistory(value: unknown): CatalogOwnerForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      date: str(o.date),
      location: str(o.location),
      mileage: str(o.mileage),
      auctionPrice: str(o.auctionPrice),
      lotStatus: str(o.lotStatus),
      condition: str(o.condition),
    };
  });
}

export function normalizeAuctionHistory(value: unknown): CatalogAuctionForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      date: str(o.date),
      city: str(o.city),
      state: str(o.state),
      country: str(o.country),
      condition: str(o.condition),
      damage: str(o.damage),
      primaryDamage: str(o.primaryDamage),
      secondaryDamage: str(o.secondaryDamage),
      titleStatus: str(o.titleStatus),
      openingBid: str(o.openingBid),
      buyNowPrice: str(o.buyNowPrice),
      finalPrice: str(o.finalPrice),
      lotStatus: str(o.lotStatus),
    };
  });
}

export function normalizeRegistryHistory(value: unknown): CatalogRegistryForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    const details = Array.isArray(o.details)
      ? o.details.map((d) => {
          const row = (d ?? {}) as Record<string, unknown>;
          return { label: str(row.label), value: str(row.value) };
        })
      : [];
    return {
      date: str(o.date),
      type: str(o.type),
      title: str(o.title),
      subtitle: str(o.subtitle),
      mileage: str(o.mileage),
      amount: str(o.amount),
      location: str(o.location),
      details,
    };
  });
}

export function normalizeMarketData(value: unknown): CatalogMarketDataForm {
  if (!value || typeof value !== "object") return { ...EMPTY_MARKET_DATA };
  const o = value as Record<string, unknown>;
  return {
    estimatedValue: str(o.estimatedValue),
    currency: str(o.currency),
    lastAuctionPrice: str(o.lastAuctionPrice),
    lastAuctionDate: str(o.lastAuctionDate),
  };
}

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t || null;
}

function rowOrNull(
  row: Record<string, unknown>,
  extra?: Record<string, unknown>,
): Record<string, unknown> | null {
  const base = { ...row, ...extra };
  const hasValue = Object.values(base).some((v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim() !== "";
  });
  if (!hasValue) return null;
  return base;
}

export function accidentsToPayload(rows: CatalogAccidentForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    severity: trimOrNull(r.severity),
    description: trimOrNull(r.description),
    location: trimOrNull(r.location),
    type: trimOrNull(r.type),
    primaryDamage: trimOrNull(r.primaryDamage),
    secondaryDamage: trimOrNull(r.secondaryDamage),
    odometerAtLoss: numOrNull(r.odometerAtLoss),
    lossAmount: numOrNull(r.lossAmount),
    currency: trimOrNull(r.currency),
    airbagDeployed: boolOrNull(r.airbagDeployed),
  })).filter(Boolean);
  return items;
}

export function insuranceClaimsToPayload(rows: CatalogInsuranceClaimForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    type: trimOrNull(r.type),
    description: trimOrNull(r.description),
    lossAmount: numOrNull(r.lossAmount),
    partCost: numOrNull(r.partCost),
    laborCost: numOrNull(r.laborCost),
    paintingCost: numOrNull(r.paintingCost),
    currency: trimOrNull(r.currency),
  })).filter(Boolean);
  return items;
}

export function mileageHistoryToPayload(rows: CatalogMileageForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    unit: trimOrNull(r.unit) || "km",
    source: trimOrNull(r.source),
    condition: trimOrNull(r.condition),
    titleStatus: trimOrNull(r.titleStatus),
    location: trimOrNull(r.location),
    description: trimOrNull(r.description),
    odometer: numOrNull(r.odometer),
  })).filter(Boolean);
  return items;
}

export function serviceHistoryToPayload(rows: CatalogServiceForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    title: trimOrNull(r.title),
    location: trimOrNull(r.location),
    description: trimOrNull(r.description),
    mileage: numOrNull(r.mileage),
  })).filter(Boolean);
  return items;
}

export function ownerHistoryToPayload(rows: CatalogOwnerForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    location: trimOrNull(r.location),
    lotStatus: trimOrNull(r.lotStatus),
    condition: trimOrNull(r.condition),
    mileage: numOrNull(r.mileage),
    auctionPrice: numOrNull(r.auctionPrice),
  })).filter(Boolean);
  return items;
}

export function auctionHistoryToPayload(rows: CatalogAuctionForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    city: trimOrNull(r.city),
    state: trimOrNull(r.state),
    country: trimOrNull(r.country),
    condition: trimOrNull(r.condition),
    damage: trimOrNull(r.damage),
    primaryDamage: trimOrNull(r.primaryDamage),
    secondaryDamage: trimOrNull(r.secondaryDamage),
    titleStatus: trimOrNull(r.titleStatus),
    lotStatus: trimOrNull(r.lotStatus),
    openingBid: numOrNull(r.openingBid),
    buyNowPrice: numOrNull(r.buyNowPrice),
    finalPrice: numOrNull(r.finalPrice),
  })).filter(Boolean);
  return items;
}

export function registryHistoryToPayload(rows: CatalogRegistryForm[]) {
  const items = rows.map((r) => {
    const details = r.details
      .map((d) => {
        const label = d.label.trim();
        const value = d.value.trim();
        if (!label && !value) return null;
        return { label, value };
      })
      .filter(Boolean);
    return rowOrNull({
      date: trimOrNull(r.date),
      type: trimOrNull(r.type),
      title: trimOrNull(r.title),
      subtitle: trimOrNull(r.subtitle),
      amount: trimOrNull(r.amount),
      location: trimOrNull(r.location),
      mileage: numOrNull(r.mileage),
    }, details.length ? { details } : undefined);
  }).filter(Boolean);
  return items;
}

export function marketDataToPayload(form: CatalogMarketDataForm) {
  const payload = {
    estimatedValue: numOrNull(form.estimatedValue),
    currency: trimOrNull(form.currency),
    lastAuctionPrice: numOrNull(form.lastAuctionPrice),
    lastAuctionDate: trimOrNull(form.lastAuctionDate),
  };
  const hasValue = Object.values(payload).some((v) => v != null);
  return hasValue ? payload : null;
}

function resolveEmptyItem<T>(emptyItem: T | (() => T)): T {
  return typeof emptyItem === "function" ? (emptyItem as () => T)() : emptyItem;
}

function CatalogListSection<T>({
  title,
  hint,
  items,
  emptyItem,
  onChange,
  compact,
  defaultOpen,
  renderItem,
}: {
  title: string;
  hint?: string;
  items: T[];
  emptyItem: T | (() => T);
  onChange: (items: T[]) => void;
  compact?: boolean;
  defaultOpen?: boolean;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
}) {
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const duplicateAt = (index: number) => {
    // Deep-clone so nested arrays (e.g. registry details) are not shared.
    const copy = structuredClone(items[index]);
    const next = [...items];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  const [open, setOpen] = useState(() => defaultOpen ?? (items.length > 3 ? false : items.length > 0));

  return (
    <details
      className="group overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-background to-muted/20 shadow-sm"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
        <div className="min-w-0 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">{title}</p>
            {hint && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold tabular-nums">
          {items.length}
        </Badge>
      </summary>
      <div className="px-4 pb-4 space-y-3 border-t bg-background/60 relative">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pt-3">No records — add one below.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/70 bg-background p-3.5 space-y-3 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.04]"
            >
              <div className="flex items-center justify-between gap-2 -mt-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  Record {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 sm:px-3"
                    title="Duplicate"
                    onClick={() => duplicateAt(index)}
                  >
                    <Copy className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="sr-only sm:not-sr-only sm:inline">Duplicate</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Remove"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="sr-only sm:not-sr-only sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
              {renderItem(item, index, (patch) => updateAt(index, patch))}
            </div>
          ))
        )}
        <div className="sticky bottom-2 z-10 pt-1">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="gap-1.5 w-full sm:w-auto shadow-md"
            onClick={() => onChange([...items, resolveEmptyItem(emptyItem)])}
          >
            <Plus className="h-3.5 w-3.5" />Add record
          </Button>
        </div>
      </div>
    </details>
  );
}

function RegistryDetailsEditor({
  details,
  onChange,
  compact,
}: {
  details: CatalogRegistryDetailForm[];
  onChange: (details: CatalogRegistryDetailForm[]) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <p className="text-[11px] font-medium text-muted-foreground">Detail fields</p>
      {details.map((row, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <AdminTextField
              label="Label"
              value={row.label}
              onChange={(v) => onChange(details.map((d, j) => (j === i ? { ...d, label: v } : d)))}
              compact={compact}
            />
            <AdminTextField
              label="Value"
              value={row.value}
              onChange={(v) => onChange(details.map((d, j) => (j === i ? { ...d, value: v } : d)))}
              compact={compact}
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-destructive"
            onClick={() => onChange(details.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1"
        onClick={() => onChange([...details, { label: "", value: "" }])}
      >
        <Plus className="h-3 w-3" />Add field
      </Button>
    </div>
  );
}

const AIRBAG_OPTIONS = [
  { value: "", label: "—" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "—" },
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "major", label: "Major" },
  { value: "total_loss", label: "Total loss" },
  { value: "unknown", label: "Unknown" },
];

function resolveDamageSelectValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const key = damageValueKey(trimmed);
  if ((ADMIN_DAMAGE_VALUES as readonly string[]).includes(key)) return key;
  // Common short aliases from older admin / provider rows
  if (key === "front" || key === "frontend") return "front_end";
  if (key === "rear" || key === "rearend") return "rear_end";
  if (key === "none" || key === "no_damage") return "";
  return trimmed;
}

function damageSelectOptions(
  t: (key: string) => string,
  current: string,
): { value: string; label: string }[] {
  const resolved = resolveDamageSelectValue(current);
  const options: { value: string; label: string }[] = [
    { value: "", label: "—" },
    ...ADMIN_DAMAGE_VALUES.map((value) => ({
      value,
      label: t(`damage_val_${value}`),
    })),
  ];
  if (resolved && !options.some((o) => o.value === resolved)) {
    options.push({ value: resolved, label: resolved.replace(/_/g, " ") });
  }
  return options;
}

/** Prefill location in English/canonical form so report i18n can translate it. */
function vehicleCountryLabel(code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return "";
  return canonicalCountryStorageLabel(c) || c.toUpperCase();
}

export type VinCatalogHistoryFormSlice = {
  accidents: CatalogAccidentForm[];
  insuranceClaims: CatalogInsuranceClaimForm[];
  mileageHistory: CatalogMileageForm[];
  serviceHistory: CatalogServiceForm[];
  ownerHistory: CatalogOwnerForm[];
  auctionHistory: CatalogAuctionForm[];
  registryHistory: CatalogRegistryForm[];
  marketData: CatalogMarketDataForm;
  floodCount: string;
  floodLossAmount: string;
};

export function VinCatalogHistorySections({
  form,
  onChange,
  compact = false,
  vehicleCountry = null,
}: {
  form: VinCatalogHistoryFormSlice;
  onChange: (patch: Partial<VinCatalogHistoryFormSlice>) => void;
  compact?: boolean;
  vehicleCountry?: string | null;
}) {
  const { t, language } = useTranslation();
  const krwPerUsd = useKrwPerUsd();
  const countryLabels = useMemo(() => countryLabelsFromT(t), [t]);
  const formatCountry = useMemo(
    () => (code: string) => formatCountryName(code, language, countryLabels) || code.toUpperCase(),
    [language, countryLabels],
  );

  const countryOptionsFor = (current: string) =>
    buildCountrySelectOptions(formatCountry, current);

  const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";
  const defaultCurrency = defaultAmountCurrencyForCountry(vehicleCountry);
  const marketCurrency = form.marketData.currency.trim() || defaultCurrency;
  const locationPreset = vehicleCountryLabel(vehicleCountry);

  const patchMarketData = (patch: Partial<CatalogMarketDataForm>) => {
    const next = { ...form.marketData, ...patch };
    if (!next.currency.trim()) {
      next.currency = defaultCurrency;
    }
    onChange({ marketData: next });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3.5 py-2.5">
        <p className="text-xs text-foreground/80 leading-relaxed">
          Default for this vehicle: <span className="font-semibold tabular-nums">{defaultCurrency}</span>
          {vehicleCountry?.trim() ? ` (${vehicleCountry.trim().toUpperCase()})` : ""}.
        </p>
      </div>

      <CatalogListSection
        title="Accident history"
        hint="All accident fields on one screen — damage uses the same labels as reports."
        items={form.accidents}
        emptyItem={() => ({
          ...EMPTY_ACCIDENT,
          currency: defaultCurrency,
          location: locationPreset,
        })}
        onChange={(accidents) => onChange({ accidents })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
              <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
              <AdminSelectField
                label="Severity"
                value={item.severity}
                onChange={(v) => update({ severity: v })}
                options={
                  SEVERITY_OPTIONS.some((o) => o.value === item.severity)
                    ? SEVERITY_OPTIONS
                    : item.severity
                      ? [...SEVERITY_OPTIONS, { value: item.severity, label: item.severity }]
                      : SEVERITY_OPTIONS
                }
                compact={compact}
              />
              <AdminTextField label="Type" value={item.type} onChange={(v) => update({ type: v })} compact={compact} />
              <AdminAmountWithCurrency
                label="Loss amount"
                amount={item.lossAmount}
                currency={item.currency || defaultCurrency}
                onAmountChange={(v) => update({ lossAmount: v })}
                onCurrencyChange={(v) => update({ currency: v })}
                krwPerUsd={krwPerUsd}
                compact={compact}
              />
              <AdminSelectField
                label="Primary damage"
                value={resolveDamageSelectValue(item.primaryDamage)}
                onChange={(v) => update({ primaryDamage: v })}
                options={damageSelectOptions(t, item.primaryDamage)}
                compact={compact}
              />
              <AdminSelectField
                label="Secondary damage"
                value={resolveDamageSelectValue(item.secondaryDamage)}
                onChange={(v) => update({ secondaryDamage: v })}
                options={damageSelectOptions(t, item.secondaryDamage)}
                compact={compact}
              />
              <AdminTextField
                label="Location (optional)"
                hint="City or place — not a country code"
                value={item.location}
                onChange={(v) => update({ location: v })}
                compact={compact}
              />
              <AdminSelectField
                label="Airbag deployed"
                value={item.airbagDeployed}
                onChange={(v) => update({ airbagDeployed: v as CatalogAccidentForm["airbagDeployed"] })}
                options={AIRBAG_OPTIONS}
                compact={compact}
              />
              <AdminTextField label="Odometer at loss" value={item.odometerAtLoss} onChange={(v) => update({ odometerAtLoss: v })} type="number" compact={compact} />
              <div className="sm:col-span-2 lg:col-span-3">
                <AdminTextField label="Description" value={item.description} onChange={(v) => update({ description: v })} compact={compact} />
              </div>
          </div>
        )}
      />

      <CatalogListSection
        title="Mileage history"
        hint="Odometer defaults to km. New rows prefill location from vehicle country."
        items={form.mileageHistory}
        emptyItem={() => ({
          ...EMPTY_MILEAGE,
          unit: "km",
          location: locationPreset,
        })}
        onChange={(mileageHistory) => onChange({ mileageHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <AdminOdometerWithUnit
              odometer={item.odometer}
              unit={item.unit || "km"}
              onOdometerChange={(v) => update({ odometer: v })}
              onUnitChange={(v) => update({ unit: v })}
              compact={compact}
            />
            <AdminTextField label="Source" value={item.source} onChange={(v) => update({ source: v })} compact={compact} />
            <AdminTextField label="Title status" value={item.titleStatus} onChange={(v) => update({ titleStatus: v })} compact={compact} />
            <AdminTextField label="Condition" value={item.condition} onChange={(v) => update({ condition: v })} compact={compact} />
            <AdminTextField
              label="Location"
              hint="Prefills from vehicle country — clear or edit anytime"
              value={item.location}
              onChange={(v) => update({ location: v })}
              compact={compact}
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <AdminTextField
                label="Description / notes"
                value={item.description}
                onChange={(v) => update({ description: v })}
                compact={compact}
              />
            </div>
          </div>
        )}
      />

      <CatalogListSection
        title="Auction history"
        items={form.auctionHistory}
        emptyItem={() => ({
          ...EMPTY_AUCTION,
          country: vehicleCountry?.trim() || "",
        })}
        onChange={(auctionHistory) => onChange({ auctionHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <AdminTextField label="City" value={item.city} onChange={(v) => update({ city: v })} compact={compact} />
            <AdminTextField label="State" value={item.state} onChange={(v) => update({ state: v })} compact={compact} />
            <AdminSelectField
              label="Country"
              value={resolveCountrySelectValue(item.country)}
              onChange={(v) => update({ country: v })}
              options={countryOptionsFor(item.country)}
              compact={compact}
            />
            <AdminTextField label="Final price" value={item.finalPrice} onChange={(v) => update({ finalPrice: v })} type="number" compact={compact} />
            <AdminTextField label="Opening bid" value={item.openingBid} onChange={(v) => update({ openingBid: v })} type="number" compact={compact} />
            <AdminTextField label="Buy now price" value={item.buyNowPrice} onChange={(v) => update({ buyNowPrice: v })} type="number" compact={compact} />
            <AdminTextField label="Condition" value={item.condition} onChange={(v) => update({ condition: v })} compact={compact} />
            <AdminTextField label="Damage" value={item.damage} onChange={(v) => update({ damage: v })} compact={compact} />
            <AdminSelectField
              label="Primary damage"
              value={resolveDamageSelectValue(item.primaryDamage)}
              onChange={(v) => update({ primaryDamage: v })}
              options={damageSelectOptions(t, item.primaryDamage)}
              compact={compact}
            />
            <AdminSelectField
              label="Secondary damage"
              value={resolveDamageSelectValue(item.secondaryDamage)}
              onChange={(v) => update({ secondaryDamage: v })}
              options={damageSelectOptions(t, item.secondaryDamage)}
              compact={compact}
            />
            <AdminTextField label="Title status" value={item.titleStatus} onChange={(v) => update({ titleStatus: v })} compact={compact} />
            <AdminTextField label="Lot status" value={item.lotStatus} onChange={(v) => update({ lotStatus: v })} compact={compact} />
          </div>
        )}
      />

      <CatalogListSection
        title="Registry history"
        hint="New rows prefill location from vehicle country."
        items={form.registryHistory}
        emptyItem={() => ({
          ...EMPTY_REGISTRY,
          location: locationPreset,
        })}
        onChange={(registryHistory) => onChange({ registryHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className="space-y-3">
            <div className={grid}>
              <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
              <AdminTextField label="Type" value={item.type} onChange={(v) => update({ type: v })} compact={compact} />
              <AdminTextField label="Mileage" value={item.mileage} onChange={(v) => update({ mileage: v })} type="number" compact={compact} />
              <AdminTextField label="Amount" value={item.amount} onChange={(v) => update({ amount: v })} compact={compact} />
              <AdminTextField
                label="Location"
                hint="Prefills from vehicle country — clear or edit anytime"
                value={item.location}
                onChange={(v) => update({ location: v })}
                compact={compact}
              />
              <AdminTextField label="Title" value={item.title} onChange={(v) => update({ title: v })} compact={compact} />
              <div className="sm:col-span-2 lg:col-span-3">
                <AdminTextField label="Subtitle" value={item.subtitle} onChange={(v) => update({ subtitle: v })} compact={compact} />
              </div>
            </div>
            <RegistryDetailsEditor
              details={item.details}
              onChange={(details) => update({ details })}
              compact={compact}
            />
          </div>
        )}
      />

      <CatalogListSection
        title="Insurance claims"
        hint="Part / labor / painting share the claim currency."
        items={form.insuranceClaims}
        emptyItem={() => ({
          ...EMPTY_INSURANCE_CLAIM,
          currency: defaultCurrency,
        })}
        onChange={(insuranceClaims) => onChange({ insuranceClaims })}
        compact={compact}
        renderItem={(item, _i, update) => {
          const claimCurrency = item.currency.trim() || defaultCurrency;
          return (
            <div className={grid}>
              <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
              <AdminTextField label="Type" value={item.type} onChange={(v) => update({ type: v })} compact={compact} />
              <AdminAmountWithCurrency
                label="Loss amount"
                amount={item.lossAmount}
                currency={claimCurrency}
                onAmountChange={(v) => update({ lossAmount: v })}
                onCurrencyChange={(v) => update({ currency: v })}
                krwPerUsd={krwPerUsd}
                compact={compact}
              />
              <AdminTextField
                label="Part cost"
                hint={`Same currency (${claimCurrency})`}
                value={item.partCost}
                onChange={(v) => update({ partCost: v })}
                type="number"
                compact={compact}
              />
              <AdminTextField
                label="Labor cost"
                hint={`Same currency (${claimCurrency})`}
                value={item.laborCost}
                onChange={(v) => update({ laborCost: v })}
                type="number"
                compact={compact}
              />
              <AdminTextField
                label="Painting cost"
                hint={`Same currency (${claimCurrency})`}
                value={item.paintingCost}
                onChange={(v) => update({ paintingCost: v })}
                type="number"
                compact={compact}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <AdminTextField label="Description" value={item.description} onChange={(v) => update({ description: v })} compact={compact} />
              </div>
            </div>
          );
        }}
      />

      <CatalogListSection
        title="Service history (manual only)"
        hint="Admin-entered workshop visits only — never filled by automatic provider fetch."
        items={form.serviceHistory}
        emptyItem={EMPTY_SERVICE}
        onChange={(serviceHistory) => onChange({ serviceHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <AdminTextField label="Mileage (optional)" value={item.mileage} onChange={(v) => update({ mileage: v })} type="number" compact={compact} />
            <AdminTextField label="Title (e.g. Service)" value={item.title} onChange={(v) => update({ title: v })} compact={compact} />
            <AdminTextField label="Location" value={item.location} onChange={(v) => update({ location: v })} compact={compact} />
            <div className="sm:col-span-2 lg:col-span-3">
              <AdminTextField
                label="What service"
                value={item.description}
                onChange={(v) => update({ description: v })}
                compact={compact}
              />
            </div>
          </div>
        )}
      />

      <CatalogListSection
        title="Owner history"
        items={form.ownerHistory}
        emptyItem={EMPTY_OWNER}
        onChange={(ownerHistory) => onChange({ ownerHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <AdminDateField value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <AdminTextField label="Location" value={item.location} onChange={(v) => update({ location: v })} compact={compact} />
            <AdminTextField label="Mileage" value={item.mileage} onChange={(v) => update({ mileage: v })} type="number" compact={compact} />
            <AdminTextField label="Auction price" value={item.auctionPrice} onChange={(v) => update({ auctionPrice: v })} type="number" compact={compact} />
            <AdminTextField label="Lot status" value={item.lotStatus} onChange={(v) => update({ lotStatus: v })} compact={compact} />
            <AdminTextField label="Condition" value={item.condition} onChange={(v) => update({ condition: v })} compact={compact} />
          </div>
        )}
      />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-sky-500/5 to-background shadow-sm">
        <div className="px-4 py-3.5 border-b border-border/60">
          <p className="text-sm font-semibold tracking-tight">Flood history</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            Count and loss amount for the flood report card. Turn on “Flood damage” under Metrics to show them on the report.
          </p>
        </div>
        <div className="px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminTextField
              label="Flood record count"
              value={form.floodCount}
              onChange={(v) => onChange({ floodCount: v })}
              type="number"
              compact={compact}
            />
            <AdminAmountWithCurrency
              label="Flood loss amount"
              amount={form.floodLossAmount}
              currency="KRW"
              onAmountChange={(v) => onChange({ floodLossAmount: v })}
              onCurrencyChange={() => {}}
              krwPerUsd={krwPerUsd}
              compact={compact}
              showCurrencySelect={false}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background shadow-sm">
        <div className="px-4 py-3.5 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">Market data</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Estimated value and last auction share one currency.
            </p>
          </div>
          <AdminSelectField
            label="Currency (both prices)"
            value={marketCurrency}
            onChange={(v) => patchMarketData({ currency: v })}
            options={[
              { value: "EUR", label: "EUR (€)" },
              { value: "USD", label: "USD ($)" },
              { value: "KRW", label: "KRW (₩)" },
            ]}
            compact={compact}
            className="sm:w-48"
          />
        </div>
        <div className="px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminAmountWithCurrency
              label="Estimated value"
              amount={form.marketData.estimatedValue}
              currency={marketCurrency}
              onAmountChange={(v) => patchMarketData({ estimatedValue: v })}
              onCurrencyChange={(v) => patchMarketData({ currency: v })}
              krwPerUsd={krwPerUsd}
              compact={compact}
              showCurrencySelect={false}
            />
            <AdminAmountWithCurrency
              label="Last auction price"
              amount={form.marketData.lastAuctionPrice}
              currency={marketCurrency}
              onAmountChange={(v) => patchMarketData({ lastAuctionPrice: v })}
              onCurrencyChange={(v) => patchMarketData({ currency: v })}
              krwPerUsd={krwPerUsd}
              compact={compact}
              showCurrencySelect={false}
            />
            <AdminDateField
              label="Last auction date"
              value={form.marketData.lastAuctionDate}
              onChange={(v) => patchMarketData({ lastAuctionDate: v })}
              compact={compact}
            />
          </div>
        </div>
      </div>
    </div>
  );
}