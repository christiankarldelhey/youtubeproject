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

interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: VideoSnippet;
}

interface YoutubeApiResponse {
  items: VideoItem[];
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

  const fetchYoutubeVideos = async ({
    latitude = 42.125,
    longitude = 9.386,
    radius = '25000m',
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
      videoDuration: 'long',
    };

    try {
      const { data } = await axios.get<YoutubeApiResponse>(endpoint, { params });
      videos.value = data.items;
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
