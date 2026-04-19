export type WeatherAlert = {
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

export type AlertsResponse = {
  total: number;
  limit: number;
  offset: number;
  provider: string | null;
  alerts: WeatherAlert[];
};
