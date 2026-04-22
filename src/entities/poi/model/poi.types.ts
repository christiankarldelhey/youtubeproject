export type OverpassBbox = [number, number, number, number]

export interface FetchPoisParams {
  bbox: OverpassBbox
  topic?: string
  timeoutMs?: number
  maxResults?: number
}

export interface PoiMarker {
  id: string
  position: [number, number]
  name: string
  description: string
  primaryTag?: string
  source: 'osm'
}

export interface OverpassElement {
  id: number
  type: 'node' | 'way' | 'relation'
  lat?: number
  lon?: number
  center?: {
    lat: number
    lon: number
  }
  tags?: Record<string, string>
}

export interface OverpassResponse {
  elements: OverpassElement[]
}
