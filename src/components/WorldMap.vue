<script setup lang="ts">
  import L from 'leaflet';
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import 'leaflet.markercluster';
  import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
  import { ref, computed, watch } from 'vue';
  import { useMap } from '../composables/useMap';
  import type { VideoItem, VideoMarker } from '../types/Map';

  window.L = L;

  const mapOptions = {
    stadia: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    carto: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    openstreetmap: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    google: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  }

  const props = defineProps<{
    videos: VideoItem[],
    currentBox?: [number, number, number, number],
    currentZoom?: number
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
        location: video.recordingDetails.locationDescription,
        title: video.snippet.title,
        description: video.snippet.description,
        videoId: video.id.videoId,
        thumbnail: video.snippet.thumbnails.high.url
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

  watch(() => props.currentBox, (bbox) => {
  if (mapRef.value?.leafletObject) {
    const map = mapRef.value.leafletObject;

    if (bbox) {
      const bounds = L.latLngBounds(
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]] 
      );
      map.fitBounds(bounds);
    } else {
      map.flyTo(center.value, zoom.value);
    }
  }
});

</script>

<template>
  <l-map 
    ref="mapRef" 
    v-model:zoom="zoom" 
    :center="center"
    @moveend="getMapCenter"
    @ready="onMapReady">
    <l-tile-layer
      :url="mapOptions.stadia"
      layer-type="base"
      name="map"
    ></l-tile-layer>
    <l-marker-cluster-group>
      <l-marker 
      v-for="marker in videoMarkers"
      :key="marker.videoId"
      :lat-lng="marker.position">
      <l-popup class="flex justify-center"> 
        <a 
        :href="`https://www.youtube.com/watch?v=${marker.videoId}`" 
        target="_blank">
          <p class="text-gray-300">{{ marker.location?.toUpperCase() }}</p>
          <div class="relative w-64 h-36 overflow-hidden rounded">
            <img 
            :src="marker.thumbnail" 
            alt="Video Thumbnail"
            class="w-full h-full object-cover" />
        </div>
        <p>{{ marker.title }}</p>
      </a>
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