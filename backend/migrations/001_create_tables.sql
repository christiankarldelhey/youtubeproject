-- ============================================
-- Migration 001: Create Main Tables
-- ============================================

-- Enable PostGIS (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Table: youtube_videos
-- ============================================
CREATE TABLE IF NOT EXISTS youtube_videos (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  channel_name VARCHAR(255),
  published_at TIMESTAMP,
  view_count INTEGER,
  location_description TEXT,
  geom GEOMETRY(POINT, 4326) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_videos_geom ON youtube_videos USING GIST(geom);

-- Create regular indexes
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON youtube_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON youtube_videos(created_at DESC);

-- Add comments
COMMENT ON TABLE youtube_videos IS 'YouTube videos with geolocation data';
COMMENT ON COLUMN youtube_videos.geom IS 'Point geometry in EPSG:4326 (WGS84)';
COMMENT ON COLUMN youtube_videos.video_id IS 'YouTube video ID (unique identifier)';

-- ============================================
-- Table: osm_pois (Points of Interest from OpenStreetMap)
-- ============================================
CREATE TABLE IF NOT EXISTS osm_pois (
  id SERIAL PRIMARY KEY,
  osm_id BIGINT UNIQUE NOT NULL,
  osm_type VARCHAR(10) NOT NULL,
  name TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  tags JSONB,
  geom GEOMETRY(POINT, 4326) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_pois_geom ON osm_pois USING GIST(geom);

-- Create regular indexes
CREATE INDEX IF NOT EXISTS idx_pois_category ON osm_pois(category);
CREATE INDEX IF NOT EXISTS idx_pois_osm_id ON osm_pois(osm_id);

-- Create JSONB index for tags
CREATE INDEX IF NOT EXISTS idx_pois_tags ON osm_pois USING GIN(tags);

-- Add comments
COMMENT ON TABLE osm_pois IS 'Points of Interest from OpenStreetMap';
COMMENT ON COLUMN osm_pois.geom IS 'Point geometry in EPSG:4326 (WGS84)';
COMMENT ON COLUMN osm_pois.tags IS 'OSM tags as JSONB for flexible querying';
COMMENT ON COLUMN osm_pois.category IS 'Main category: tourism, amenity, natural, leisure';

-- ============================================
-- Table: users (for favorites and auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- ============================================
-- Table: user_favorites
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER REFERENCES youtube_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_video_id ON user_favorites(video_id);

-- ============================================
-- Insert sample data for testing
-- ============================================

-- Sample videos (Spanish cities)
INSERT INTO youtube_videos (video_id, title, description, channel_name, location_description, geom)
VALUES 
  ('sample001', 'Exploring Oviedo - Hidden Gems', 'Discover the beautiful city of Oviedo in Asturias', 'Travel Channel', 'Oviedo, Asturias, Spain', ST_SetSRID(ST_MakePoint(-5.8447, 43.3614), 4326)),
  ('sample002', 'Gijón Beaches Tour', 'Best beaches in Gijón', 'Beach Lovers', 'Gijón, Asturias, Spain', ST_SetSRID(ST_MakePoint(-5.6615, 43.5322), 4326)),
  ('sample003', 'Madrid City Guide', 'Complete guide to Madrid', 'City Guides', 'Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326))
ON CONFLICT (video_id) DO NOTHING;

-- Sample OSM POIs
INSERT INTO osm_pois (osm_id, osm_type, name, category, subcategory, tags, geom)
VALUES
  (1001, 'node', 'Catedral de Oviedo', 'tourism', 'attraction', '{"tourism": "attraction", "historic": "cathedral"}', ST_SetSRID(ST_MakePoint(-5.8433, 43.3625), 4326)),
  (1002, 'node', 'Playa de San Lorenzo', 'natural', 'beach', '{"natural": "beach"}', ST_SetSRID(ST_MakePoint(-5.6625, 43.5400), 4326)),
  (1003, 'node', 'Museo del Prado', 'tourism', 'museum', '{"tourism": "museum"}', ST_SetSRID(ST_MakePoint(-3.6922, 40.4138), 4326))
ON CONFLICT (osm_id) DO NOTHING;

-- ============================================
-- Verification queries
-- ============================================

-- Count records
SELECT 'Videos created:' as info, COUNT(*) as count FROM youtube_videos;
SELECT 'POIs created:' as info, COUNT(*) as count FROM osm_pois;

-- Test spatial query: videos within 50km of Oviedo
SELECT 
  'Videos within 50km of Oviedo:' as test,
  COUNT(*) as count
FROM youtube_videos
WHERE ST_DWithin(
  geom::geography,
  ST_SetSRID(ST_MakePoint(-5.8447, 43.3614), 4326)::geography,
  50000
);

-- Verify indexes
SELECT 
  'Spatial indexes:' as info,
  tablename,
  indexname
FROM pg_indexes
WHERE indexdef LIKE '%GIST%'
  AND tablename IN ('youtube_videos', 'osm_pois');

SELECT '✅ Migration 001 completed successfully!' as result;
