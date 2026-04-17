import pool from '../config/database';
import { Video, VideoQueryParams } from '../types';

export class VideoModel {
  /**
   * Get all videos with optional bbox filter
   */
  static async findAll(params: VideoQueryParams): Promise<Video[]> {
    const { minLon, minLat, maxLon, maxLat, limit = 100, offset = 0 } = params;

    let query = `
      SELECT 
        id,
        video_id,
        title,
        description,
        thumbnail_url,
        channel_name,
        published_at,
        view_count,
        location_description,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        created_at,
        updated_at
      FROM youtube_videos
    `;

    const queryParams: any[] = [];
    
    if (minLon && minLat && maxLon && maxLat) {
      query += `
        WHERE ST_Intersects(
          geom,
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
      `;
      queryParams.push(minLon, minLat, maxLon, maxLat);
    }

    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Get video by ID
   */
  static async findById(id: number): Promise<Video | null> {
    const query = `
      SELECT 
        id,
        video_id,
        title,
        description,
        thumbnail_url,
        channel_name,
        published_at,
        view_count,
        location_description,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        created_at,
        updated_at
      FROM youtube_videos
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get video by YouTube video_id
   */
  static async findByVideoId(videoId: string): Promise<Video | null> {
    const query = `
      SELECT 
        id,
        video_id,
        title,
        description,
        thumbnail_url,
        channel_name,
        published_at,
        view_count,
        location_description,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        created_at,
        updated_at
      FROM youtube_videos
      WHERE video_id = $1
    `;

    const result = await pool.query(query, [videoId]);
    return result.rows[0] || null;
  }

  /**
   * Create new video
   */
  static async create(video: Partial<Video> & { category?: string }): Promise<Video> {
    const query = `
      INSERT INTO youtube_videos (
        video_id,
        title,
        description,
        thumbnail_url,
        channel_name,
        published_at,
        view_count,
        location_description,
        category,
        geom
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($10, $11), 4326))
      RETURNING 
        id,
        video_id,
        title,
        description,
        thumbnail_url,
        channel_name,
        published_at,
        view_count,
        location_description,
        category,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        created_at,
        updated_at
    `;

    const values = [
      video.video_id,
      video.title,
      video.description,
      video.thumbnail_url,
      video.channel_name,
      video.published_at,
      video.view_count,
      video.location_description,
      video.category,
      video.longitude,
      video.latitude,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get videos within radius of a point (in meters)
   */
  static async findNearby(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    limit: number = 50,
    category?: string
  ): Promise<Video[]> {
    let query = `
      SELECT 
        id,
        video_id,
        title,
        description,
        thumbnail_url,
        channel_name,
        published_at,
        view_count,
        location_description,
        category,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        ST_Distance(
          geom::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as distance_km,
        created_at,
        updated_at
      FROM youtube_videos
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    const queryParams: any[] = [longitude, latitude, radiusMeters];

    if (category) {
      query += ` AND category = $4`;
      queryParams.push(category);
      query += ` ORDER BY distance_km LIMIT $5`;
      queryParams.push(limit);
    } else {
      query += ` ORDER BY distance_km LIMIT $4`;
      queryParams.push(limit);
    }

    const result = await pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Count total videos
   */
  static async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as count FROM youtube_videos');
    return parseInt(result.rows[0].count);
  }
}
