-- ============================================
-- Migration 002: Add category column to youtube_videos
-- ============================================

ALTER TABLE youtube_videos ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Create index on category for filtered queries
CREATE INDEX IF NOT EXISTS idx_videos_category ON youtube_videos(category);

-- Add comment
COMMENT ON COLUMN youtube_videos.category IS 'Search category used when fetching this video (travel, food, hotel, hiking, budget, history)';

SELECT '✅ Migration 002 completed: category column added to youtube_videos' as result;
