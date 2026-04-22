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
  geom: string | null;
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
    geom: row.geom,
    fetchedAt: toIso(row.fetched_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function upsertTravelVideo(input: UpsertTravelVideoInput): Promise<TravelVideoRecord> {
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
        geom,
        fetched_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ST_SetSRID(ST_MakePoint($13, $14), 4326), $15, NOW())
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
      input.longitude,
      input.latitude,
      input.fetchedAt,
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
