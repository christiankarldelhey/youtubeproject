import { pool } from '../pool.js';

export type TravelVideoRecord = {
  videoId: string;
  title: string;
  channel: string;
  description: string | null;
  tags: string[] | null;
  topicYtCategories: string[] | null;
  category: string | null;
  viewCount: number | null;
  likeCount: number | null;
  publishedAt: string | null;
  thumbnail: string | null;
  researchArea: string | null;
  zoomLevels: number[] | null;
  geom: string | null;
  latitude?: number;
  longitude?: number;
  fetchedAt: string;
  updatedAt: string;
};

export type UpsertTravelVideoInput = {
  videoId: string;
  title: string;
  channel: string;
  description: string | null;
  tags: string[] | null;
  topicYtCategories: string[] | null;
  category: string | null;
  viewCount: number | null;
  likeCount: number | null;
  publishedAt: string | null;
  thumbnail: string | null;
  researchArea: string | null;
  zoomLevels?: number[] | null;
  longitude: number;
  latitude: number;
  fetchedAt: string;
};

type TravelVideoRow = {
  video_id: string;
  title: string;
  channel: string;
  description: string | null;
  tags: string[] | null;
  topic_yt_categories: string[] | null;
  category: string | null;
  view_count: number | null;
  like_count: number | null;
  published_at: Date | string | null;
  thumbnail: string | null;
  research_area: string | null;
  zoom_levels: number[] | null;
  geom: string | null;
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

function mapRow(row: TravelVideoRow): TravelVideoRecord {
  return {
    videoId: row.video_id,
    title: row.title,
    channel: row.channel,
    description: row.description,
    tags: row.tags,
    topicYtCategories: row.topic_yt_categories,
    category: row.category,
    viewCount: row.view_count,
    likeCount: row.like_count,
    publishedAt: toIso(row.published_at),
    thumbnail: row.thumbnail,
    researchArea: row.research_area,
    zoomLevels: row.zoom_levels,
    geom: row.geom,
    fetchedAt: toIso(row.fetched_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function upsertTravelVideo(input: UpsertTravelVideoInput): Promise<TravelVideoRecord> {
  const zoomValue = input.zoomLevels?.[0] ?? null;
  
  const result = await pool.query<TravelVideoRow>(
    `
      INSERT INTO travel_videos (
        video_id,
        title,
        channel,
        description,
        tags,
        topic_yt_categories,
        category,
        view_count,
        like_count,
        published_at,
        thumbnail,
        research_area,
        zoom_levels,
        geom,
        fetched_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ST_SetSRID(ST_MakePoint($14, $15), 4326), $16, NOW())
      ON CONFLICT (video_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        channel = EXCLUDED.channel,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        topic_yt_categories = EXCLUDED.topic_yt_categories,
        category = EXCLUDED.category,
        view_count = EXCLUDED.view_count,
        like_count = EXCLUDED.like_count,
        published_at = EXCLUDED.published_at,
        thumbnail = EXCLUDED.thumbnail,
        research_area = EXCLUDED.research_area,
        zoom_levels = CASE
          WHEN EXCLUDED.zoom_levels IS NULL OR EXCLUDED.zoom_levels = '{}' THEN ARRAY[$17::integer]
          WHEN $17::integer = ANY(travel_videos.zoom_levels) THEN travel_videos.zoom_levels
          ELSE array_append(travel_videos.zoom_levels, $17::integer)
        END,
        geom = EXCLUDED.geom,
        fetched_at = EXCLUDED.fetched_at,
        updated_at = NOW()
      RETURNING *
    `,
    [
      input.videoId,
      input.title,
      input.channel,
      input.description,
      input.tags,
      input.topicYtCategories,
      input.category,
      input.viewCount,
      input.likeCount,
      input.publishedAt,
      input.thumbnail,
      input.researchArea,
      input.zoomLevels ?? null,
      input.longitude,
      input.latitude,
      input.fetchedAt,
      zoomValue,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function listTravelVideos(options: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<TravelVideoRecord[]> {
  const result = await pool.query<TravelVideoRow>(
    `
      SELECT *
      FROM travel_videos
      WHERE ($1::text IS NULL OR category = $1)
      ORDER BY published_at DESC NULLS LAST, fetched_at DESC
      LIMIT $2 OFFSET $3
    `,
    [options.category ?? null, options.limit ?? 100, options.offset ?? 0],
  );

  return result.rows.map(mapRow);
}

export async function getTravelVideoById(videoId: string): Promise<TravelVideoRecord | null> {
  const result = await pool.query<TravelVideoRow>(
    `
      SELECT *
      FROM travel_videos
      WHERE video_id = $1
      LIMIT 1
    `,
    [videoId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function countVideosByZoomAndArea(params: {
  zoom: number;
  category: string | null;
  longitude: number;
  latitude: number;
  radiusMeters: number;
}): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*) as count
      FROM travel_videos
      WHERE ($2::text IS NULL OR category = $2)
        AND $1::integer = ANY(zoom_levels)
        AND ST_DWithin(
          ST_Transform(geom, 3857),
          ST_Transform(ST_SetSRID(ST_MakePoint($3, $4), 4326), 3857),
          $5
        )
    `,
    [params.zoom, params.category, params.longitude, params.latitude, params.radiusMeters],
  );

  return parseInt(result.rows[0].count, 10);
}

export async function listVideosByZoomAndArea(params: {
  zoom: number;
  category: string | null;
  longitude: number;
  latitude: number;
  radiusMeters: number;
  limit?: number;
}): Promise<TravelVideoRecord[]> {
  type TravelVideoRowWithCoords = TravelVideoRow & {
    longitude: number;
    latitude: number;
  };

  const result = await pool.query<TravelVideoRowWithCoords>(
    `
      SELECT
        video_id,
        title,
        channel,
        description,
        tags,
        topic_yt_categories,
        category,
        view_count,
        like_count,
        published_at,
        thumbnail,
        research_area,
        zoom_levels,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        geom,
        fetched_at,
        updated_at
      FROM travel_videos
      WHERE ($2::text IS NULL OR category = $2)
        AND $1::integer = ANY(zoom_levels)
        AND ST_DWithin(
          ST_Transform(geom, 3857),
          ST_Transform(ST_SetSRID(ST_MakePoint($3, $4), 4326), 3857),
          $5
        )
      ORDER BY published_at DESC NULLS LAST, fetched_at DESC
      LIMIT $6
    `,
    [
      params.zoom,
      params.category,
      params.longitude,
      params.latitude,
      params.radiusMeters,
      params.limit ?? 100,
    ],
  );

  return result.rows.map((row) => ({
    ...mapRow(row),
    longitude: row.longitude,
    latitude: row.latitude,
  }));
}
