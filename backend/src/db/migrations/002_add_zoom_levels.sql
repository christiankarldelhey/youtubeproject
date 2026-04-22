ALTER TABLE travel_videos ADD COLUMN zoom_levels INTEGER[];

CREATE INDEX IF NOT EXISTS travel_videos_zoom_levels_idx 
  ON travel_videos USING GIN(zoom_levels);
