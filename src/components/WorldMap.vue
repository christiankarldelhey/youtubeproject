<script setup lang="ts">
  import L from 'leaflet';
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import 'leaflet.markercluster';
  import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
  import { ref, computed, watch } from 'vue';
  import { useMap } from '../composables/useMap';
  import type { VideoItem, VideoMarker } from '../types/Map';
  import { useMapStore } from '../store/mapStore';

  window.L = L;

  const props = defineProps<{
    videos: VideoItem[],
  }>();

  const mapStore = useMapStore();

  const mapOptions = {
    stadia: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    carto: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    openstreetmap: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    google: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  }

  const { initializeLeaflet } = useMap();
  initializeLeaflet();

  const mapRef = ref();

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

  const moveMapCenter = () => {
    console.log('move map center');
    if (mapRef.value?.leafletObject) {
      const mapCenter = mapRef.value.leafletObject.getCenter();
      mapStore.setCenter([mapCenter.lat, mapCenter.lng]);
      mapStore.setZoom(mapRef.value.leafletObject.getZoom());
    }
  };

  const onMapReady = () => {
    console.log('map ready');
  };

watch(() => mapStore.bbox, (bbox) => {
  if (mapRef.value?.leafletObject && bbox) {
    mapRef.value.leafletObject.fitBounds(L.latLngBounds(
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]]
    ));
  }
});

</script>

<template>
  <l-map 
    ref="mapRef" 
    v-model:zoom="mapStore.zoom" 
    :center="mapStore.center"
    @moveend="moveMapCenter"
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