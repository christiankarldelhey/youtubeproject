CREATE TABLE IF NOT EXISTS travel_videos (
  video_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  topic_yt_categories TEXT[],
  category TEXT,
  view_count INTEGER,
  like_count INTEGER,
  published_at TIMESTAMPTZ,
  thumbnail TEXT,
  research_area TEXT,
  zoom_levels INTEGER[],
  geom GEOMETRY(Point, 4326),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS travel_videos_geom_idx ON travel_videos USING GIST(geom);
CREATE INDEX IF NOT EXISTS travel_videos_category_idx ON travel_videos(category);
CREATE INDEX IF NOT EXISTS travel_videos_published_idx ON travel_videos(published_at DESC);
