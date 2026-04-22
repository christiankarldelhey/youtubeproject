export interface VideoSnippet {
  title: string
  description: string
  thumbnails: {
    default: { url: string }
    medium: { url: string }
    high: { url: string }
  }
}

export interface RecordingDetails {
  recordingDate?: string
  location?: {
    latitude: number
    longitude: number
    altitude?: number
  }
  locationDescription?: string
}

export interface Statistics {
  viewCount: string
  likeCount: string
  commentCount: string
  favoriteCount?: string
}

export interface VideoItem {
  id: {
    videoId: string
  }
  snippet: VideoSnippet
}

export interface DetailedVideoItem {
  id: string
  snippet: VideoSnippet
  recordingDetails?: RecordingDetails
  topicDetails?: {
    topicCategories: string[]
  }
  statistics?: Statistics
}

export interface YoutubeApiResponse {
  items: VideoItem[]
}

export interface YoutubeDetailedApiResponse {
  items: DetailedVideoItem[]
}

export interface FetchYoutubeParams {
  maxResults?: number
  apiKey: string
  currentMapPosition?: [number, number]
  currentZoom?: number
  searchQuery?: string
}

export interface SearchOption {
  value: string
  icon: string
}

export interface VideoMarker {
  position: [number, number]
  title: string
  videoId: string
  location?: string
  description?: string
  thumbnail?: string
  favorited?: boolean
}
