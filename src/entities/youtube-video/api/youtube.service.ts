import axios from 'axios'
import type {
  DetailedVideoItem,
  VideoMarker,
  YoutubeApiResponse,
  YoutubeDetailedApiResponse,
  FetchYoutubeParams,
} from '../model/youtube-video.types'
import { calculateRadiusFromZoom } from '../lib/radius'

const SEARCH_ENDPOINT = 'https://youtube.googleapis.com/youtube/v3/search'
const DETAILS_ENDPOINT = 'https://youtube.googleapis.com/youtube/v3/videos'
const BACKEND_ENDPOINT = 'http://localhost:4000'

export const fetchVideoDetails = async (
  videoIds: string[],
  apiKey: string,
): Promise<DetailedVideoItem[]> => {
  if (!videoIds.length) {
    return []
  }

  const params = {
    part: 'snippet,recordingDetails,topicDetails,statistics',
    id: videoIds.join(','),
    key: apiKey,
  }

  const { data } = await axios.get<YoutubeDetailedApiResponse>(DETAILS_ENDPOINT, { params })
  return data.items
}

export const fetchYoutubeMarkers = async ({
  maxResults = 50,
  apiKey,
  searchQuery,
  currentMapPosition,
  currentZoom,
}: FetchYoutubeParams): Promise<VideoMarker[]> => {
  const currentRadius = calculateRadiusFromZoom(currentZoom ?? 10)
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
  }

  const { data } = await axios.get<YoutubeApiResponse>(SEARCH_ENDPOINT, { params })
  const videoIds = data.items.map((item) => item.id.videoId)
  const detailedVideos = await fetchVideoDetails(videoIds, apiKey)

  return data.items.map((item) => {
    const detailedVideo = detailedVideos.find((video) => video.id === item.id.videoId)
    return {
      position: [
        detailedVideo?.recordingDetails?.location?.latitude ?? 0,
        detailedVideo?.recordingDetails?.location?.longitude ?? 0,
      ],
      location: detailedVideo?.recordingDetails?.locationDescription ?? 'Unknown',
      title: detailedVideo?.snippet.title ?? '',
      description: detailedVideo?.snippet.description ?? '',
      videoId: detailedVideo?.id ?? item.id.videoId,
      thumbnail: detailedVideo?.snippet.thumbnails.high.url ?? '',
      favorited: false,
    }
  })
}

export const fetchVideosFromBackend = async ({
  apiKey,
  currentMapPosition,
  currentZoom,
  searchQuery,
  category,
}: FetchYoutubeParams & { category?: string }): Promise<VideoMarker[]> => {
  const { data } = await axios.post<{ total: number; videos: VideoMarker[] }>(
    `${BACKEND_ENDPOINT}/api/videos/search`,
    {
      apiKey,
      currentMapPosition,
      currentZoom,
      searchQuery,
      category,
    },
  )

  return data.videos
}
