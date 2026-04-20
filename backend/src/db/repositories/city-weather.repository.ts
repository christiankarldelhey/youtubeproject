import { pool } from '../pool.js';

export type CityWeatherRecord = {
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
  fetchedAt: string;
  updatedAt: string;
};

export type UpsertCityWeatherInput = {
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
  fetchedAt: string;
};

type CityWeatherRow = {
  city_key: string;
  city_name: string;
  latitude: number;
  longitude: number;
  temperature_c: number;
  weather_code: number;
  cloud_cover: number;
  observed_at_source: Date | string | null;
  timezone: string;
  raw_payload: unknown;
  fetched_at: Date | string;
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

function mapRow(row: CityWeatherRow): CityWeatherRecord {
  return {
    cityKey: row.city_key,
    cityName: row.city_name,
    latitude: row.latitude,
    longitude: row.longitude,
    temperatureC: row.temperature_c,
    weatherCode: row.weather_code,
    cloudCover: row.cloud_cover,
    observedAtSource: toIso(row.observed_at_source),
    timezone: row.timezone,
    rawPayload: row.raw_payload,
    fetchedAt: toIso(row.fetched_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function upsertCityWeather(input: UpsertCityWeatherInput): Promise<CityWeatherRecord> {
  const result = await pool.query<CityWeatherRow>(
    `
      INSERT INTO city_weather_current (
        city_key,
        city_name,
        latitude,
        longitude,
        temperature_c,
        weather_code,
        cloud_cover,
        observed_at_source,
        timezone,
        raw_payload,
        fetched_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (city_key)
      DO UPDATE SET
        city_name = EXCLUDED.city_name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        temperature_c = EXCLUDED.temperature_c,
        weather_code = EXCLUDED.weather_code,
        cloud_cover = EXCLUDED.cloud_cover,
        observed_at_source = EXCLUDED.observed_at_source,
        timezone = EXCLUDED.timezone,
        raw_payload = EXCLUDED.raw_payload,
        fetched_at = EXCLUDED.fetched_at,
        updated_at = NOW()
      RETURNING *
    `,
    [
      input.cityKey,
      input.cityName,
      input.latitude,
      input.longitude,
      input.temperatureC,
      input.weatherCode,
      input.cloudCover,
      input.observedAtSource,
      input.timezone,
      input.rawPayload,
      input.fetchedAt,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function listCityWeatherCurrent(): Promise<CityWeatherRecord[]> {
  const result = await pool.query<CityWeatherRow>(
    `
      SELECT *
      FROM city_weather_current
      ORDER BY city_name ASC
    `,
  );

  return result.rows.map(mapRow);
}
