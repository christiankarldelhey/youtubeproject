import { ref } from 'vue';
import axios from 'axios';
import type { 
  VideoMarker, 
  DetailedVideoItem, 
  YoutubeApiResponse, 
  YoutubeDetailedApiResponse, 
  FetchYoutubeParams } from '../types/Map';


export function useYoutube() {
  const videos = ref<VideoMarker[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const lastSearchCenter = ref<[number, number] | null>(null);
  const lastSearchRadiusKm = ref<number>(0);

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
    const reductionFactor = 0.5;
    const radiusKm = (40075 / Math.pow(2, zoomLevel)) * reductionFactor;
    const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
    return `${limitedRadius}km`;
  };

  const fetchYoutubeVideos = async ({
    maxResults = 50,
    apiKey,
    searchQuery,
    currentMapPosition,
    currentZoom,
  }: FetchYoutubeParams): Promise<void> => {
    loading.value = true;
    error.value = null;

    const currentRadius = calculateRadiusFromZoom(currentZoom ?? 10) ?? '1000km';
    
    // Guardar centro y radio para visualización
    if (currentMapPosition) {
      lastSearchCenter.value = [currentMapPosition[0], currentMapPosition[1]];
      lastSearchRadiusKm.value = parseInt(currentRadius.replace('km', ''));
    }

    const endpoint = `https://youtube.googleapis.com/youtube/v3/search`;

    const params = {
      part: 'snippet',
      relevanceLanguage: 'es',
      maxResults,
      q: searchQuery ?? 'travel',
      type: 'video',
      key: apiKey,
      location: currentMapPosition ? `${currentMapPosition[0]},${currentMapPosition[1]}` : '0,0',
      locationRadius: currentRadius,
      order: 'relevance',
      videoCategoryId: 19,
      videoSyndicated: true,
      videoDuration: 'medium',
    };

    try {
      const { data } = await axios.get<YoutubeApiResponse>(endpoint, { params });
      const videoIds = data.items.map(item => item.id.videoId);

      const detailedVideos = await fetchVideoDetails(videoIds, apiKey);

      console.log('detailedVideos', detailedVideos);
      
      videos.value = data.items.map(item => {
        const detailedVideo = detailedVideos.find(video => video.id === item.id.videoId);
        return {
          position: [
            detailedVideo?.recordingDetails?.location?.latitude ?? 0,
            detailedVideo?.recordingDetails?.location?.longitude ?? 0
          ],
          location: detailedVideo?.recordingDetails?.locationDescription,
          title: detailedVideo?.snippet.title ?? '',
          description: detailedVideo?.snippet.description ?? '',
          videoId: detailedVideo?.id ?? '',
          thumbnail: detailedVideo?.snippet.thumbnails.high.url ?? '',
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
    lastSearchCenter,
    lastSearchRadiusKm,
  };
}
