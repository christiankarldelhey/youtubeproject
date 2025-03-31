export type zoom = number;
export type center = [number, number];
export type selectedPin = VideoMarker | null;
export type bbox = [number, number, number, number] | null;

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
    locationDescription?: string;
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

  export type GoToLocationOptions = {
    coordinates: [number, number];
    bbox?: [number, number, number, number];
    zoom?: number;
  };

  export type MapStoreState = { 
    zoom: zoom;
    center: center;
    dialogOpen: boolean;
    selectedPin: selectedPin;
    favoriteVideos?: VideoMarker[];
    showSearchButton: boolean;
    flyToTarget: { center: center; zoom?: zoom, bbox?: bbox } | null;
  };
  
  export interface FetchYoutubeParams {
    latitude?: number;
    longitude?: number;
    radius?: string;
    maxResults?: number;
    apiKey: string;
    currentMapPosition?: number[];
    currentZoom?: number;
  }

  export interface VideoMarker {
    position: [number, number];
    title: string;
    videoId: string;
    location?: string;
    description?: string;
    thumbnail?: string;
    favorited?: boolean;
  }