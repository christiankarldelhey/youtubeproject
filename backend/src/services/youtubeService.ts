import axios from 'axios';

interface YouTubeSearchParams {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  maxResults?: number;
  apiKey: string;
  category?: string;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  publishedAt?: string;
  viewCount?: number;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
}

export class YouTubeService {
  private readonly YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

  /**
   * Search for geolocated videos near a location
   */
  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeVideo[]> {
    const { latitude, longitude, radius, maxResults = 50, apiKey } = params;

    try {
      // Convert radius from meters to YouTube's format (e.g., "5km")
      const radiusKm = Math.ceil(radius / 1000);
      const location = `${latitude},${longitude}`;
      const locationRadius = `${radiusKm}km`;

      // Search for videos
      const searchParams = {
        part: 'snippet',
        q: params.category || 'travel',
        relevanceLanguage: 'es',
        location,
        locationRadius,
        type: 'video',
        videoCategoryId: 19,
        videoSyndicated: true,
        videoDuration: 'medium',
        order: 'relevance',
        maxResults,
        key: apiKey,
      };
      console.log('[YouTube /search] Calling with params:', { ...searchParams, key: '***' });

      const searchResponse = await axios.get(`${this.YOUTUBE_API_BASE}/search`, {
        params: searchParams,
      });

      console.log(`[YouTube /search] Got ${searchResponse.data.items?.length || 0} results`);

      const videoIds = searchResponse.data.items
        .map((item: any) => item.id.videoId)
        .join(',');

      if (!videoIds) {
        return [];
      }

      // Get detailed video information including recordingDetails
      console.log(`[YouTube /videos] Fetching details for ${videoIds.split(',').length} videos`);
      const detailsResponse = await axios.get(`${this.YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,recordingDetails,topicDetails',
          id: videoIds,
          key: apiKey,
        },
      });

      const allItems = detailsResponse.data.items || [];
      const withLocation = allItems.filter((item: any) => item.recordingDetails?.location);
      console.log(`[YouTube /videos] Got ${allItems.length} details, ${withLocation.length} with location`);

      // Parse and return videos
      return withLocation
        .map((item: any) => ({
          videoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          channelName: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          latitude: item.recordingDetails.location.latitude,
          longitude: item.recordingDetails.location.longitude,
          locationDescription: item.recordingDetails.locationDescription,
        }));
    } catch (error) {
      console.error('Error fetching videos from YouTube:', error);
      throw new Error('Failed to fetch videos from YouTube API');
    }
  }

  /**
   * Get details for a specific video
   */
  async getVideoDetails(videoId: string, apiKey: string): Promise<YouTubeVideo | null> {
    try {
      const response = await axios.get(`${this.YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,recordingDetails,statistics',
          id: videoId,
          key: apiKey,
        },
      });

      const item = response.data.items?.[0];
      if (!item) {
        return null;
      }

      return {
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        channelName: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        latitude: item.recordingDetails?.location?.latitude,
        longitude: item.recordingDetails?.location?.longitude,
        locationDescription: item.recordingDetails?.locationDescription,
      };
    } catch (error) {
      console.error('Error fetching video details from YouTube:', error);
      return null;
    }
  }
}

export const youtubeService = new YouTubeService();
