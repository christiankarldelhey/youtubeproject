import axios from 'axios'
import type { VideoMarker, FetchYoutubeParams } from '../model/youtube-video.types'

const BACKEND_ENDPOINT = 'http://localhost:4000'

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
