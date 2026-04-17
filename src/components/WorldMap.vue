<script setup lang="ts">
import L from 'leaflet';
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { ref, watch, onMounted } from 'vue';
import { useMap } from '../composables/useMap';
import { useMobile } from '../composables/useMobile';
import Spinner from './Spinner.vue'
import { useMapStore } from '../store/mapStore';

const { isMobile } = useMobile();

const mapStore = useMapStore();
const { initializeLeaflet, getUserLocation, mapsList } = useMap();
const mapRef = ref();
const mapReady = ref(false);

const moveMapCenter = () => {
  if (mapStore.flyToTarget) {
    return;
  } 
  if (mapRef.value?.leafletObject) {
    const mapCenter = mapRef.value.leafletObject.getCenter();
    const zoom = mapRef.value.leafletObject.getZoom();
    mapStore.setCenter([mapCenter.lat, mapCenter.lng]);
    mapStore.setZoom(zoom);
  }
};

const onMapReady = () => {
  const map = mapRef.value.leafletObject;
  if (!map) return;
  if (!isMobile) {
    map.zoomControl.setPosition('bottomright');
  } else {
    map.removeControl(map.zoomControl);
  }
};

watch(
  () => mapStore.flyToTarget,
  (target) => {
    if (!target || !mapRef.value?.leafletObject) return;

    if (target?.bbox) {
      mapRef.value.leafletObject.fitBounds(L.latLngBounds(
        [target.bbox[1], target.bbox[0]],
        [target.bbox[3], target.bbox[2]]
      ));
    } else {
      mapRef.value.leafletObject.flyTo(target.center, target.zoom ?? 12, 
      {
        animate: true,
        duration: 2.5,
        easeLinearity: 0.1,
      });
    }
    mapStore.setZoom(target?.zoom ?? 12);
    mapStore.setCenter(target?.center ?? [0, 0]);
    mapStore.clearFlyToTarget();
  }
);

onMounted(async () => {
  initializeLeaflet();
  try {
    const { latitude, longitude } = await getUserLocation();
    mapStore.setCenter([latitude, longitude]);
    mapStore.setZoom(13);
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
      :url="mapsList.carto"
      layer-type="base"
      name="map"
    />
  </l-map>
  
  <div v-else class="flex justify-center items-center bg-background w-full h-full">
    <div class="flex flex-col items-center">
      <p class="text-base text-primary">{{ $t('loading_map') }}</p>
      <Spinner class="mt-2" />
    </div>
  </div>
</template>

<style>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  z-index: 1;
}
:deep(.leaflet-pane.leaflet-popup-pane) {
  z-index: 100000 !important;
}
</style>
