import type { ReactNode } from "react";
import { useId } from "react";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ADMIN_MILEAGE_UNITS } from "@/components/admin/admin-vin-form-constants";

export type CatalogAccidentForm = {
  date: string;
  severity: string;
  description: string;
  country: string;
  type: string;
  primaryDamage: string;
  secondaryDamage: string;
  airbagDeployed: "" | "yes" | "no";
  odometerAtLoss: string;
  lossAmount: string;
};

export type CatalogInsuranceClaimForm = {
  date: string;
  type: string;
  lossAmount: string;
  partCost: string;
  laborCost: string;
  paintingCost: string;
  description: string;
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
  date: "", severity: "", description: "", country: "", type: "",
  primaryDamage: "", secondaryDamage: "", airbagDeployed: "",
  odometerAtLoss: "", lossAmount: "",
};

export const EMPTY_INSURANCE_CLAIM: CatalogInsuranceClaimForm = {
  date: "", type: "", lossAmount: "", partCost: "", laborCost: "",
  paintingCost: "", description: "",
};

export const EMPTY_MILEAGE: CatalogMileageForm = {
  date: "", odometer: "", unit: "", source: "", condition: "", damage: "",
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
    return {
      date: str(o.date),
      severity: str(o.severity),
      description: str(o.description),
      country: str(o.country),
      type: str(o.type),
      primaryDamage: str(o.primaryDamage),
      secondaryDamage: str(o.secondaryDamage),
      airbagDeployed: boolFromUnknown(o.airbagDeployed),
      odometerAtLoss: str(o.odometerAtLoss),
      lossAmount: str(o.lossAmount),
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
      unit: str(o.unit),
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
    country: trimOrNull(r.country),
    type: trimOrNull(r.type),
    primaryDamage: trimOrNull(r.primaryDamage),
    secondaryDamage: trimOrNull(r.secondaryDamage),
    odometerAtLoss: numOrNull(r.odometerAtLoss),
    lossAmount: numOrNull(r.lossAmount),
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
  })).filter(Boolean);
  return items;
}

export function mileageHistoryToPayload(rows: CatalogMileageForm[]) {
  const items = rows.map((r) => rowOrNull({
    date: trimOrNull(r.date),
    unit: trimOrNull(r.unit),
    source: trimOrNull(r.source),
    condition: trimOrNull(r.condition),
    damage: trimOrNull(r.damage),
    primaryDamage: trimOrNull(r.primaryDamage),
    secondaryDamage: trimOrNull(r.secondaryDamage),
    titleStatus: trimOrNull(r.titleStatus),
    lotStatus: trimOrNull(r.lotStatus),
    location: trimOrNull(r.location),
    description: trimOrNull(r.description),
    odometer: numOrNull(r.odometer),
    auctionPrice: numOrNull(r.auctionPrice),
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  compact,
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  compact?: boolean;
  suggestions?: string[];
}) {
  const autoListId = useId();
  const listId = suggestions?.length ? autoListId : undefined;
  return (
    <div className="space-y-0.5 min-w-0">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        list={listId}
        className={compact ? "h-8 text-xs" : "h-8 text-sm"}
      />
      {listId && suggestions ? (
        <datalist id={listId}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      ) : null}
    </div>
  );
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
  emptyItem: T;
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

  const isOpen = defaultOpen ?? items.length > 0;

  return (
    <details className="group rounded-xl border bg-muted/10" open={isOpen}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors rounded-xl">
        <div className="min-w-0 flex items-center gap-2">
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {items.length} record{items.length === 1 ? "" : "s"}
        </Badge>
      </summary>
      <div className="px-4 pb-4 space-y-3 border-t">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pt-3">No records — add one below.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="rounded-lg border bg-background p-3 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Record #{index + 1}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => duplicateAt(index)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />Duplicate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Remove
                  </Button>
                </div>
              </div>
              {renderItem(item, index, (patch) => updateAt(index, patch))}
            </div>
          ))
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onChange([...items, { ...emptyItem }])}
        >
          <Plus className="h-3.5 w-3.5" />Add record
        </Button>
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
            <Field label="Label" value={row.label} onChange={(v) => onChange(details.map((d, j) => j === i ? { ...d, label: v } : d))} compact={compact} />
            <Field label="Value" value={row.value} onChange={(v) => onChange(details.map((d, j) => j === i ? { ...d, value: v } : d))} compact={compact} />
          </div>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive"
            onClick={() => onChange(details.filter((_, j) => j !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="h-7 gap-1"
        onClick={() => onChange([...details, { label: "", value: "" }])}>
        <Plus className="h-3 w-3" />Add field
      </Button>
    </div>
  );
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
};

export function VinCatalogHistorySections({
  form,
  onChange,
  compact = false,
}: {
  form: VinCatalogHistoryFormSlice;
  onChange: (patch: Partial<VinCatalogHistoryFormSlice>) => void;
  compact?: boolean;
}) {
  const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Edit history records below. Import/export still uses JSON — these fields save the same structured data.
      </p>

      <CatalogListSection
        title="Accident history"
        hint="Collision and damage records."
        items={form.accidents}
        emptyItem={EMPTY_ACCIDENT}
        onChange={(accidents) => onChange({ accidents })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <Field label="Date" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <Field label="Severity" value={item.severity} onChange={(v) => update({ severity: v })} compact={compact} />
            <Field label="Type" value={item.type} onChange={(v) => update({ type: v })} compact={compact} />
            <Field label="Country" value={item.country} onChange={(v) => update({ country: v })} compact={compact} />
            <Field label="Primary damage" value={item.primaryDamage} onChange={(v) => update({ primaryDamage: v })} compact={compact} />
            <Field label="Secondary damage" value={item.secondaryDamage} onChange={(v) => update({ secondaryDamage: v })} compact={compact} />
            <Field label="Odometer at loss" value={item.odometerAtLoss} onChange={(v) => update({ odometerAtLoss: v })} type="number" compact={compact} />
            <Field label="Loss amount" value={item.lossAmount} onChange={(v) => update({ lossAmount: v })} type="number" compact={compact} />
            <div className="space-y-0.5">
              <label className="text-[11px] font-medium text-muted-foreground">Airbag deployed</label>
              <select
                className="w-full h-8 rounded-md border bg-background px-2 text-xs"
                value={item.airbagDeployed}
                onChange={(e) => update({ airbagDeployed: e.target.value as CatalogAccidentForm["airbagDeployed"] })}
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description" value={item.description} onChange={(v) => update({ description: v })} compact={compact} />
            </div>
          </div>
        )}
      />

      <CatalogListSection
        title="Insurance claims"
        hint="Insurance payout history."
        items={form.insuranceClaims}
        emptyItem={EMPTY_INSURANCE_CLAIM}
        onChange={(insuranceClaims) => onChange({ insuranceClaims })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <Field label="Date" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <Field label="Type" value={item.type} onChange={(v) => update({ type: v })} compact={compact} />
            <Field label="Loss amount" value={item.lossAmount} onChange={(v) => update({ lossAmount: v })} type="number" compact={compact} />
            <Field label="Part cost" value={item.partCost} onChange={(v) => update({ partCost: v })} type="number" compact={compact} />
            <Field label="Labor cost" value={item.laborCost} onChange={(v) => update({ laborCost: v })} type="number" compact={compact} />
            <Field label="Painting cost" value={item.paintingCost} onChange={(v) => update({ paintingCost: v })} type="number" compact={compact} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description" value={item.description} onChange={(v) => update({ description: v })} compact={compact} />
            </div>
          </div>
        )}
      />

      <CatalogListSection
        title="Mileage history"
        hint="Odometer readings. Description and location are manual-only annotations (not filled by provider fetch)."
        items={form.mileageHistory}
        emptyItem={EMPTY_MILEAGE}
        onChange={(mileageHistory) => onChange({ mileageHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <Field label="Date" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <Field label="Odometer" value={item.odometer} onChange={(v) => update({ odometer: v })} type="number" compact={compact} />
            <Field label="Unit" value={item.unit} onChange={(v) => update({ unit: v })} compact={compact} suggestions={ADMIN_MILEAGE_UNITS} />
            <Field label="Source" value={item.source} onChange={(v) => update({ source: v })} compact={compact} />
            <Field label="Condition" value={item.condition} onChange={(v) => update({ condition: v })} compact={compact} />
            <Field label="Damage" value={item.damage} onChange={(v) => update({ damage: v })} compact={compact} />
            <Field label="Primary damage" value={item.primaryDamage} onChange={(v) => update({ primaryDamage: v })} compact={compact} />
            <Field label="Secondary damage" value={item.secondaryDamage} onChange={(v) => update({ secondaryDamage: v })} compact={compact} />
            <Field label="Auction price" value={item.auctionPrice} onChange={(v) => update({ auctionPrice: v })} type="number" compact={compact} />
            <Field label="Title" value={item.titleStatus} onChange={(v) => update({ titleStatus: v })} compact={compact} />
            <Field label="Lot status" value={item.lotStatus} onChange={(v) => update({ lotStatus: v })} compact={compact} />
            <Field label="Location (manual)" value={item.location} onChange={(v) => update({ location: v })} compact={compact} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field
                label="Description"
                value={item.description}
                onChange={(v) => update({ description: v })}
                compact={compact}
              />
            </div>
          </div>
        )}
      />

      <CatalogListSection
        title="Service history (manual only)"
        hint="Admin-entered workshop visits only — never filled by automatic provider fetch. Leave empty to hide on the report."
        items={form.serviceHistory}
        emptyItem={EMPTY_SERVICE}
        onChange={(serviceHistory) => onChange({ serviceHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <Field label="Date (day/month/year)" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <Field label="Mileage (optional)" value={item.mileage} onChange={(v) => update({ mileage: v })} type="number" compact={compact} />
            <Field label="Title (e.g. Service)" value={item.title} onChange={(v) => update({ title: v })} compact={compact} />
            <Field label="Location" value={item.location} onChange={(v) => update({ location: v })} compact={compact} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field
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
            <Field label="Date" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <Field label="Location" value={item.location} onChange={(v) => update({ location: v })} compact={compact} />
            <Field label="Mileage" value={item.mileage} onChange={(v) => update({ mileage: v })} type="number" compact={compact} />
            <Field label="Auction price" value={item.auctionPrice} onChange={(v) => update({ auctionPrice: v })} type="number" compact={compact} />
            <Field label="Lot status" value={item.lotStatus} onChange={(v) => update({ lotStatus: v })} compact={compact} />
            <Field label="Condition" value={item.condition} onChange={(v) => update({ condition: v })} compact={compact} />
          </div>
        )}
      />

      <CatalogListSection
        title="Auction history"
        items={form.auctionHistory}
        emptyItem={EMPTY_AUCTION}
        onChange={(auctionHistory) => onChange({ auctionHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className={grid}>
            <Field label="Date" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
            <Field label="City" value={item.city} onChange={(v) => update({ city: v })} compact={compact} />
            <Field label="State" value={item.state} onChange={(v) => update({ state: v })} compact={compact} />
            <Field label="Country" value={item.country} onChange={(v) => update({ country: v })} compact={compact} />
            <Field label="Final price" value={item.finalPrice} onChange={(v) => update({ finalPrice: v })} type="number" compact={compact} />
            <Field label="Opening bid" value={item.openingBid} onChange={(v) => update({ openingBid: v })} type="number" compact={compact} />
            <Field label="Buy now price" value={item.buyNowPrice} onChange={(v) => update({ buyNowPrice: v })} type="number" compact={compact} />
            <Field label="Condition" value={item.condition} onChange={(v) => update({ condition: v })} compact={compact} />
            <Field label="Damage" value={item.damage} onChange={(v) => update({ damage: v })} compact={compact} />
            <Field label="Primary damage" value={item.primaryDamage} onChange={(v) => update({ primaryDamage: v })} compact={compact} />
            <Field label="Secondary damage" value={item.secondaryDamage} onChange={(v) => update({ secondaryDamage: v })} compact={compact} />
            <Field label="Title status" value={item.titleStatus} onChange={(v) => update({ titleStatus: v })} compact={compact} />
            <Field label="Lot status" value={item.lotStatus} onChange={(v) => update({ lotStatus: v })} compact={compact} />
          </div>
        )}
      />

      <CatalogListSection
        title="Registry history"
        hint="Korean KOTSA / Encar registry timeline."
        items={form.registryHistory}
        emptyItem={EMPTY_REGISTRY}
        onChange={(registryHistory) => onChange({ registryHistory })}
        compact={compact}
        renderItem={(item, _i, update) => (
          <div className="space-y-3">
            <div className={grid}>
              <Field label="Date" value={item.date} onChange={(v) => update({ date: v })} compact={compact} />
              <Field label="Type" value={item.type} onChange={(v) => update({ type: v })} compact={compact} />
              <Field label="Mileage" value={item.mileage} onChange={(v) => update({ mileage: v })} type="number" compact={compact} />
              <Field label="Amount" value={item.amount} onChange={(v) => update({ amount: v })} compact={compact} />
              <Field label="Location" value={item.location} onChange={(v) => update({ location: v })} compact={compact} />
              <Field label="Title" value={item.title} onChange={(v) => update({ title: v })} compact={compact} />
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Subtitle" value={item.subtitle} onChange={(v) => update({ subtitle: v })} compact={compact} />
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

      <details className="rounded-xl border bg-muted/10">
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Market data</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Estimated value and last auction snapshot.</p>
          </div>
        </summary>
        <div className="px-4 pb-4 border-t pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Estimated value" value={form.marketData.estimatedValue} onChange={(v) => onChange({ marketData: { ...form.marketData, estimatedValue: v } })} type="number" compact={compact} />
            <Field label="Currency" value={form.marketData.currency} onChange={(v) => onChange({ marketData: { ...form.marketData, currency: v } })} compact={compact} />
            <Field label="Last auction price" value={form.marketData.lastAuctionPrice} onChange={(v) => onChange({ marketData: { ...form.marketData, lastAuctionPrice: v } })} type="number" compact={compact} />
            <Field label="Last auction date" value={form.marketData.lastAuctionDate} onChange={(v) => onChange({ marketData: { ...form.marketData, lastAuctionDate: v } })} compact={compact} />
          </div>
        </div>
      </details>
    </div>
  );
}
