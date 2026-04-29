import { defineStore } from 'pinia'
import type { Bbox, Center, MapStoreState, Zoom } from './map.types'

export const useMapStore = defineStore('map', {
  state: () => ({
    zoom: 2,
    center: [47.41322, -1.219482] as [number, number],
    flyToTarget: null as { center: Center; zoom?: Zoom; bbox?: Bbox } | null,
    bboxRestriction: null as Bbox,
    minZoom: null as number | null,
    selectedH3Index: null as string | null,
  }) as MapStoreState,
  actions: {
    setZoom(newZoom: Zoom): void {
      this.zoom = newZoom
    },
    setCenter(newCenter: Center): void {
      this.center = newCenter
    },
    triggerFlyTo(center: Center, zoom?: Zoom, bbox?: Bbox) {
      this.flyToTarget = { center, zoom, bbox }
    },
    clearFlyToTarget() {
      this.flyToTarget = null
    },
    setBboxRestriction(bbox: Bbox): void {
      this.bboxRestriction = bbox
    },
    clearBboxRestriction(): void {
      this.bboxRestriction = null
    },
    setMinZoom(minZoom: number | null): void {
      this.minZoom = minZoom
    },
    clearMinZoom(): void {
      this.minZoom = null
    },
    setSelectedH3Index(index: string | null): void {
      this.selectedH3Index = index
    },
    clearSelectedH3Index(): void {
      this.selectedH3Index = null
    },
  },
})
