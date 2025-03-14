export interface VideoSnippet {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  }
  
  export interface RecordingDetails {
    recordingDate?: string;
    location?: {
      latitude: number;
      longitude: number;
      altitude: number;
    };
  }
  
  export interface VideoItem {
    id: {
      videoId: string;
    };
    snippet: VideoSnippet;
    recordingDetails?: RecordingDetails;
    topicDetails?: {
      topicCategories: string[];
    };
  }
  
  export interface DetailedVideoItem {
    id: string;
    snippet: VideoSnippet;
    recordingDetails: RecordingDetails;
    topicDetails: {
      topicCategories: string[];
    };
  }
  
  export interface YoutubeApiResponse {
    items: VideoItem[];
  }
  
  export interface YoutubeDetailedApiResponse {
    items: DetailedVideoItem[];
  }
  
  export interface FetchYoutubeParams {
    latitude?: number;
    longitude?: number;
    radius?: string;
    maxResults?: number;
    apiKey: string;
    currentMapPosition?: number[];
    currentRadius?: string;
  }

  export interface VideoMarker {
    position: [number, number];
    title: string;
    videoId: string;
    thumbnail?: string;
  }