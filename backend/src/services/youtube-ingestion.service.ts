import axios from 'axios';
import { upsertTravelVideo } from '../db/repositories/travel-videos.repository.js';

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
  const radiusKm = Math.pow(2, 15 - zoom) * 10;
  return `${radiusKm}km`;
}

async function fetchYoutubeSearch(
  params: YoutubeSearchParams,
): Promise<YoutubeVideoItem[]> {
  const currentRadius = calculateRadiusFromZoom(params.currentZoom ?? 10);
  const queryParams = {
    part: 'snippet',
    relevanceLanguage: 'es',
    maxResults: params.maxResults ?? 50,
    q: params.searchQuery ?? 'travel',
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
      longitude: detailedVideo.recordingDetails?.location?.longitude ?? 0,
      latitude: detailedVideo.recordingDetails?.location?.latitude ?? 0,
      fetchedAt,
    });
  }

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
  const videos = await fetchAndIngestVideos(params);
  return {
    total: videos.length,
    videos,
  };
}
