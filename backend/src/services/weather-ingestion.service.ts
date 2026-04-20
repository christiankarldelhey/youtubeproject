import {
  listCityWeatherCurrent,
  type CityWeatherRecord,
  upsertCityWeather,
} from '../db/repositories/city-weather.repository.js';
import {
  fetchCityCurrentWeather,
  TRACKED_CITIES,
  type OpenMeteoCurrentWeather,
} from '../providers/open-meteo/client.js';

export type IngestCurrentWeatherSummary = {
  requestedCities: number;
  persisted: number;
  published: number;
  publishFailed: number;
  failed: number;
  processedAt: string;
  weather: CityWeatherRecord[];
  errors: Array<{ cityKey: string; message: string }>;
};

function mapToUpsertInput(weather: OpenMeteoCurrentWeather, fetchedAt: string) {
  return {
    cityKey: weather.cityKey,
    cityName: weather.cityName,
    latitude: weather.latitude,
    longitude: weather.longitude,
    temperatureC: weather.temperatureC,
    weatherCode: weather.weatherCode,
    cloudCover: weather.cloudCover,
    observedAtSource: weather.observedAtSource,
    timezone: weather.timezone,
    rawPayload: weather.rawPayload,
    fetchedAt,
  };
}

export async function ingestCurrentWeather(
  publishCurrent?: (record: CityWeatherRecord) => Promise<void>,
): Promise<IngestCurrentWeatherSummary> {
  const fetchedAt = new Date().toISOString();
  const weather: CityWeatherRecord[] = [];
  const errors: Array<{ cityKey: string; message: string }> = [];

  let persisted = 0;
  let published = 0;
  let publishFailed = 0;
  let failed = 0;

  for (const city of TRACKED_CITIES) {
    try {
      const remote = await fetchCityCurrentWeather(city);
      const record = await upsertCityWeather(mapToUpsertInput(remote, fetchedAt));
      persisted += 1;
      weather.push(record);

      if (publishCurrent) {
        try {
          await publishCurrent(record);
          published += 1;
        } catch (error) {
          publishFailed += 1;
          errors.push({
            cityKey: city.key,
            message: error instanceof Error ? error.message : 'Unknown MQTT publish error',
          });
        }
      }
    } catch (error) {
      failed += 1;
      errors.push({
        cityKey: city.key,
        message: error instanceof Error ? error.message : 'Unknown ingestion error',
      });
    }
  }

  return {
    requestedCities: TRACKED_CITIES.length,
    persisted,
    published,
    publishFailed,
    failed,
    processedAt: fetchedAt,
    weather,
    errors,
  };
}

export async function getCurrentWeather(): Promise<CityWeatherRecord[]> {
  return listCityWeatherCurrent();
}
