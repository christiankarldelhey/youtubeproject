import type { AlertRecord } from '../db/repositories/alerts.repository.js';
import type { MeteoalarmPreview } from '../providers/meteoalarm/client.js';

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

export async function getMeteoalarmPreview(_rawLimit?: unknown): Promise<MeteoalarmPreview> {
  return {
    sourceUrl: 'deprecated://meteoalarm',
    fetchedAt: new Date().toISOString(),
    totalEntries: 0,
    entries: [],
  };
}

export async function ingestMeteoalarmAlerts(_rawLimit?: unknown): Promise<IngestAlertsSummary> {
  return {
    provider: 'meteoalarm',
    requestedLimit: 0,
    received: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    processedAt: new Date().toISOString(),
    changedAlerts: [],
  };
}
