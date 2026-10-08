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

interface YoutubeSearchResult {
  items: YoutubeVideoItem[];
  nextPageToken?: string;
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

function calculateSubSearchCenters(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): [number, number][] {
  // Convert radius to degrees (approximate for small distances)
  // 1 degree ≈ 111,000 meters
  const offsetDegrees = (radiusMeters / 2) / 111000;

  return [
    [centerLat + offsetDegrees, centerLng + offsetDegrees], // NW
    [centerLat + offsetDegrees, centerLng - offsetDegrees], // NE
    [centerLat - offsetDegrees, centerLng + offsetDegrees], // SW
    [centerLat - offsetDegrees, centerLng - offsetDegrees], // SE
  ];
}

async function fetchYoutubeSearch(
  params: YoutubeSearchParams & { locationOverride?: [number, number]; radiusOverride?: string },
): Promise<YoutubeSearchResult> {
  const currentRadius = params.radiusOverride ?? calculateRadiusFromZoom(params.currentZoom ?? 10);
  const location = params.locationOverride ?? params.currentMapPosition ?? [0, 0];
  const queryParams = {
    part: 'snippet',
    relevanceLanguage: 'es',
    maxResults: params.maxResults ?? 50,
    q: params.searchQuery ?? '"travel vlog"|"travel guide"|trip|viaje|"city guide" "walking tour"|"neighborhood guide"|"best area"|"best neighborhood" -shorts -music -reaction -podcast',
    type: 'video',
    key: params.apiKey,
    location: `${location[0]},${location[1]}`,
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
    isOverride: !!params.locationOverride,
  });

  const { data } = await axios.get<YoutubeSearchResult>(
    SEARCH_ENDPOINT,
    { params: queryParams },
  );
  return data;
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

  console.log(`[youtube-api] Fetched details for ${data.items.length} videos:`);
  data.items.forEach((video, index) => {
    console.log(`[youtube-api] Video ${index + 1}/${data.items.length}:`, {
      id: video.id,
      title: video.snippet.title,
      hasLocation: !!video.recordingDetails?.location,
      location: video.recordingDetails?.location,
      locationDescription: video.recordingDetails?.locationDescription,
      hasStatistics: !!video.statistics,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount,
      topicCategories: video.topicDetails?.topicCategories,
    });
  });

  return data.items;
}

export async function fetchAndIngestVideos(
  params: YoutubeSearchParams,
): Promise<VideoMarker[]> {
  const searchResult = await fetchYoutubeSearch(params);
  const videoIds = searchResult.items.map((item) => item.id.videoId);
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

async function ingestVideosFromItems(
  items: YoutubeVideoItem[],
  params: YoutubeSearchParams,
): Promise<VideoMarker[]> {
  const videoIds = items.map((item) => item.id.videoId);

  // YouTube API accepts max 50 video IDs per request
  const batchSize = 50;
  const batches: string[][] = [];
  for (let i = 0; i < videoIds.length; i += batchSize) {
    batches.push(videoIds.slice(i, i + batchSize));
  }

  console.log(`[api] Fetching details for ${videoIds.length} videos in ${batches.length} batches`);

  const detailedVideos: YoutubeDetailedVideoItem[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batchVideos = await fetchYoutubeDetails(batches[i], params.apiKey);
    detailedVideos.push(...batchVideos);
    console.log(`[api] Batch ${i + 1}/${batches.length}: fetched ${batchVideos.length} videos`);
  }

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

  console.log(`[api] Ingested ${detailedVideos.length} videos from ${batches.length} batches`);

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

export async function fetchAndIngestVideosWithPagination(
  params: YoutubeSearchParams,
): Promise<VideoMarker[]> {
  const centerLat = params.currentMapPosition?.[0] ?? 0;
  const centerLng = params.currentMapPosition?.[1] ?? 0;
  const radiusMeters = calculateRadiusMeters(params.currentZoom ?? 10);
  const radiusKm = Math.ceil(radiusMeters / 1000);

  console.log(`[pagination] Starting multi-fetch strategy for center [${centerLat}, ${centerLng}] with radius ${radiusKm}km`);

  // Step 1: Original fetch
  const originalResult = await fetchYoutubeSearch(params);
  console.log(`[pagination] Original fetch returned ${originalResult.items.length} videos, nextPageToken: ${originalResult.nextPageToken ?? 'none'}`);

  let allItems: YoutubeVideoItem[] = [...originalResult.items];

  // Step 2: If pagination detected, perform 4 sub-fetches
  if (originalResult.nextPageToken) {
    console.log(`[pagination] Pagination detected - performing 4 sub-fetches`);

    const subCenters = calculateSubSearchCenters(centerLat, centerLng, radiusMeters);
    const subRadiusKm = Math.ceil(radiusKm / 2);
    const subRadiusStr = `${subRadiusKm}km`;

    console.log(`[pagination] Sub-centers:`, subCenters.map(c => `[${c[0].toFixed(4)}, ${c[1].toFixed(4)}]`).join(', '));
    console.log(`[pagination] Sub-radius: ${subRadiusStr}`);

    // Execute 4 sub-fetches in parallel
    const subFetchPromises = subCenters.map(async (center, index) => {
      try {
        const subResult = await fetchYoutubeSearch({
          ...params,
          locationOverride: center,
          radiusOverride: subRadiusStr,
        });
        console.log(`[pagination] Sub-fetch ${index + 1} returned ${subResult.items.length} videos`);
        return subResult.items;
      } catch (error) {
        console.error(`[pagination] Sub-fetch ${index + 1} failed:`, error);
        return [];
      }
    });

    const subFetchResults = await Promise.all(subFetchPromises);
    const subItems = subFetchResults.flat();

    console.log(`[pagination] Total items from sub-fetches: ${subItems.length}`);

    // Step 3: Deduplicate by videoId
    const seenVideoIds = new Set<string>();
    const uniqueItems: YoutubeVideoItem[] = [];

    for (const item of allItems) {
      const videoId = item.id.videoId;
      if (!seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);
        uniqueItems.push(item);
      }
    }

    for (const item of subItems) {
      const videoId = item.id.videoId;
      if (!seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);
        uniqueItems.push(item);
      }
    }

    allItems = uniqueItems;
    console.log(`[pagination] After deduplication: ${allItems.length} unique videos`);
  } else {
    console.log(`[pagination] No pagination detected - using original results only`);
  }

  // Step 4: Ingest all unique videos
  console.log(`[pagination] Ingesting ${allItems.length} unique videos`);
  const videoMarkers = await ingestVideosFromItems(allItems, params);

  return videoMarkers;
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
  const videos = await fetchAndIngestVideosWithPagination(params);
  return {
    total: videos.length,
    videos,
  };
}
