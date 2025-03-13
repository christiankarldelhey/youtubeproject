<script setup lang="ts">
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import { ref, computed } from 'vue';
  import { useMap } from '../composables/useMap';
  import type { VideoItem } from '../types/Map';

  const props = defineProps<{
    videos: VideoItem[]
  }>();

  const emit = defineEmits(['map-center-changed']);

  const { initializeLeaflet } = useMap();
  initializeLeaflet();

  const zoom = ref(2);
  const mapRef = ref();
  const center = ref<[number, number]>([47.41322, -1.219482]);

  interface VideoMarker {
    position: [number, number];
    title: string;
    videoId: string;
  }

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
    <l-marker 
      v-for="marker in videoMarkers"
      :key="marker.videoId"
      :lat-lng="marker.position">
      <l-popup> 
        <a :href="`https://www.youtube.com/watch?v=${marker.videoId}`" target="_blank">{{ marker.title }}</a>
      </l-popup>
    </l-marker>
  </l-map>
</template>

<style>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>