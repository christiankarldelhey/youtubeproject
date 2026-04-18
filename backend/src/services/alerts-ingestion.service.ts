import {
  type AlertRecord,
  type UpsertAlertInput,
  upsertAlert,
} from '../db/repositories/alerts.repository.js';
import { env } from '../config/env.js';
import {
  fetchMeteoalarmPreview,
  type MeteoalarmPreview,
  type MeteoalarmPreviewEntry,
} from '../providers/meteoalarm/client.js';

export type IngestAlertsSummary = {
  provider: 'meteoalarm';
  requestedLimit: number;
  received: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
  processedAt: string;
  changedAlerts: AlertRecord[];
};

function parseIsoDateOrNull(value: string): string | null {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function inferCountryCode(entry: MeteoalarmPreviewEntry): string | null {
  const match = entry.id.match(/([A-Z]{2})\d*$/);
  return match ? match[1] : null;
}

function inferSeverity(title: string): string | null {
  const value = title.toLowerCase();

  if (value.includes('extreme')) return 'extreme';
  if (value.includes('severe')) return 'severe';
  if (value.includes('moderate')) return 'moderate';
  if (value.includes('minor')) return 'minor';

  return null;
}

function mapPreviewEntryToUpsertInput(entry: MeteoalarmPreviewEntry, fetchedAt: string): UpsertAlertInput {
  return {
    provider: 'meteoalarm',
    externalId: entry.id,
    title: entry.title,
    updatedAtSource: parseIsoDateOrNull(entry.updated),
    link: entry.link,
    countryCode: inferCountryCode(entry),
    severity: inferSeverity(entry.title),
    payloadRaw: entry,
    fetchedAt,
  };
}

function normalizeLimit(rawLimit: unknown): number {
  const parsed = Number(rawLimit ?? env.INGEST_DEFAULT_LIMIT);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return env.INGEST_DEFAULT_LIMIT;
  }

  return Math.min(Math.trunc(parsed), env.INGEST_MAX_LIMIT);
}

function normalizePreviewLimit(rawLimit: unknown): number {
  const parsed = Number(rawLimit ?? 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }

  return Math.min(Math.trunc(parsed), 25);
}

export async function getMeteoalarmPreview(rawLimit?: unknown): Promise<MeteoalarmPreview> {
  const safeLimit = normalizePreviewLimit(rawLimit);
  return fetchMeteoalarmPreview(safeLimit);
}

export async function ingestMeteoalarmAlerts(rawLimit?: unknown): Promise<IngestAlertsSummary> {
  const safeLimit = normalizeLimit(rawLimit);
  const preview = await fetchMeteoalarmPreview(safeLimit);

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  const changedAlerts: AlertRecord[] = [];

  for (const entry of preview.entries) {
    try {
      const outcome = await upsertAlert(mapPreviewEntryToUpsertInput(entry, preview.fetchedAt));

      if (outcome.status === 'inserted') {
        inserted += 1;
        changedAlerts.push(outcome.alert);
      } else if (outcome.status === 'updated') {
        updated += 1;
        changedAlerts.push(outcome.alert);
      } else {
        unchanged += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    provider: 'meteoalarm',
    requestedLimit: safeLimit,
    received: preview.entries.length,
    inserted,
    updated,
    unchanged,
    failed,
    processedAt: new Date().toISOString(),
    changedAlerts,
  };
}
