/** UTC calendar helpers — admin dashboard stats use these consistently. */

export function utcTodayIso(now = new Date()): string {
  return now.toISOString().substring(0, 10);
}

export function utcDateIsoDaysAgo(daysAgo: number, now = new Date()): string {
  const dt = new Date(now);
  dt.setUTCDate(dt.getUTCDate() - daysAgo);
  return dt.toISOString().substring(0, 10);
}

export function utcMonthStartIso(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function utcPrevMonthStartIso(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().substring(0, 10);
}

/** Normalize PG date / timestamp to YYYY-MM-DD (UTC). */
export function normalizeDayKey(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().substring(0, 10);
  const s = String(value);
  return s.substring(0, 10);
}

export type DailyCountRow = { date: string; count: number };
export type DailyRevenueRow = { date: string; revenue: number };

export function normalizeDailyCounts(rows: Array<{ date: unknown; count: unknown }>): DailyCountRow[] {
  return rows.map((row) => ({
    date: normalizeDayKey(row.date),
    count: Number(row.count ?? 0),
  }));
}

export function normalizeDailyRevenue(rows: Array<{ date: unknown; revenue: unknown }>): DailyRevenueRow[] {
  return rows.map((row) => ({
    date: normalizeDayKey(row.date),
    revenue: Number(row.revenue ?? 0),
  }));
}

export type RecentPaymentRow = {
  id: number;
  user_id: string;
  vin: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  email: string | null;
  name: string | null;
};

export function normalizeRecentPayments(rows: Array<Record<string, unknown>>): RecentPaymentRow[] {
  return rows.map((row) => ({
    id: Number(row.id),
    user_id: String(row.user_id ?? ""),
    vin: row.vin != null ? String(row.vin) : null,
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "EUR"),
    status: String(row.status ?? ""),
    created_at: String(row.created_at ?? ""),
    email: row.email != null ? String(row.email) : null,
    name: row.name != null ? String(row.name) : null,
  }));
}

export function normalizePaymentStatusCounts(
  rows: Array<{ status: unknown; count: unknown }>,
): Array<{ status: string; count: number }> {
  return rows.map((row) => ({
    status: String(row.status ?? "unknown"),
    count: Number(row.count ?? 0),
  }));
}

export function sliceSeriesFrom<T extends { date: string }>(rows: T[], fromIsoInclusive: string): T[] {
  return rows.filter((r) => r.date >= fromIsoInclusive);
}

export function sumDailyCounts(rows: DailyCountRow[], fromIso: string, toIsoExclusive?: string): number {
  let total = 0;
  for (const row of rows) {
    if (row.date < fromIso) continue;
    if (toIsoExclusive && row.date >= toIsoExclusive) continue;
    total += row.count;
  }
  return total;
}

export function sumDailyRevenue(rows: DailyRevenueRow[], fromIso: string, toIsoExclusive?: string): number {
  let total = 0;
  for (const row of rows) {
    if (row.date < fromIso) continue;
    if (toIsoExclusive && row.date >= toIsoExclusive) continue;
    total += row.revenue;
  }
  return total;
}

export function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return Math.round(((current - prev) / prev) * 100);
}
