<script setup lang="ts">
  import L from 'leaflet';
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import 'leaflet.markercluster';
  import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
  import { ref, computed, watch } from 'vue';
  import { useMap } from '../composables/useMap';
  import type { VideoItem, VideoMarker } from '../types/Map';

  window.L = L;

  const props = defineProps<{
    videos: VideoItem[],
    currentBox?: [number, number, number, number]
  }>();

  const emit = defineEmits(['map-center-changed']);

  const { initializeLeaflet } = useMap();
  initializeLeaflet();

  const zoom = ref(2);
  const mapRef = ref();
  const center = ref<[number, number]>([47.41322, -1.219482]);

  const videoMarkers = computed<VideoMarker[]>(() => {
    return props.videos
      .filter((video): video is VideoItem & { recordingDetails: { location: { latitude: number; longitude: number } } } => 
        typeof video.recordingDetails?.location?.latitude === 'number' && 
        typeof video.recordingDetails?.location?.longitude === 'number'
      )
      .map(video => ({
        position: [
          video.recordingDetails.location.latitude,
          video.recordingDetails.location.longitude
        ],
        title: video.snippet.title,
        videoId: video.id.videoId
      }));
  });

  const getMapCenter = () => {
    if (mapRef.value?.leafletObject) {
      const mapCenter = mapRef.value.leafletObject.getCenter();
      center.value = [mapCenter.lat, mapCenter.lng];
      emit('map-center-changed', center.value, zoom.value);
    }
  };

  const onMapReady = () => {
    console.log('map ready');
  };

//   watch([() => props.currentBox, videoMarkers], ([bbox, markers]) => {
//   if (mapRef.value?.leafletObject) {
//     const map = mapRef.value.leafletObject;

//     if (bbox) {
//       // If bbox is provided, fit the map to the bounding box
//       const bounds = L.latLngBounds(
//         [bbox[0], bbox[1]], // Southwest
//         [bbox[2], bbox[3]]  // Northeast
//       );
//       map.fitBounds(bounds);
//     } else if (markers.length > 0) {
//       // If no bbox but markers exist, fit the map to marker bounds
//       const markerBounds = L.latLngBounds(markers.map(marker => marker.position));
//       map.fitBounds(markerBounds);
//     } else {
//       // Fallback to a default view
//       map.setView(center.value, zoom.value);
//     }
//   }
// });
</script>

<template>
  <l-map 
    ref="mapRef" 
    v-model:zoom="zoom" 
    :center="center"
    @moveend="getMapCenter"
    @ready="onMapReady">
    <l-tile-layer
      url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      layer-type="base"
      name="Stadiamaps"
    ></l-tile-layer>
    <l-marker-cluster-group>
      <l-marker 
      v-for="marker in videoMarkers"
      :key="marker.videoId"
      :lat-lng="marker.position">
      <l-popup> 
        <a :href="`https://www.youtube.com/watch?v=${marker.videoId}`" target="_blank">{{ marker.title }}</a>
      </l-popup>
    </l-marker>
    </l-marker-cluster-group>
  </l-map>
</template>

<style>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>