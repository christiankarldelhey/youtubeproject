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

export async function fetchMeteoalarmPreview(limit = 10): Promise<MeteoalarmPreview> {
  return {
    sourceUrl: 'deprecated://meteoalarm',
    fetchedAt: new Date().toISOString(),
    totalEntries: 0,
    entries: [],
  };
}
