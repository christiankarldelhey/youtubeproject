import { env } from '../../config/env.js';

export type TrackedCity = {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type OpenMeteoCurrentWeather = {
  cityKey: string;
  cityName: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  weatherCode: number;
  cloudCover: number;
  observedAtSource: string | null;
  timezone: string;
  rawPayload: unknown;
};

type OpenMeteoResponse = {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
    cloud_cover?: number;
  };
};

export const TRACKED_CITIES: TrackedCity[] = [
  { key: 'madrid', name: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
  { key: 'barcelona', name: 'Barcelona', latitude: 41.39, longitude: 2.17 },
  { key: 'buenos-aires', name: 'Buenos Aires', latitude: -34.6132, longitude: -58.3772 },
  { key: 'bahia-blanca', name: 'Bahia Blanca', latitude: -38.7196, longitude: -62.2724 },
  { key: 'edinburgh', name: 'Edinburgh', latitude: 55.9533, longitude: -3.1883 },
];

function parseObservedAt(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function assertFiniteNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid Open-Meteo response field: ${fieldName}`);
  }

  return value;
}

function assertFiniteInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`Invalid Open-Meteo response field: ${fieldName}`);
  }

  return value;
}

export async function fetchCityCurrentWeather(city: TrackedCity): Promise<OpenMeteoCurrentWeather> {
  const url = new URL('/v1/forecast', env.OPEN_METEO_BASE_URL);
  url.searchParams.set('latitude', String(city.latitude));
  url.searchParams.set('longitude', String(city.longitude));
  url.searchParams.set('current', 'temperature_2m,weather_code,cloud_cover');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed for ${city.key} with status ${response.status}`);
  }

  const parsed = (await response.json()) as OpenMeteoResponse;
  const current = parsed.current;

  if (!current) {
    throw new Error(`Open-Meteo response missing current weather for ${city.key}`);
  }

  return {
    cityKey: city.key,
    cityName: city.name,
    latitude: assertFiniteNumber(parsed.latitude, 'latitude'),
    longitude: assertFiniteNumber(parsed.longitude, 'longitude'),
    temperatureC: assertFiniteNumber(current.temperature_2m, 'current.temperature_2m'),
    weatherCode: assertFiniteInteger(current.weather_code, 'current.weather_code'),
    cloudCover: assertFiniteInteger(current.cloud_cover, 'current.cloud_cover'),
    observedAtSource: parseObservedAt(current.time),
    timezone: typeof parsed.timezone === 'string' && parsed.timezone.length > 0 ? parsed.timezone : 'UTC',
    rawPayload: parsed,
  };
}
