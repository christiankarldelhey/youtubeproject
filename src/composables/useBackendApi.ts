import axios from 'axios';
import type { VideoMarker } from '../types/Map';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

interface BackendVideo {
  id: number;
  video_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  channel_name?: string;
  published_at?: string;
  view_count?: number;
  location_description?: string;
  longitude: number;
  latitude: number;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export function useBackendApi() {
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Convert backend video to VideoMarker format
   */
  const toVideoMarker = (video: BackendVideo): VideoMarker => {
    return {
      position: [video.latitude, video.longitude],
      title: video.title,
      videoId: video.video_id,
      location: video.location_description,
      description: video.description,
      thumbnail: video.thumbnail_url,
    };
  };

  /**
   * Get videos from backend (searches PostgreSQL cache + YouTube API)
   */
  const getVideos = async (params?: {
    lat?: number;
    lon?: number;
    radius?: number;
    limit?: number;
    offset?: number;
    useCache?: boolean;
    category?: string;
  }): Promise<VideoMarker[]> => {
    try {
      const response = await api.get<ApiResponse<BackendVideo[]>>('/api/videos', { params });
      
      if (response.data.success && response.data.data) {
        return response.data.data.map(toVideoMarker);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching videos from backend:', error);
      return [];
    }
  };

  /**
   * Get videos near a point
   */
  const getVideosNearby = async (
    longitude: number,
    latitude: number,
    radiusMeters: number = 5000,
    limit: number = 50
  ): Promise<VideoMarker[]> => {
    try {
      const response = await api.get<ApiResponse<BackendVideo[]>>(
        `/api/videos/nearby/${longitude}/${latitude}`,
        {
          params: { radius: radiusMeters, limit },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(toVideoMarker);
      }

      return [];
    } catch (error) {
      console.error('Error fetching nearby videos:', error);
      return [];
    }
  };

  /**
   * Get video by ID
   */
  const getVideoById = async (id: number): Promise<VideoMarker | null> => {
    try {
      const response = await api.get<ApiResponse<BackendVideo>>(`/api/videos/${id}`);

      if (response.data.success && response.data.data) {
        return toVideoMarker(response.data.data);
      }

      return null;
    } catch (error) {
      console.error('Error fetching video by ID:', error);
      return null;
    }
  };

  /**
   * Create video in backend
   */
  const createVideo = async (video: {
    video_id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    channel_name?: string;
    published_at?: string;
    view_count?: number;
    location_description?: string;
    longitude: number;
    latitude: number;
  }): Promise<VideoMarker | null> => {
    try {
      const response = await api.post<ApiResponse<BackendVideo>>('/api/videos', video);

      if (response.data.success && response.data.data) {
        return toVideoMarker(response.data.data);
      }

      return null;
    } catch (error) {
      console.error('Error creating video:', error);
      return null;
    }
  };

  /**
   * Get user favorites
   */
  const getUserFavorites = async (firebaseUid: string): Promise<VideoMarker[]> => {
    try {
      const response = await api.get<ApiResponse<BackendVideo[]>>(
        `/api/users/${firebaseUid}/favorites`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(toVideoMarker);
      }

      return [];
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  };

  /**
   * Add video to favorites
   */
  const addFavorite = async (firebaseUid: string, video: VideoMarker): Promise<boolean> => {
    try {
      const response = await api.post<ApiResponse<any>>(
        `/api/users/${firebaseUid}/favorites`,
        {
          video_id: video.videoId,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail,
          location_description: video.location,
          longitude: video.position[1],
          latitude: video.position[0],
        }
      );

      return response.data.success;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  };

  /**
   * Remove video from favorites
   */
  const removeFavorite = async (firebaseUid: string, videoId: string): Promise<boolean> => {
    try {
      const response = await api.delete<ApiResponse<any>>(
        `/api/users/${firebaseUid}/favorites/${videoId}`
      );

      return response.data.success;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  };

  /**
   * Health check
   */
  const healthCheck = async (): Promise<boolean> => {
    try {
      const response = await api.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  };

  return {
    getVideos,
    getVideosNearby,
    getVideoById,
    createVideo,
    getUserFavorites,
    addFavorite,
    removeFavorite,
    healthCheck,
  };
}
