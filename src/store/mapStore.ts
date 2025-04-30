import { defineStore } from 'pinia';
import type { MapStoreState, zoom, center, selectedPin, bbox, SearchOption } from '../types/Map';

export const useMapStore = defineStore('map', {
  state: () => ({
    zoom: 2,
    center: [47.41322, -1.219482] as [number, number],
    selectedPin: null,
    flyToTarget: null as { center: center; zoom?: zoom, bbox?: bbox } | null,
    dialogOpen: false,
    showSearchButton: false,
    selectedOption: { value: 'search', expanded: false },
    searchQuery: { value: 'travel', icon: 'MapIcon' },
    showMobileVideoDetail: false,
  }) as MapStoreState,
  actions: {
    setSelectedOption(value: 'search' | 'favorites', expanded: boolean): void {
      this.selectedOption = { value, expanded };
    },
    setSearchQuery(query: SearchOption): void {
      this.searchQuery = query;
    },
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
    setShowSearchButton(value: boolean): void {
      this.showSearchButton = value;
    },
    triggerFlyTo(center: center, zoom?: zoom, bbox?: bbox) {
      this.flyToTarget = { center, zoom, bbox };
    },
    clearFlyToTarget() {
      this.flyToTarget = null;
    },
    clearSelectedPin() {
      console.log('clearing selected pin');
      this.selectedPin = null;
    },
    setMobileVideoDetail(value: boolean): void {
      this.showMobileVideoDetail = value;
    },
  },
});
