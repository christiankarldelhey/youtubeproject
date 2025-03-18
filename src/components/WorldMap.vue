<script setup lang="ts">
  import L from 'leaflet';
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import 'leaflet.markercluster';
  import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
  import { ref, watch, onMounted } from 'vue';
  import { useMap } from '../composables/useMap';
  import { Progress } from '@/components/ui/progress'
  import type { VideoMarker } from '../types/Map';
  import { useMapStore } from '../store/mapStore';

  const props = defineProps<{
    videos: VideoMarker[],
  }>();

  const mapStore = useMapStore();
  const { initializeLeaflet, getUserLocation, mapsList } = useMap();
  const mapRef = ref();
  const mapReady = ref(false);

  const moveMapCenter = () => {
    if (mapStore.flyToTarget) {
      console.log('esta en movimiento automatico');
      return;
    } 
    console.log('move map center');
    if (mapRef.value?.leafletObject) {
      console.log('es movimiento manual');
      // New position from map
      const mapCenter = mapRef.value.leafletObject.getCenter();
      const zoom = mapRef.value.leafletObject.getZoom();
      //Update new position in PINIA
      mapStore.setCenter([mapCenter.lat, mapCenter.lng]);
      mapStore.setZoom(zoom);
    }
  };

  const onMapReady = () => {
  console.log('map ready');
};

  // Fly to a place
  watch(
  () => mapStore.flyToTarget,
  (target) => {
    if (!target) return;
    if (target?.bbox && mapRef.value?.leafletObject) {
      mapRef.value.leafletObject.fitBounds(L.latLngBounds(
        [target.bbox[1], target.bbox[0]],
        [target.bbox[3], target.bbox[2]]
      ));
    }
    mapStore.setZoom(target?.zoom ?? 12);
    mapStore.setCenter(target?.center ?? [0, 0]);
    mapStore.clearFlyToTarget();
  }
);

const selectVideo = (video: VideoMarker) => {
  mapStore.selectPin(video);
}

const openVideo = () => {
  mapRef.value?.leafletObject.closePopup();
  mapStore.setDialogOpen(true);
};

onMounted(async () => {
  initializeLeaflet();
  try {
    const { latitude, longitude } = await getUserLocation();
    mapStore.setCenter([latitude, longitude]);
    mapStore.setZoom(12);
  } catch {
    mapStore.setZoom(2);
  } finally {
    mapReady.value = true;
  }
});

</script>

<template>
  <l-map 
    v-if="mapReady"
    ref="mapRef" 
    v-model:zoom="mapStore.zoom" 
    :center="mapStore.center"
    @moveend="moveMapCenter"
    @ready="onMapReady">
    <l-tile-layer
      :url="mapsList.stadia2"
      layer-type="base"
      name="map"
    ></l-tile-layer>
    <l-marker-cluster-group>
      <l-marker 
      v-for="marker in props.videos"
      :key="marker.videoId"
      :selected="mapStore.selectedPin === marker"
      @click="selectVideo(marker)"
      :lat-lng="marker.position">
      <l-popup 
        @click="openVideo(marker)" 
        class="relative cursor-pointer"> 
          <p class="text-gray-300">{{ marker.location?.toUpperCase() }}</p>
          <div class="relative w-64 h-36 overflow-hidden rounded">
            <img 
            :src="marker.thumbnail" 
            alt="Video Thumbnail"
            class="w-full h-full object-cover" />
        </div>
        <p>{{ marker.title }}</p>
      </l-popup>
    </l-marker>
    </l-marker-cluster-group>
  </l-map>
  <div v-else class="flex justify-center items-center bg-background w-full h-full">
    <div class="flex flex-col items-center">
      <p class="text-base text-primary">Loading map...</p>
      <Progress class="w-64" :model-value="33" />
    </div>
  </div>
</template>

<style>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  z-index: 1;
}

</style>