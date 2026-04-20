<script setup lang="ts">
import L from 'leaflet';
import { LMap, LMarker, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useMap } from '../composables/useMap';
import { useAlerts } from '../composables/useAlerts';
import { useWeatherIcon } from '../composables/useWeatherIcon';
import { useMobile } from '../composables/useMobile';
import Spinner from './Spinner.vue'
import { useMapStore } from '../store/mapStore';
import type { CityWeatherCurrent } from '../types/Alert';

const { isMobile } = useMobile();
const { resolveWeatherIcon } = useWeatherIcon();

const mapStore = useMapStore();
const { initializeLeaflet, getUserLocation, mapsList } = useMap();
const {
  weather,
  loading: loadingWeather,
  error: weatherError,
  mqttStatus,
  lastFetchedAt,
  fetchCurrentWeather,
  connectRealtime,
  disconnectRealtime,
} = useAlerts();
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

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createWeatherMarkerIcon = (city: CityWeatherCurrent): L.Icon<L.IconOptions> => {
  const { iconUrl, key } = resolveWeatherIcon(city.weatherCode, city.cloudCover);
  const temperatureLabel = `${city.temperatureC.toFixed(1)}°C`;
  const cityName = escapeHtml(city.cityName);

  return L.divIcon({
    className: 'weather-marker-wrapper',
    html: `
      <div class="weather-marker" title="${cityName}">
        <img class="weather-marker__icon" src="${iconUrl}" alt="${key}" />
        <span class="weather-marker__temp">${temperatureLabel}</span>
      </div>
    `,
    iconSize: [56, 72],
    iconAnchor: [28, 66],
  }) as unknown as L.Icon<L.IconOptions>;
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

  await fetchCurrentWeather();
  connectRealtime();
});

onUnmounted(() => {
  disconnectRealtime();
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

      <l-marker
        v-for="city in weather"
        :key="`marker-${city.cityKey}-${city.updatedAt}`"
        :lat-lng="[city.latitude, city.longitude]"
        :icon="createWeatherMarkerIcon(city)"
      />
    </l-map>

    <div
      v-if="mapReady"
      class="absolute top-4 left-4 z-[1200] w-[20rem] max-h-[70vh] overflow-hidden rounded-lg border bg-white/95 shadow-xl"
      :class="isMobile ? 'w-[16rem]' : 'w-[20rem]'"
    >
      <div class="flex items-center justify-between border-b px-3 py-2">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">City Weather ({{ weather.length }})</h3>
          <p class="text-[10px] text-slate-500">MQTT: {{ mqttStatus }}</p>
        </div>
        <button
          class="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingWeather"
          @click="fetchCurrentWeather()"
        >
          {{ loadingWeather ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div class="max-h-[58vh] overflow-auto p-3">
        <p v-if="weatherError" class="text-xs text-red-600">{{ weatherError }}</p>
        <p v-else-if="loadingWeather" class="text-xs text-slate-500">Loading weather from backend...</p>
        <p v-else-if="weather.length === 0" class="text-xs text-slate-500">No weather rows found in database.</p>

        <ul v-else class="space-y-2">
          <li
            v-for="city in weather"
            :key="city.cityKey"
            class="rounded border border-slate-200 bg-slate-50 p-2"
          >
            <p class="text-xs font-medium text-slate-900">{{ city.cityName }}</p>
            <p class="mt-1 text-[11px] text-slate-600">
              {{ city.temperatureC.toFixed(1) }}°C · code {{ city.weatherCode }} · clouds {{ city.cloudCover }}%
            </p>
            <p class="mt-1 text-[11px] text-slate-500">Observed: {{ formatDate(city.observedAtSource) }}</p>
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

:deep(.weather-marker-wrapper) {
  background: transparent;
  border: 0;
}

:deep(.weather-marker) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}

:deep(.weather-marker__icon) {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.2));
}

:deep(.weather-marker__temp) {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 999px;
  padding: 3px 7px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
  white-space: nowrap;
}
</style>
