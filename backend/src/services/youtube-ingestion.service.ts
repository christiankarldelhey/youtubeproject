import axios from 'axios';
import {
  upsertTravelVideo,
  countVideosByZoomAndArea,
  listVideosByZoomAndArea,
} from '../db/repositories/travel-videos.repository.js';

const SEARCH_ENDPOINT = 'https://youtube.googleapis.com/youtube/v3/search';
const DETAILS_ENDPOINT = 'https://youtube.googleapis.com/youtube/v3/videos';

interface YoutubeSearchParams {
  apiKey: string;
  currentMapPosition?: [number, number];
  currentZoom?: number;
  searchQuery?: string;
  category?: string;
  maxResults?: number;
}

interface YoutubeVideoItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
    };
  };
}

interface YoutubeDetailedVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
    };
    tags?: string[];
  };
  recordingDetails?: {
    recordingDate?: string;
    location?: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    locationDescription?: string;
  };
  topicDetails?: {
    topicCategories: string[];
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
    favoriteCount?: string;
  };
}

interface VideoMarker {
  position: [number, number];
  title: string;
  videoId: string;
  location?: string;
  description?: string;
  thumbnail?: string;
  favorited?: boolean;
}

function calculateRadiusFromZoom(zoom: number): string {
  const reductionFactor = 0.5;
  const radiusKm = (40075 / Math.pow(2, zoom)) * reductionFactor;
  const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
  console.log(`[radius] Zoom ${zoom} -> radius: ${limitedRadius}km (raw: ${radiusKm.toFixed(2)}km)`);
  return `${limitedRadius}km`;
}

function calculateRadiusMeters(zoom: number): number {
  const reductionFactor = 0.5;
  const radiusKm = (40075 / Math.pow(2, zoom)) * reductionFactor;
  const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
  return limitedRadius * 1000;
}

async function fetchYoutubeSearch(
  params: YoutubeSearchParams,
): Promise<YoutubeVideoItem[]> {
  const currentRadius = calculateRadiusFromZoom(params.currentZoom ?? 10);
  const queryParams = {
    part: 'snippet',
    relevanceLanguage: 'es',
    maxResults: params.maxResults ?? 50,
    q: params.searchQuery ?? '"travel vlog"|"travel guide"|trip|viaje|"city guide" "walking tour"|"neighborhood guide"|"best area"|"best neighborhood" -shorts -music -reaction -podcast',
    type: 'video',
    key: params.apiKey,
    location: params.currentMapPosition
      ? `${params.currentMapPosition[0]},${params.currentMapPosition[1]}`
      : '0,0',
    locationRadius: currentRadius,
    order: 'relevance',
    videoCategoryId: 19,
    videoSyndicated: 'true',
    videoDuration: 'medium',
  };

  console.log(`[youtube-api] Search params:`, {
    location: queryParams.location,
    locationRadius: queryParams.locationRadius,
    zoom: params.currentZoom,
  });

  const { data } = await axios.get<{ items: YoutubeVideoItem[] }>(
    SEARCH_ENDPOINT,
    { params: queryParams },
  );
  return data.items;
}

async function fetchYoutubeDetails(
  videoIds: string[],
  apiKey: string,
): Promise<YoutubeDetailedVideoItem[]> {
  if (!videoIds.length) {
    return [];
  }

  const params = {
    part: 'snippet,recordingDetails,topicDetails,statistics',
    id: videoIds.join(','),
    key: apiKey,
  };

  const { data } = await axios.get<{ items: YoutubeDetailedVideoItem[] }>(
    DETAILS_ENDPOINT,
    { params },
  );
  return data.items;
}

export async function fetchAndIngestVideos(
  params: YoutubeSearchParams,
): Promise<VideoMarker[]> {
  const searchResults = await fetchYoutubeSearch(params);
  const videoIds = searchResults.map((item) => item.id.videoId);
  const detailedVideos = await fetchYoutubeDetails(videoIds, params.apiKey);

  const fetchedAt = new Date().toISOString();
  const zoom = params.currentZoom ?? 10;

  for (const detailedVideo of detailedVideos) {
    const viewCount = detailedVideo.statistics?.viewCount
      ? parseInt(detailedVideo.statistics.viewCount, 10)
      : null;
    const likeCount = detailedVideo.statistics?.likeCount
      ? parseInt(detailedVideo.statistics.likeCount, 10)
      : null;

    await upsertTravelVideo({
      videoId: detailedVideo.id,
      title: detailedVideo.snippet.title,
      channel: detailedVideo.snippet.channelTitle,
      description: detailedVideo.snippet.description,
      tags: detailedVideo.snippet.tags ?? null,
      topicYtCategories: detailedVideo.topicDetails?.topicCategories ?? null,
      category: params.category ?? null,
      viewCount,
      likeCount,
      publishedAt: detailedVideo.snippet.publishedAt,
      thumbnail: detailedVideo.snippet.thumbnails.high.url,
      researchArea: null,
      zoomLevels: [zoom],
      longitude: detailedVideo.recordingDetails?.location?.longitude ?? 0,
      latitude: detailedVideo.recordingDetails?.location?.latitude ?? 0,
      fetchedAt,
    });
  }

  console.log(`[api] Ingested ${detailedVideos.length} new videos for zoom ${zoom}`);

  return detailedVideos.map((video) => ({
    position: [
      video.recordingDetails?.location?.latitude ?? 0,
      video.recordingDetails?.location?.longitude ?? 0,
    ],
    location: video.recordingDetails?.locationDescription ?? 'Unknown',
    title: video.snippet.title,
    description: video.snippet.description,
    videoId: video.id,
    thumbnail: video.snippet.thumbnails.high.url ?? '',
    favorited: false,
  }));
}

export async function searchVideos(
  params: YoutubeSearchParams,
): Promise<{ total: number; videos: VideoMarker[] }> {
  const zoom = params.currentZoom ?? 10;
  const longitude = params.currentMapPosition?.[1] ?? 0;
  const latitude = params.currentMapPosition?.[0] ?? 0;
  const radiusMeters = calculateRadiusMeters(zoom);
  const CACHE_THRESHOLD = 40;

  console.log(`[cache-search] Searching cache:`, {
    zoom,
    latitude,
    longitude,
    radiusMeters: `${(radiusMeters / 1000).toFixed(2)}km`,
  });

  // Check cache first
  const cachedCount = await countVideosByZoomAndArea({
    zoom,
    category: params.category ?? null,
    longitude,
    latitude,
    radiusMeters,
  });

  if (cachedCount >= CACHE_THRESHOLD) {
    console.log(
      `[cache] Using cached results: ${cachedCount} videos for zoom ${zoom}`,
    );
    const cachedVideos = await listVideosByZoomAndArea({
      zoom,
      category: params.category ?? null,
      longitude,
      latitude,
      radiusMeters,
      limit: 100,
    });

    const videoMarkers: VideoMarker[] = cachedVideos.map((video) => ({
      position: [
        video.latitude ?? 0,
        video.longitude ?? 0,
      ] as [number, number],
      location: video.researchArea ?? 'Unknown',
      title: video.title,
      description: video.description ?? '',
      videoId: video.videoId,
      thumbnail: video.thumbnail ?? '',
      favorited: false,
    }));

    return {
      total: videoMarkers.length,
      videos: videoMarkers,
    };
  }

  // Cache miss - call API
  console.log(
    `[api] Calling YouTube API (cache has ${cachedCount} videos, threshold: ${CACHE_THRESHOLD})`,
  );
  const videos = await fetchAndIngestVideos(params);
  return {
    total: videos.length,
    videos,
  };
}
