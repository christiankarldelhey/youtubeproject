// Video types
export interface VideoLocation {
  latitude: number;
  longitude: number;
}

export interface Video {
  id: number;
  video_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  channel_name?: string;
  published_at?: Date;
  view_count?: number;
  location_description?: string;
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
}

export interface VideoWithGIS extends Video {
  nearby_pois?: number;
  discovery_score?: number;
  destination_type?: string;
}

// OSM POI types
export interface OsmPoi {
  id: number;
  osm_id: bigint;
  osm_type: string;
  name?: string;
  category: string;
  subcategory?: string;
  tags: Record<string, any>;
  latitude: number;
  longitude: number;
  created_at: Date;
}

// API Request/Response types
export interface BboxParams {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface VideoQueryParams extends Partial<BboxParams> {
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
