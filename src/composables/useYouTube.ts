import { ref } from 'vue';
import type { VideoMarker, FetchYoutubeParams } from '../types/Map';
import { useBackendApi } from './useBackendApi';

export function useYoutube() {
  const videos = ref<VideoMarker[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const lastSearchCenter = ref<[number, number] | null>(null);
  const lastSearchRadiusKm = ref<number>(0);

  const { getVideos } = useBackendApi();

  const calculateRadiusFromZoom = (zoomLevel: number): number => {
    const reductionFactor = 0.5;
    const radiusKm = (40075 / Math.pow(2, zoomLevel)) * reductionFactor;
    const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
    return limitedRadius;
  };

  const fetchYoutubeVideos = async ({
    maxResults = 50,
    currentMapPosition,
    currentZoom,
    searchQuery,
  }: FetchYoutubeParams): Promise<void> => {
    loading.value = true;
    error.value = null;

    const radiusKm = calculateRadiusFromZoom(currentZoom ?? 10);
    const radiusMeters = radiusKm * 1000;
    
    // Guardar centro y radio para visualización
    if (currentMapPosition) {
      lastSearchCenter.value = [currentMapPosition[0], currentMapPosition[1]];
      lastSearchRadiusKm.value = radiusKm;
    }

    try {
      // Llamar al backend en lugar de YouTube API directamente
      const fetchedVideos = await getVideos({
        lat: currentMapPosition?.[0],
        lon: currentMapPosition?.[1],
        radius: radiusMeters,
        limit: maxResults,
        category: searchQuery,
      });

      videos.value = fetchedVideos;

    } catch (err) {
      error.value = err instanceof Error ? err : new Error('An unexpected error occurred.');
      console.error('Error fetching videos from backend:', err);
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
