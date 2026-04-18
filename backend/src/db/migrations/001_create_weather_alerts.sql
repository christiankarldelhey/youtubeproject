CREATE TABLE IF NOT EXISTS weather_alerts (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at_source TIMESTAMPTZ,
  link TEXT,
  country_code TEXT,
  severity TEXT,
  payload_raw JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weather_alerts_provider_external_id_uniq UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS weather_alerts_updated_at_source_idx
  ON weather_alerts (updated_at_source DESC);

CREATE INDEX IF NOT EXISTS weather_alerts_provider_idx
  ON weather_alerts (provider);
