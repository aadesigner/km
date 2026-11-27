/**
 * Client-side cleanup for cached VHR history rows that stored raw API field dumps
 * (e.g. "3 · amount · insurance_amount · 607만원 · painting · …").
 */

const DUMP_FIELD_KEYS = new Set([
  "amount",
  "component",
  "insurance_amount",
  "insurance_money",
  "painting",
  "repair_estimate_amount",
  "reserve_amount",
  "repair_estimate",
  "wage",
]);

const EVENT_TITLE_MAP: Record<string, string> = {
  other_car_accident_list: "Other vehicle accident",
  my_car_accident_list: "Own vehicle accident",
  my_car_current_owner_accident_list: "Accident under current owner",
  owner_change: "Owner change",
  transfer_of_ownership: "Transfer of Ownership",
  registration_change: "Registration change",
  first_registration: "First registration",
  number_change: "Plate / registration change",
  statutory_inspection: "Statutory inspection",
  has_rent_use_record: "Rental use record",
  accident_count: "Accident records",
  has_leakage: "Leakage recorded",
  flood_history: "Water / flood damage",
  total_loss_history: "Total loss",
  rental_use_history: "Rental",
  business_use_history: "Business",
  government_use_history: "Government",
  special_usage_history: "Special usage",
  special_use_history: "Special usage",
};

const DETAIL_FIELD_LABELS: Record<string, string> = {
  amount: "Claim count",
  component: "Components",
  insurance_amount: "Insurance payout",
  insurance_money: "Insurance payout involved",
  painting: "Paint work",
  repair_estimate_amount: "Repair estimate amount",
  reserve_amount: "Reserve amount",
  repair_estimate: "Repair estimate",
  wage: "Labor",
  usage: "Usage",
  seq: "Owner #",
  type: "Event type",
  body: "Body type",
};

const AUCTION_NOISE_LABELS = new Set([
  "bids_count",
  "bid_count",
  "bids",
  "bid",
  "opening_bid",
  "buy_now",
  "buy_now_price",
  "lot",
  "lot_number",
  "lot_id",
  "auction_id",
  "auction_name",
  "auction_at",
  "final_price",
  "sale_price",
  "marketplace",
]);

function normalizeEventKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s*\+\s*/g, "+")
    .replace(/[\s-]+/g, "_");
}

function mapEventKey(key: string): string | null {
  if (!key) return null;
  if (key.includes("+")) {
    const parts = key.split("+").map((p) => p.trim()).filter(Boolean);
    const titles = parts.map((p) => EVENT_TITLE_MAP[p] ?? null).filter((t): t is string => !!t);
    if (titles.length) return [...new Set(titles)].join(" + ");
    return null;
  }
  return EVENT_TITLE_MAP[key] ?? null;
}

export function looksLikeHistoryFieldDump(text: string | null | undefined): boolean {
  if (!text) return false;
  return /insurance_amount|repair_estimate_amount|reserve_amount/.test(text)
    || (text.includes("·") && /\b(amount|painting|wage|component|insurance_money)\b/i.test(text));
}

function humanizeSnakeTitle(raw: string): string {
  const key = normalizeEventKey(raw);
  const mapped = mapEventKey(key);
  if (mapped) return mapped;
  if (/^[a-z0-9_+]+$/i.test(raw.trim()) && /[_+]/.test(raw)) {
    return raw
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return raw;
}

function formatManwonPayout(raw: string): string {
  const manwon = raw.replace(/,/g, "").match(/([\d.]+)\s*만\s*원/i);
  if (manwon) {
    const krw = Math.round(Number(manwon[1]) * 10_000);
    if (Number.isFinite(krw) && krw > 0) {
      return `${krw.toLocaleString()} KRW`;
    }
  }
  const mil = raw.replace(/,/g, "").match(/([\d.]+)\s*million\s+won/i);
  if (mil) {
    const krw = Math.round(Number(mil[1]) * 1_000_000);
    if (Number.isFinite(krw) && krw > 0) {
      return `${krw.toLocaleString()} KRW`;
    }
  }
  return raw;
}

/** Rewrite cached dump subtitles into a short human summary. */
export function reformatHistoryFieldDump(text: string): string {
  const tokens = text.split(/\s*·\s*/).map((t) => t.trim()).filter(Boolean);
  let claimCount: string | null = null;
  let payout: string | null = null;
  let paint: boolean | null = null;
  let insured: boolean | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const key = t.toLowerCase().replace(/\s+/g, "_");
    const next = tokens[i + 1];
    const nextKey = next?.toLowerCase().replace(/\s+/g, "_") ?? "";
    const isNextField = DUMP_FIELD_KEYS.has(nextKey) || nextKey === "";

    // Leading bare count: "3 · amount · …"
    if (i === 0 && /^\d+$/.test(t) && (nextKey === "amount" || DUMP_FIELD_KEYS.has(nextKey))) {
      claimCount = t;
      continue;
    }

    if (key === "amount" && next && /^\d+$/.test(next) && !DUMP_FIELD_KEYS.has(nextKey)) {
      claimCount = next;
      i += 1;
      continue;
    }

    if (
      (key === "insurance_amount" || key === "repair_estimate_amount" || key === "reserve_amount")
      && next
      && !DUMP_FIELD_KEYS.has(nextKey)
      && !/^(true|false|yes|no|painted)$/i.test(next)
    ) {
      payout = next;
      i += 1;
      continue;
    }

    if (/만원|million\s+won|\bKRW\b|₩/i.test(t) && !DUMP_FIELD_KEYS.has(key)) {
      payout = t;
      continue;
    }

    if (key === "insurance_money") {
      if (next && /^(true|false|yes|no)$/i.test(next) && !isNextField) {
        insured = /^(true|yes)$/i.test(next);
        i += 1;
      }
      continue;
    }

    if (key === "painting") {
      if (next && /^(true|false|yes|no|painted)$/i.test(next)) {
        paint = /^(true|yes|painted)$/i.test(next);
        i += 1;
      }
      continue;
    }

    if (/^painted$/i.test(t)) {
      paint = true;
    }
  }

  // Pattern: … · false · true · painting · …  (bools immediately before painting key)
  const paintIdx = tokens.findIndex((tok) => /^painting$/i.test(tok));
  if (paintIdx > 0 && paint == null) {
    for (let j = paintIdx - 1; j >= 0; j--) {
      const tok = tokens[j]!;
      if (/^(true|false|yes|no)$/i.test(tok)) {
        paint = /^(true|yes)$/i.test(tok);
        break;
      }
      if (DUMP_FIELD_KEYS.has(tok.toLowerCase().replace(/\s+/g, "_"))) break;
    }
  }

  // Pattern: insurance_money · false · true · painting → insured=false, paint=true
  const moneyIdx = tokens.findIndex((tok) => /^insurance_money$/i.test(tok));
  if (moneyIdx >= 0 && insured == null) {
    const after = tokens[moneyIdx + 1];
    if (after && /^(true|false|yes|no)$/i.test(after)) {
      insured = /^(true|yes)$/i.test(after);
    }
  }

  const bits: string[] = [];
  if (payout) bits.push(`Insurance payout: ${formatManwonPayout(payout)}`);
  if (paint === true) bits.push("Paint work");
  if (insured === true) bits.push("Insurance involved");
  if (claimCount) bits.push(`${claimCount} claim${claimCount === "1" ? "" : "s"}`);

  return bits.join(" · ") || "Accident record";
}

export function sanitizeHistoryEventTitle(title: string | null | undefined): string | null {
  if (!title?.trim()) return null;
  const cleaned = title.replace(/\n/g, " ").trim();
  const head = cleaned.split(/\s+[—-]\s+/)[0]?.trim() || cleaned;
  if (looksLikeHistoryFieldDump(head)) {
    return "Accident record";
  }
  const mapped = mapEventKey(normalizeEventKey(head));
  if (mapped) return mapped;
  return humanizeSnakeTitle(head);
}

export function sanitizeHistoryEventSubtitle(
  subtitle: string | null | undefined,
  eventTitle?: string | null,
): string | null {
  if (!subtitle?.trim()) return null;
  let cleaned = subtitle.replace(/\n/g, " ").trim();
  if (looksLikeHistoryFieldDump(cleaned)) return reformatHistoryFieldDump(cleaned);

  // Drop auction noise tokens from cached subtitles.
  cleaned = cleaned
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter((part) => {
      const key = normalizeEventKey(part.replace(/:.*$/, ""));
      if (AUCTION_NOISE_LABELS.has(key) || /^bids?\s*count$/i.test(part)) return false;
      if (/^bids?\s*count\s*:/i.test(part)) return false;
      return true;
    })
    .join(" · ");

  // Owner change often stored as "1 · Owner change" — strip ordinal + title echo.
  if (eventTitle) {
    const titleNorm = eventTitle.toLowerCase().replace(/[\s_-]+/g, "");
    const parts = cleaned.split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
    const filtered = parts.filter((p) => {
      if (/^\d+$/.test(p)) return false;
      const pNorm = p.toLowerCase().replace(/[\s_-]+/g, "");
      if (pNorm === titleNorm) return false;
      if (/^owner\s*change$/i.test(p) || /^transfer\s*of\s*ownership$/i.test(p)) return false;
      return true;
    });
    cleaned = filtered.join(" · ");
  }

  return cleaned || null;
}

export function sanitizeHistoryEventDescription(description: string | null | undefined): string | null {
  if (!description?.trim()) return null;
  const cleaned = description.replace(/\n/g, " ").trim();
  if (looksLikeHistoryFieldDump(cleaned)) {
    const parts = cleaned.split(/\s+[—-]\s+/);
    if (parts.length >= 2 && looksLikeHistoryFieldDump(parts.slice(1).join(" — "))) {
      const title = sanitizeHistoryEventTitle(parts[0]) ?? parts[0]!;
      const body = reformatHistoryFieldDump(parts.slice(1).join(" — "));
      return `${title}: ${body}`;
    }
    return reformatHistoryFieldDump(cleaned);
  }
  const mapped = mapEventKey(normalizeEventKey(cleaned));
  if (mapped) return mapped;
  if (/^[a-z0-9_+]+$/i.test(cleaned) && /accident|owner|registration|leakage|rent/i.test(cleaned)) {
    return humanizeSnakeTitle(cleaned);
  }
  return cleaned;
}

/** Extra row labels like has_rent_use_record / accident_count on cached reports. */
export function sanitizeVehicleExtraLabel(label: string | null | undefined): string | null {
  if (!label?.trim()) return null;
  const key = normalizeEventKey(label);
  if (EVENT_TITLE_MAP[key]) return EVENT_TITLE_MAP[key];
  if (/^[a-z0-9_]+$/.test(key) && key.includes("_")) {
    return humanizeSnakeTitle(key);
  }
  return label.trim();
}

/** True when a registry detail row is useless noise (Detail 1, Bids count, …). */
export function isNoiseRegistryDetailLabel(label: string | null | undefined): boolean {
  if (!label?.trim()) return true;
  const key = normalizeEventKey(label);
  if (/^detail(_?\d+)?$/.test(key) || key === "details" || key === "value") return true;
  if (AUCTION_NOISE_LABELS.has(key)) return true;
  if (/^bids?\s*count$/i.test(label.trim())) return true;
  return false;
}

/** Humanize registry detail labels; returns null when the row should be dropped. */
export function sanitizeRegistryDetailLabel(label: string | null | undefined): string | null {
  if (!label?.trim()) return null;
  if (isNoiseRegistryDetailLabel(label)) return null;
  const key = normalizeEventKey(label);
  if (DETAIL_FIELD_LABELS[key]) return DETAIL_FIELD_LABELS[key];
  if (EVENT_TITLE_MAP[key]) return EVENT_TITLE_MAP[key];
  if (/^[a-z0-9_]+$/.test(key) && key.includes("_")) {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return label.trim();
}
