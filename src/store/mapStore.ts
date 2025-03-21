import { defineStore } from 'pinia';
import type { MapStoreState, zoom, center, selectedPin, bbox, VideoMarker } from '../types/Map';

export const useMapStore = defineStore('map', {
  state: () => ({
    zoom: 2,
    center: [47.41322, -1.219482] as [number, number],
    selectedPin: null,
    flyToTarget: null as { center: center; zoom?: zoom, bbox?: bbox } | null,
    dialogOpen: false,
    favoriteVideos: [] as VideoMarker[],
  }) as MapStoreState,
  actions: {
    setZoom(newZoom: zoom): void {
      this.zoom = newZoom;
    },
    setCenter(newCenter: center): void {
      this.center = newCenter;
    },
    selectPin(pinId: selectedPin): void {
      this.selectedPin = pinId;
    },
    setDialogOpen(value: boolean): void {
      this.dialogOpen = value;
    },
    triggerFlyTo(center: center, zoom?: zoom, bbox?: bbox) {
      this.flyToTarget = { center, zoom, bbox };
    },
    clearFlyToTarget() {
      this.flyToTarget = null;
    },
    clearSelectedPin() {
      this.selectedPin = null;
    },
    setSelectedPinAsFavorite(value: boolean) { 
      console.log('hola'); 
      if (this.selectedPin) {
        this.selectedPin.favorited = value;
        if (value) {
          console.log('agrega');
          this.favoriteVideos?.push(this.selectedPin);
        } else {
          console.log('quita');
          this.favoriteVideos = this.favoriteVideos?.filter(v => v.videoId !== this.selectedPin?.videoId);
        }
      }
    },
  },
});
