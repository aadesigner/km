import { sql } from "drizzle-orm";
import { vinLookupsTable } from "@workspace/db";

/**
 * Project a compact `data` jsonb for list/history endpoints.
 * Keeps the same top-level keys the UI/summary helpers read, but truncates
 * heavy arrays (photos / histories) in Postgres so we never ship multi-MB
 * report blobs on paginated lists. Detail/report routes still SELECT full rows.
 */
export const vinLookupListDataSql = sql<Record<string, unknown> | null>`
  CASE
    WHEN ${vinLookupsTable.data} IS NULL THEN NULL
    ELSE jsonb_strip_nulls(jsonb_build_object(
      'make', ${vinLookupsTable.data}->'make',
      'model', ${vinLookupsTable.data}->'model',
      'year', ${vinLookupsTable.data}->'year',
      'odometer', ${vinLookupsTable.data}->'odometer',
      'odometerLocked', ${vinLookupsTable.data}->'odometerLocked',
      'accidentCount', ${vinLookupsTable.data}->'accidentCount',
      'isSalvage', ${vinLookupsTable.data}->'isSalvage',
      'thumbnailUrl', ${vinLookupsTable.data}->'thumbnailUrl',
      'photos', CASE
        WHEN jsonb_typeof(${vinLookupsTable.data}->'photos') = 'array' THEN (
          SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
          FROM (
            SELECT value AS e
            FROM jsonb_array_elements(${vinLookupsTable.data}->'photos') WITH ORDINALITY AS t(value, ord)
            WHERE ord <= 1
          ) s
        )
        ELSE '[]'::jsonb
      END,
      'mileageHistory', CASE
        WHEN jsonb_typeof(${vinLookupsTable.data}->'mileageHistory') = 'array' THEN (
          SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
          FROM (
            SELECT value AS e
            FROM jsonb_array_elements(${vinLookupsTable.data}->'mileageHistory') WITH ORDINALITY AS t(value, ord)
            WHERE ord <= 20
          ) s
        )
        ELSE NULL
      END,
      'ownerHistory', CASE
        WHEN jsonb_typeof(${vinLookupsTable.data}->'ownerHistory') = 'array' THEN (
          SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
          FROM (
            SELECT value AS e
            FROM jsonb_array_elements(${vinLookupsTable.data}->'ownerHistory') WITH ORDINALITY AS t(value, ord)
            WHERE ord <= 20
          ) s
        )
        ELSE NULL
      END,
      'registryHistory', CASE
        WHEN jsonb_typeof(${vinLookupsTable.data}->'registryHistory') = 'array' THEN (
          SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
          FROM (
            SELECT value AS e
            FROM jsonb_array_elements(${vinLookupsTable.data}->'registryHistory') WITH ORDINALITY AS t(value, ord)
            WHERE ord <= 40
          ) s
        )
        ELSE NULL
      END,
      'accidents', CASE
        WHEN jsonb_typeof(${vinLookupsTable.data}->'accidents') = 'array' THEN (
          SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
          FROM (
            SELECT value AS e
            FROM jsonb_array_elements(${vinLookupsTable.data}->'accidents') WITH ORDINALITY AS t(value, ord)
            WHERE ord <= 40
          ) s
        )
        ELSE NULL
      END,
      'insuranceClaims', CASE
        WHEN jsonb_typeof(${vinLookupsTable.data}->'insuranceClaims') = 'array' THEN (
          SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
          FROM (
            SELECT value AS e
            FROM jsonb_array_elements(${vinLookupsTable.data}->'insuranceClaims') WITH ORDINALITY AS t(value, ord)
            WHERE ord <= 40
          ) s
        )
        ELSE NULL
      END
    ))
  END
`;

/** Column set for paginated VIN lookup lists (excludes unused heavy blobs). */
export const vinLookupListSelect = {
  id: vinLookupsTable.id,
  vin: vinLookupsTable.vin,
  userId: vinLookupsTable.userId,
  status: vinLookupsTable.status,
  providerName: vinLookupsTable.providerName,
  fromCache: vinLookupsTable.fromCache,
  paymentId: vinLookupsTable.paymentId,
  dataCorrupt: vinLookupsTable.dataCorrupt,
  createdAt: vinLookupsTable.createdAt,
  updatedAt: vinLookupsTable.updatedAt,
  data: vinLookupListDataSql,
};
