import { ref } from 'vue';
import axios from 'axios';
import type { VideoItem, DetailedVideoItem, YoutubeApiResponse, YoutubeDetailedApiResponse, FetchYoutubeParams } from '../types/Map';

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

  const calculateRadiusFromZoom = (zoomLevel: number): string => {
    const radiusKm = 40075 / Math.pow(2, zoomLevel); 
    const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
    return `${limitedRadius}km`;
  };

  const fetchYoutubeVideos = async ({
    maxResults = 50,
    apiKey,
    currentMapPosition,
    currentZoom,
  }: FetchYoutubeParams): Promise<void> => {
    loading.value = true;
    error.value = null;

    console.log('me llega este zoom: ', currentZoom);
    const currentRadius = calculateRadiusFromZoom(currentZoom ?? 10) ?? '1000km';
    console.log('el radio: ', currentRadius);

    const endpoint = `https://youtube.googleapis.com/youtube/v3/search`;

    const params = {
      part: 'snippet',
      relevanceLanguage: 'es',
      maxResults,
      q: 'travel',
      type: 'video',
      key: apiKey,
      location: currentMapPosition ? `${currentMapPosition[0]},${currentMapPosition[1]}` : '0,0',
      locationRadius: currentRadius,
      order: 'relevance',
      videoCategoryId: 19,
      videoDuration: 'medium',
    };

    try {
      const { data } = await axios.get<YoutubeApiResponse>(endpoint, { params });
      const videoIds = data.items.map(item => item.id.videoId);

      const detailedVideos = await fetchVideoDetails(videoIds, apiKey);
      
      videos.value = data.items.map(item => {
        const detailedVideo = detailedVideos.find(video => video.id === item.id.videoId);
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
