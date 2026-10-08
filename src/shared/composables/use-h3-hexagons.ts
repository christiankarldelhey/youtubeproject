import L from 'leaflet'
import * as h3 from 'h3-js'
import type { VideoMarker } from '@/entities/youtube-video'

/**
 * Get H3 resolution based on map zoom level
 * Granular mapping aligned with H3 cell sizes
 */
export function getH3ResolutionForZoom(zoom: number): number {
  if (zoom <= 2) return 1  // ~2,000,000 km² - global
  if (zoom <= 3) return 2  // ~86,000 km²   - continental
  if (zoom <= 4) return 3  // ~12,000 km²   - country
  if (zoom <= 5) return 4  // ~1,700 km²    - region
  if (zoom <= 6) return 5  // ~250 km²      - large city
  if (zoom <= 8) return 6  // ~36 km²       - city
  if (zoom <= 10) return 7 // ~5 km²        - neighborhood
  if (zoom <= 12) return 8 // ~0.7 km²      - block
  return 9                 // ~0.1 km²      - detail
}

/**
 * Convert latitude/longitude to H3 cell index
 */
export function latLngToH3(lat: number, lng: number, resolution: number): string {
  return h3.latLngToCell(lat, lng, resolution)
}

/**
 * Convert H3 cell index to Leaflet polygon coordinates
 */
export function h3ToPolygon(h3Index: string): L.LatLng[] {
  const boundary = h3.cellToBoundary(h3Index)
  return boundary.map(([lat, lng]) => L.latLng(lat, lng))
}

/**
 * Calculate video density for a specific H3 cell
 */
export function calculateVideoDensity(videos: VideoMarker[], h3Index: string): number {
  return videos.filter((video) => {
    if (!video.position) return false
    const videoH3 = latLngToH3(video.position[0], video.position[1], h3GetResolution(h3Index))
    return videoH3 === h3Index
  }).length
}

/**
 * Get H3 resolution from an H3 index
 */
export function h3GetResolution(h3Index: string): number {
  return h3.getResolution(h3Index)
}

/**
 * Get color based on video density (light red → dark red)
 */
export function getDensityColor(count: number, maxCount: number): string {
  if (count === 0) return 'transparent'
  
  // Normalize count to 0-1 range based on maxCount
  const normalized = Math.min(count / Math.max(maxCount, 1), 1)
  
  // Color scale from light red (#ff9999) to very dark red (#cc0000)
  // Light red: rgb(255, 153, 153)
  // Medium red: rgb(255, 102, 102)
  // Dark red: rgb(255, 51, 51)
  // Very dark red: rgb(204, 0, 0)
  
  if (normalized < 0.25) return '#ff9999' // light red
  if (normalized < 0.5) return '#ff6666' // medium red
  if (normalized < 0.75) return '#ff3333' // dark red
  return '#cc0000' // very dark red
}

/**
 * Generate hexagons for videos, grouping them by H3 cell
 */
export function generateHexagonsForVideos(
  videos: VideoMarker[],
  resolution: number
): Map<string, VideoMarker[]> {
  const hexagonMap = new Map<string, VideoMarker[]>()
  
  videos.forEach((video) => {
    if (!video.position) return
    
    const h3Index = latLngToH3(video.position[0], video.position[1], resolution)
    
    if (!hexagonMap.has(h3Index)) {
      hexagonMap.set(h3Index, [])
    }
    
    hexagonMap.get(h3Index)!.push(video)
  })
  
  return hexagonMap
}

/**
 * Get videos in a specific H3 cell
 */
export function getVideosInH3Cell(
  videos: VideoMarker[],
  h3Index: string,
  resolution: number
): VideoMarker[] {
  return videos.filter((video) => {
    if (!video.position) return false
    const videoH3 = latLngToH3(video.position[0], video.position[1], resolution)
    return videoH3 === h3Index
  })
}

/**
 * Get all H3 cells that should be rendered based on current map bounds
 */
export function getVisibleH3Cells(
  bounds: L.LatLngBounds,
  resolution: number
): string[] {
  const southWest = bounds.getSouthWest()
  const northEast = bounds.getNorthEast()
  
  // Get H3 cells covering the bounding box
  const cells = h3.polygonToCells([
    [
      [southWest.lat, southWest.lng],
      [southWest.lat, northEast.lng],
      [northEast.lat, northEast.lng],
      [northEast.lat, southWest.lng],
      [southWest.lat, southWest.lng],
    ]
  ], resolution)
  
  return cells
}

/**
 * Get children of an H3 cell at the next finer resolution
 */
export function getH3Children(h3Index: string): string[] {
  const currentResolution = h3GetResolution(h3Index)
  return h3.cellToChildren(h3Index, currentResolution + 1)
}

/**
 * Get parent of an H3 cell at the next coarser resolution
 */
export function getH3Parent(h3Index: string): string {
  const currentResolution = h3GetResolution(h3Index)
  return h3.cellToParent(h3Index, currentResolution - 1)
}

/**
 * Generate child hexagons for a specific parent H3 cell
 */
export function generateChildHexagons(
  videos: VideoMarker[],
  parentH3Index: string,
  childResolution: number
): Map<string, VideoMarker[]> {
  const hexagonMap = new Map<string, VideoMarker[]>()
  
  // Get all child cells of the parent
  const childCells = getH3Children(parentH3Index)
  
  videos.forEach((video) => {
    if (!video.position) return
    
    const videoH3 = latLngToH3(video.position[0], video.position[1], childResolution)
    
    // Only include if the video is in one of the child cells
    if (childCells.includes(videoH3)) {
      if (!hexagonMap.has(videoH3)) {
        hexagonMap.set(videoH3, [])
      }
      
      hexagonMap.get(videoH3)!.push(video)
    }
  })
  
  return hexagonMap
}
