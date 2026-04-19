<script setup lang="ts">
import L from 'leaflet';
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { ref, watch, onMounted } from 'vue';
import { useMap } from '../composables/useMap';
import { useAlerts } from '../composables/useAlerts';
import { useMobile } from '../composables/useMobile';
import Spinner from './Spinner.vue'
import { useMapStore } from '../store/mapStore';

const { isMobile } = useMobile();

const mapStore = useMapStore();
const { initializeLeaflet, getUserLocation, mapsList } = useMap();
const { alerts, loading: loadingAlerts, error: alertsError, lastFetchedAt, fetchAlerts } = useAlerts();
const mapRef = ref();
const mapReady = ref(false);

const formatDate = (value: string | null): string => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
};

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

  await fetchAlerts();
});
</script>

<template>
  <div class="relative w-full h-full">
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

    <div
      v-if="mapReady"
      class="absolute top-4 left-4 z-[1200] w-[20rem] max-h-[70vh] overflow-hidden rounded-lg border bg-white/95 shadow-xl"
      :class="isMobile ? 'w-[16rem]' : 'w-[20rem]'"
    >
      <div class="flex items-center justify-between border-b px-3 py-2">
        <h3 class="text-sm font-semibold text-slate-900">Weather Alerts ({{ alerts.length }})</h3>
        <button
          class="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingAlerts"
          @click="fetchAlerts()"
        >
          {{ loadingAlerts ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div class="max-h-[58vh] overflow-auto p-3">
        <p v-if="alertsError" class="text-xs text-red-600">{{ alertsError }}</p>
        <p v-else-if="loadingAlerts" class="text-xs text-slate-500">Loading alerts from backend...</p>
        <p v-else-if="alerts.length === 0" class="text-xs text-slate-500">No alerts found in database.</p>

        <ul v-else class="space-y-2">
          <li
            v-for="alert in alerts"
            :key="alert.id"
            class="rounded border border-slate-200 bg-slate-50 p-2"
          >
            <p class="line-clamp-2 text-xs font-medium text-slate-900">{{ alert.title }}</p>
            <p class="mt-1 text-[11px] text-slate-600">
              {{ alert.provider }} · {{ alert.severity ?? 'unknown severity' }}
            </p>
            <p class="mt-1 text-[11px] text-slate-500">Updated: {{ formatDate(alert.updatedAtSource) }}</p>
          </li>
        </ul>

        <p v-if="lastFetchedAt" class="mt-3 text-[10px] text-slate-400">
          Last fetch: {{ formatDate(lastFetchedAt) }}
        </p>
      </div>
    </div>

    <div v-else class="flex justify-center items-center bg-background w-full h-full">
      <div class="flex flex-col items-center">
        <p class="text-base text-primary">{{ $t('loading_map') }}</p>
        <Spinner class="mt-2" />
      </div>
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
