export type CityWeatherCurrent = {
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

export type WeatherCurrentResponse = {
  total: number;
  weather: CityWeatherCurrent[];
};
