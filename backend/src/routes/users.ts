import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/users/:firebaseUid/favorites
 * Get user's favorite videos
 */
router.get('/:firebaseUid/favorites', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;

    const query = `
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.description,
        v.thumbnail_url,
        v.channel_name,
        v.published_at,
        v.view_count,
        v.location_description,
        ST_X(v.geom) as longitude,
        ST_Y(v.geom) as latitude,
        v.created_at,
        v.updated_at
      FROM youtube_videos v
      INNER JOIN user_favorites uf ON v.id = uf.video_id
      INNER JOIN users u ON uf.user_id = u.id
      WHERE u.firebase_uid = $1
      ORDER BY uf.created_at DESC
    `;

    const result = await pool.query(query, [firebaseUid]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows,
      count: result.rows.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/users/:firebaseUid/favorites
 * Add video to favorites (creates video if doesn't exist)
 */
router.post('/:firebaseUid/favorites', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { firebaseUid } = req.params;
    const { 
      video_id, 
      title, 
      description, 
      thumbnail_url, 
      channel_name,
      published_at,
      view_count,
      location_description,
      longitude,
      latitude 
    } = req.body;

    await client.query('BEGIN');

    // Get or create user
    let userResult = await client.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );

    let userId: number;

    if (userResult.rows.length === 0) {
      // Create user
      const insertUserResult = await client.query(
        'INSERT INTO users (firebase_uid) VALUES ($1) RETURNING id',
        [firebaseUid]
      );
      userId = insertUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Get or create video
    let videoResult = await client.query(
      'SELECT id FROM youtube_videos WHERE video_id = $1',
      [video_id]
    );

    let videoInternalId: number;

    if (videoResult.rows.length === 0) {
      // Create video if it doesn't exist
      const insertVideoResult = await client.query(
        `INSERT INTO youtube_videos (
          video_id, title, description, thumbnail_url, channel_name,
          published_at, view_count, location_description, geom
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($9, $10), 4326))
        RETURNING id`,
        [
          video_id,
          title || 'Untitled',
          description,
          thumbnail_url,
          channel_name,
          published_at,
          view_count,
          location_description,
          longitude || 0,
          latitude || 0
        ]
      );
      videoInternalId = insertVideoResult.rows[0].id;
    } else {
      videoInternalId = videoResult.rows[0].id;
    }

    // Add to favorites (ignore if already exists)
    await client.query(
      `INSERT INTO user_favorites (user_id, video_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, video_id) DO NOTHING`,
      [userId, videoInternalId]
    );

    await client.query('COMMIT');

    const response: ApiResponse<any> = {
      success: true,
      data: { message: 'Video added to favorites' },
    };

    res.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding favorite:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/users/:firebaseUid/favorites/:videoId
 * Remove video from favorites
 */
router.delete('/:firebaseUid/favorites/:videoId', async (req: Request, res: Response) => {
  try {
    const { firebaseUid, videoId } = req.params;

    const query = `
      DELETE FROM user_favorites
      WHERE user_id = (SELECT id FROM users WHERE firebase_uid = $1)
        AND video_id = (SELECT id FROM youtube_videos WHERE video_id = $2)
    `;

    await pool.query(query, [firebaseUid, videoId]);

    const response: ApiResponse<any> = {
      success: true,
      data: { message: 'Video removed from favorites' },
    };

    res.json(response);
  } catch (error) {
    console.error('Error removing favorite:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/users/:firebaseUid/favorites/check/:videoId
 * Check if video is in favorites
 */
router.get('/:firebaseUid/favorites/check/:videoId', async (req: Request, res: Response) => {
  try {
    const { firebaseUid, videoId } = req.params;

    const query = `
      SELECT EXISTS (
        SELECT 1 FROM user_favorites uf
        INNER JOIN users u ON uf.user_id = u.id
        INNER JOIN youtube_videos v ON uf.video_id = v.id
        WHERE u.firebase_uid = $1 AND v.video_id = $2
      ) as is_favorite
    `;

    const result = await pool.query(query, [firebaseUid, videoId]);

    const response: ApiResponse<any> = {
      success: true,
      data: { is_favorite: result.rows[0].is_favorite },
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking favorite:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

export default router;
