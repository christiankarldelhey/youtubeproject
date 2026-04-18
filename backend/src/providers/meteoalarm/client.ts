import { XMLParser } from 'fast-xml-parser';
import { env } from '../../config/env.js';

type FeedEntry = {
  id?: unknown;
  title?: unknown;
  updated?: unknown;
  link?: unknown;
};

export type MeteoalarmPreviewEntry = {
  id: string;
  title: string;
  updated: string;
  link: string | null;
};

export type MeteoalarmPreview = {
  sourceUrl: string;
  fetchedAt: string;
  totalEntries: number;
  entries: MeteoalarmPreviewEntry[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  trimValues: true,
});

function readText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'object' && value !== null) {
    const maybeText = (value as Record<string, unknown>)['#text'];

    if (typeof maybeText === 'string') {
      return maybeText;
    }
  }

  return '';
}

function readLink(link: unknown): string | null {
  if (Array.isArray(link)) {
    for (const candidate of link) {
      const href = readLink(candidate);

      if (href) {
        return href;
      }
    }

    return null;
  }

  if (typeof link === 'object' && link !== null) {
    const href = (link as Record<string, unknown>).href;

    if (typeof href === 'string' && href.length > 0) {
      return href;
    }
  }

  if (typeof link === 'string' && link.length > 0) {
    return link;
  }

  return null;
}

function normalizeEntry(entry: FeedEntry): MeteoalarmPreviewEntry {
  return {
    id: readText(entry.id),
    title: readText(entry.title),
    updated: readText(entry.updated),
    link: readLink(entry.link),
  };
}

export async function fetchMeteoalarmPreview(limit = 10): Promise<MeteoalarmPreview> {
  const response = await fetch(env.METEOALARM_FEED_URL, {
    headers: {
      Accept: 'application/atom+xml, application/xml, text/xml',
      'User-Agent': 'weather-alerts-backend/0.1',
    },
  });

  if (!response.ok) {
    throw new Error(`Meteoalarm request failed with status ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    feed?: {
      entry?: FeedEntry | FeedEntry[];
    };
  };

  const rawEntries = parsed.feed?.entry;
  const entriesArray = Array.isArray(rawEntries)
    ? rawEntries
    : rawEntries
      ? [rawEntries]
      : [];

  const normalized = entriesArray.slice(0, limit).map((entry) => normalizeEntry(entry));

  return {
    sourceUrl: env.METEOALARM_FEED_URL,
    fetchedAt: new Date().toISOString(),
    totalEntries: entriesArray.length,
    entries: normalized,
  };
}
