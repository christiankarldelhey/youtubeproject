import { defineStore } from 'pinia'
import type { Bbox, Center, MapStoreState, Zoom } from './map.types'

export const useMapStore = defineStore('map', {
  state: () => ({
    zoom: 2,
    center: [47.41322, -1.219482] as [number, number],
    flyToTarget: null as { center: Center; zoom?: Zoom; bbox?: Bbox } | null,
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
  },
})
