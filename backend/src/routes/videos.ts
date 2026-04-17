import { Router, Request, Response } from 'express';
import { videoService } from '../services/videoService';
import { ApiResponse, VideoQueryParams } from '../types';

const router = Router();

/**
 * GET /api/videos
 * Search videos (combines PostgreSQL cache + YouTube API)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const latitude = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const longitude = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
    const radius = req.query.radius ? parseInt(req.query.radius as string) : 5000;
    const maxResults = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const useCache = req.query.useCache !== 'false';
    const category = req.query.category as string | undefined;

    let videos: any[] = [];

    // If lat/lon provided, search nearby videos
    if (latitude && longitude) {
      const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY;
      
      videos = await videoService.searchVideos(
        { latitude, longitude, radius, maxResults, useCache, category },
        youtubeApiKey
      );
    } else {
      // Otherwise, get all videos from PostgreSQL
      videos = await videoService.getAllVideos({
        limit: maxResults,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: videos,
      count: videos.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching videos:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/videos/:id
 * Get video by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const video = await videoService.getVideoById(id);

    if (!video) {
      const response: ApiResponse<any> = {
        success: false,
        error: 'Video not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: video,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching video:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/videos/nearby/:lon/:lat
 * Get videos near a point
 */
router.get('/nearby/:lon/:lat', async (req: Request, res: Response) => {
  try {
    const lon = parseFloat(req.params.lon);
    const lat = parseFloat(req.params.lat);
    const radius = req.query.radius ? parseInt(req.query.radius as string) : 5000;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const videos = await videoService.getVideosNearby(lon, lat, radius, limit);

    const response: ApiResponse<any> = {
      success: true,
      data: videos,
      count: videos.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching nearby videos:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/videos
 * Create new video
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const video = await videoService.saveVideo({
      videoId: req.body.video_id,
      title: req.body.title,
      description: req.body.description,
      thumbnail: req.body.thumbnail_url,
      channelName: req.body.channel_name,
      publishedAt: req.body.published_at,
      viewCount: req.body.view_count,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      locationDescription: req.body.location_description,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: video,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating video:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

export default router;
