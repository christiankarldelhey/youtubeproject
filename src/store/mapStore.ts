import { defineStore } from 'pinia';
import type { MapStoreState, zoom, center, selectedPin, bbox } from '../types/Map';

export const useMapStore = defineStore('map', {
  state: () => ({
    zoom: 2,
    center: [47.41322, -1.219482],
    bbox: null,
    selectedPin: null,
  }) as MapStoreState,
  actions: {
    setZoom(newZoom: zoom): void {
      this.zoom = newZoom;
    },
    setCenter(newCenter: center): void {
      this.center = newCenter;
    },
    setBBox(newBBox: bbox): void {
      this.bbox = newBBox;
    },
    selectPin(pinId: selectedPin): void {
      this.selectedPin = pinId;
    },
  },
});
