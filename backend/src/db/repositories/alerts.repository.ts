import { pool } from '../pool.js';

export type AlertRecord = {
  id: number;
  provider: string;
  externalId: string;
  title: string;
  updatedAtSource: string | null;
  link: string | null;
  countryCode: string | null;
  severity: string | null;
  payloadRaw: unknown;
  fetchedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertAlertInput = {
  provider: string;
  externalId: string;
  title: string;
  updatedAtSource: string | null;
  link: string | null;
  countryCode: string | null;
  severity: string | null;
  payloadRaw: unknown;
  fetchedAt: string;
};

export type UpsertAlertOutcome = {
  status: 'inserted' | 'updated' | 'unchanged';
  alert: AlertRecord;
};

type AlertRow = {
  id: number;
  provider: string;
  external_id: string;
  title: string;
  updated_at_source: Date | string | null;
  link: string | null;
  country_code: string | null;
  severity: string | null;
  payload_raw: unknown;
  fetched_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function mapAlertRow(row: AlertRow): AlertRecord {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.external_id,
    title: row.title,
    updatedAtSource: toIso(row.updated_at_source),
    link: row.link,
    countryCode: row.country_code,
    severity: row.severity,
    payloadRaw: row.payload_raw,
    fetchedAt: toIso(row.fetched_at) ?? new Date().toISOString(),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function upsertAlert(input: UpsertAlertInput): Promise<UpsertAlertOutcome> {
  const result = await pool.query<AlertRow & { inserted: boolean }>(
    `
      INSERT INTO weather_alerts (
        provider,
        external_id,
        title,
        updated_at_source,
        link,
        country_code,
        severity,
        payload_raw,
        fetched_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (provider, external_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        updated_at_source = EXCLUDED.updated_at_source,
        link = EXCLUDED.link,
        country_code = EXCLUDED.country_code,
        severity = EXCLUDED.severity,
        payload_raw = EXCLUDED.payload_raw,
        fetched_at = EXCLUDED.fetched_at,
        updated_at = NOW()
      WHERE weather_alerts.title IS DISTINCT FROM EXCLUDED.title
        OR weather_alerts.updated_at_source IS DISTINCT FROM EXCLUDED.updated_at_source
        OR weather_alerts.link IS DISTINCT FROM EXCLUDED.link
        OR weather_alerts.country_code IS DISTINCT FROM EXCLUDED.country_code
        OR weather_alerts.severity IS DISTINCT FROM EXCLUDED.severity
        OR weather_alerts.payload_raw IS DISTINCT FROM EXCLUDED.payload_raw
      RETURNING *, (xmax = 0) AS inserted
    `,
    [
      input.provider,
      input.externalId,
      input.title,
      input.updatedAtSource,
      input.link,
      input.countryCode,
      input.severity,
      input.payloadRaw,
      input.fetchedAt,
    ],
  );

  if (result.rows.length > 0) {
    const row = result.rows[0];

    return {
      status: row.inserted ? 'inserted' : 'updated',
      alert: mapAlertRow(row),
    };
  }

  const existing = await pool.query<AlertRow>(
    `
      SELECT *
      FROM weather_alerts
      WHERE provider = $1 AND external_id = $2
      LIMIT 1
    `,
    [input.provider, input.externalId],
  );

  if (existing.rows.length === 0) {
    throw new Error('Failed to read alert row after upsert');
  }

  return {
    status: 'unchanged',
    alert: mapAlertRow(existing.rows[0]),
  };
}

export async function listAlerts(options: {
  provider?: string;
  limit: number;
  offset: number;
}): Promise<AlertRecord[]> {
  const result = await pool.query<AlertRow>(
    `
      SELECT *
      FROM weather_alerts
      WHERE ($1::text IS NULL OR provider = $1)
      ORDER BY updated_at_source DESC NULLS LAST, fetched_at DESC
      LIMIT $2 OFFSET $3
    `,
    [options.provider ?? null, options.limit, options.offset],
  );

  return result.rows.map(mapAlertRow);
}

export async function getAlertById(id: number): Promise<AlertRecord | null> {
  const result = await pool.query<AlertRow>(
    `
      SELECT *
      FROM weather_alerts
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAlertRow(result.rows[0]);
}
