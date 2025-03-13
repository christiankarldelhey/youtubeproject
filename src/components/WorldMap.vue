<script setup lang="ts">
  import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
  import { ref } from 'vue';
  import { useMap } from '../composables/useMap';
  import type { VideoItem } from '../types/Map';

  defineProps<{
    videos: VideoItem[]
  }>();

  const emit = defineEmits(['map-center-changed']);

  const { initializeLeaflet } = useMap();
  initializeLeaflet();
  const zoom = ref(2);
  const mapRef = ref();
  const currentMapPosition = ref([47.41322, -1.219482]);

  const logMapCenter = () => {
    console.log('map moved');
    if (mapRef.value?.leafletObject) {
      const center = mapRef.value.leafletObject.getCenter();
      console.log(`Latitude: ${center.lat}, Longitude: ${center.lng}`);
      currentMapPosition.value = [center.lat, center.lng];
      emit('map-center-changed', currentMapPosition.value, zoom.value);
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
    :center="[47.41322, -1.219482]"
    @moveend="logMapCenter"
    @ready="onMapReady">
    <l-tile-layer
      url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      layer-type="base"
      name="Stadiamaps"
    ></l-tile-layer>
  </l-map>
</template>

<style>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
}
</style>