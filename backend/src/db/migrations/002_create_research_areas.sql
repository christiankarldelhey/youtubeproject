CREATE TABLE IF NOT EXISTS research_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bbox NUMERIC[] NOT NULL,
  zoom_level INTEGER,
  active BOOLEAN DEFAULT true,
  videos TEXT[],
  pois TEXT[],
  travel_type TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS research_areas_active_idx ON research_areas(active);
CREATE INDEX IF NOT EXISTS research_areas_category_idx ON research_areas(category);
