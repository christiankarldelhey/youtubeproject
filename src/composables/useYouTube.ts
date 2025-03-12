import { ref } from 'vue';
import axios from 'axios';

interface VideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

interface RecordingDetails {
  recordingDate?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}

interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: VideoSnippet;
  recordingDetails?: RecordingDetails;
  topicDetails?: {
    topicCategories: string[];
  };
}

interface DetailedVideoItem {
  id: string;
  snippet: VideoSnippet;
  recordingDetails: RecordingDetails;
  topicDetails: {
    topicCategories: string[];
  };
}

interface YoutubeApiResponse {
  items: VideoItem[];
}

interface YoutubeDetailedApiResponse {
  items: DetailedVideoItem[];
}

interface FetchYoutubeParams {
  latitude?: number;
  longitude?: number;
  radius?: string;
  maxResults?: number;
  apiKey: string;
}

export function useYoutube() {
  const videos = ref<VideoItem[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchVideoDetails = async (videoIds: string[], apiKey: string): Promise<DetailedVideoItem[]> => {
    const endpoint = 'https://youtube.googleapis.com/youtube/v3/videos';
    const params = {
      part: 'snippet,recordingDetails,topicDetails',
      id: videoIds.join(','),
      key: apiKey
    };

    try {
      const { data } = await axios.get<YoutubeDetailedApiResponse>(endpoint, { params });
      return data.items;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err;
      }
      throw new Error('An unexpected error occurred fetching video details.');
    }
  };

  const fetchYoutubeVideos = async ({
    latitude = -22.447772,
    longitude = -65.934821,
    radius = '15000m',
    maxResults = 20,
    apiKey,
  }: FetchYoutubeParams): Promise<void> => {
    loading.value = true;
    error.value = null;

    const endpoint = `https://youtube.googleapis.com/youtube/v3/search`;

    const params = {
      part: 'snippet',
      maxResults,
      type: 'video',
      key: apiKey,
      location: `${latitude},${longitude}`,
      locationRadius: radius,
      order: 'viewCount',
      videoCategoryId: 19,
      videoDuration: 'any',
    };

    try {
      const { data } = await axios.get<YoutubeApiResponse>(endpoint, { params });
      const videoIds = data.items.map(item => item.id.videoId);

      const detailedVideos = await fetchVideoDetails(videoIds, apiKey);
      
      videos.value = data.items.map(item => {
        const detailedVideo = detailedVideos.find(v => v.id === item.id.videoId);
        return {
          ...item,
          recordingDetails: detailedVideo?.recordingDetails,
          topicDetails: detailedVideo?.topicDetails
        };
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error.value = err;
      } else {
        error.value = new Error('An unexpected error occurred.');
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    videos,
    loading,
    error,
    fetchYoutubeVideos,
  };
}
