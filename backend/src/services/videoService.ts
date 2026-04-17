import pool from '../config/database';
import { VideoModel } from '../models/Video';
import { youtubeService } from './youtubeService';

interface SearchVideosParams {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  maxResults?: number;
  useCache?: boolean;
  category?: string;
}

interface VideoData {
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelName?: string;
  publishedAt?: string;
  viewCount?: number;
  latitude: number;
  longitude: number;
  locationDescription?: string;
}

export class VideoService {
  /**
   * Search videos combining PostgreSQL cache and YouTube API
   */
  async searchVideos(params: SearchVideosParams, youtubeApiKey?: string): Promise<any[]> {
    const { latitude, longitude, radius, maxResults = 50, useCache = true } = params;

    let videos: any[] = [];

    // 1. Try to get videos from PostgreSQL first (cache), filtered by category
    if (useCache) {
      try {
        videos = await VideoModel.findNearby(longitude, latitude, radius, maxResults, params.category);
        console.log(`[Cache] Found ${videos.length} videos in PostgreSQL (category: ${params.category || 'all'})`);
      } catch (error) {
        console.error('Error fetching from PostgreSQL:', error);
      }
    }

    // 2. If not enough videos and YouTube API key is provided, fetch from YouTube
    console.log(`[YouTube] Cache has ${videos.length}/${maxResults} videos. API key: ${youtubeApiKey ? 'present' : 'MISSING'}`);
    if (videos.length < maxResults && youtubeApiKey) {
      try {
        const youtubeVideos = await youtubeService.searchVideos({
          latitude,
          longitude,
          radius,
          maxResults: maxResults - videos.length,
          apiKey: youtubeApiKey,
          category: params.category,
        });

        console.log(`Found ${youtubeVideos.length} videos from YouTube API`);

        // 3. Save new videos to PostgreSQL
        for (const ytVideo of youtubeVideos) {
          try {
            // Check if video already exists
            const existing = await VideoModel.findByVideoId(ytVideo.videoId);
            
            if (!existing && ytVideo.latitude && ytVideo.longitude) {
              await VideoModel.create({
                video_id: ytVideo.videoId,
                title: ytVideo.title,
                description: ytVideo.description,
                thumbnail_url: ytVideo.thumbnail,
                channel_name: ytVideo.channelName,
                published_at: ytVideo.publishedAt ? new Date(ytVideo.publishedAt) : undefined,
                view_count: ytVideo.viewCount,
                location_description: ytVideo.locationDescription,
                category: params.category || 'travel',
                longitude: ytVideo.longitude,
                latitude: ytVideo.latitude,
              });
              
              videos.push({
                video_id: ytVideo.videoId,
                title: ytVideo.title,
                description: ytVideo.description,
                thumbnail_url: ytVideo.thumbnail,
                channel_name: ytVideo.channelName,
                longitude: ytVideo.longitude,
                latitude: ytVideo.latitude,
                location_description: ytVideo.locationDescription,
              });
            }
          } catch (error) {
            console.error(`Error saving video ${ytVideo.videoId}:`, error);
          }
        }
      } catch (error) {
        console.error('Error fetching from YouTube API:', error);
      }
    }

    return videos;
  }

  /**
   * Save a video to PostgreSQL
   */
  async saveVideo(videoData: VideoData): Promise<any> {
    try {
      // Check if video already exists
      const existing = await VideoModel.findByVideoId(videoData.videoId);
      
      if (existing) {
        return existing;
      }

      // Create new video
      return await VideoModel.create({
        video_id: videoData.videoId,
        title: videoData.title,
        description: videoData.description,
        thumbnail_url: videoData.thumbnail,
        channel_name: videoData.channelName,
        published_at: videoData.publishedAt ? new Date(videoData.publishedAt) : undefined,
        view_count: videoData.viewCount,
        location_description: videoData.locationDescription,
        longitude: videoData.longitude,
        latitude: videoData.latitude,
      });
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  }

  /**
   * Get videos near a location from PostgreSQL
   */
  async getVideosNearby(longitude: number, latitude: number, radiusMeters: number, limit: number = 50): Promise<any[]> {
    return VideoModel.findNearby(longitude, latitude, radiusMeters, limit);
  }

  /**
   * Get all videos with optional filters
   */
  async getAllVideos(filters: any = {}): Promise<any[]> {
    return VideoModel.findAll(filters);
  }

  /**
   * Get video by ID
   */
  async getVideoById(id: number): Promise<any> {
    return VideoModel.findById(id);
  }

  /**
   * Get video by YouTube video_id
   */
  async getVideoByVideoId(videoId: string): Promise<any> {
    return VideoModel.findByVideoId(videoId);
  }

  /**
   * Calculate video density in an area (videos per km²)
   */
  async calculateVideoDensity(longitude: number, latitude: number, radiusMeters: number): Promise<number> {
    const videos = await VideoModel.findNearby(longitude, latitude, radiusMeters);
    const areaKm2 = Math.PI * Math.pow(radiusMeters / 1000, 2);
    return videos.length / areaKm2;
  }
}

export const videoService = new VideoService();
