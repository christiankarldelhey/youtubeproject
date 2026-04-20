CREATE TABLE IF NOT EXISTS city_weather_current (
  city_key TEXT PRIMARY KEY,
  city_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  temperature_c DOUBLE PRECISION NOT NULL,
  weather_code INTEGER NOT NULL,
  cloud_cover INTEGER NOT NULL,
  observed_at_source TIMESTAMPTZ,
  timezone TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS city_weather_current_updated_at_idx
  ON city_weather_current (updated_at DESC);
