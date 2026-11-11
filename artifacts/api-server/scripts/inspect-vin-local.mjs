/** Read-only VIN inspection — no provider API calls. */
import { db, vinLookupsTable, vinCatalogTable, paymentsTable } from "@workspace/db";
import { eq, desc, inArray, sql } from "drizzle-orm";

const vin = String(process.argv[2] ?? "").trim().toUpperCase();
if (!vin) {
  console.error("Usage: tsx --import ./load-env.mjs scripts/inspect-vin-local.mjs <VIN>");
  process.exit(1);
}

const lookups = await db
  .select({
    id: vinLookupsTable.id,
    status: vinLookupsTable.status,
    provider: vinLookupsTable.providerName,
    paymentId: vinLookupsTable.paymentId,
    fromCache: vinLookupsTable.fromCache,
    updatedAt: vinLookupsTable.updatedAt,
    hasData: sql`data is not null`,
    dataSource: sql`data->>'dataSource'`,
    hasHtml: sql`coalesce(data->'pdfReport'->>'htmlUrl','') <> ''`,
  })
  .from(vinLookupsTable)
  .where(eq(vinLookupsTable.vin, vin))
  .orderBy(desc(vinLookupsTable.id))
  .limit(20);

const catalog = await db
  .select({
    id: vinCatalogTable.id,
    provider: vinCatalogTable.providerName,
    updatedAt: vinCatalogTable.updatedAt,
    dataSource: sql`data->>'dataSource'`,
    hasPdfReport: sql`data->'pdfReport' is not null`,
    htmlUrl: sql`left(coalesce(data->'pdfReport'->>'htmlUrl',''), 80)`,
    reportType: sql`data->'pdfReport'->>'type'`,
  })
  .from(vinCatalogTable)
  .where(eq(vinCatalogTable.vin, vin))
  .limit(5);

const payIds = [...new Set(lookups.map((l) => l.paymentId).filter((id) => typeof id === "number"))];
const payments = payIds.length
  ? await db
      .select({
        id: paymentsTable.id,
        status: paymentsTable.status,
        amount: paymentsTable.amount,
        kind: paymentsTable.kind,
        updatedAt: paymentsTable.updatedAt,
      })
      .from(paymentsTable)
      .where(inArray(paymentsTable.id, payIds))
  : [];

console.log(JSON.stringify({ vin, lookups, catalog, payments }, null, 2));
process.exit(0);
