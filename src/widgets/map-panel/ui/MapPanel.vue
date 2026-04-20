<script setup lang="ts">
import L from 'leaflet'
import { LMap, LMarker, LTileLayer } from '@vue-leaflet/vue-leaflet'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Spinner from '@/components/Spinner.vue'
import { useMobile } from '@/shared/composables/use-mobile'
import { useMapStore, initializeLeaflet, getUserLocation, mapsList } from '@/entities/map'
import { createWeatherMarkerIcon } from '@/entities/weather'
import type { CityWeatherCurrent } from '@/entities/weather'
import { useWeatherRealtime } from '@/features/weather-realtime'
import { VideoDemoPanel } from '@/features/video-demo'

const { isMobile } = useMobile()
const mapStore = useMapStore()

const {
  weather,
  loading,
  error,
  mqttStatus,
  lastFetchedAt,
  fetchCurrentWeather,
  connectRealtime,
  disconnectRealtime,
} = useWeatherRealtime()

const mapRef = ref<InstanceType<typeof LMap> | null>(null)
const mapReady = ref(false)
const selectedCity = ref<CityWeatherCurrent | null>(null)

const markerList = computed(() => weather.value)

const formatDate = (value: string | null): string => {
  if (!value) {
    return 'Unknown date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return date.toLocaleString()
}

const openCityPanel = (city: CityWeatherCurrent): void => {
  if (selectedCity.value?.cityKey === city.cityKey) {
    return
  }

  selectedCity.value = city
}

const closeCityPanel = (): void => {
  selectedCity.value = null
}

const moveMapCenter = () => {
  if (mapStore.flyToTarget) {
    return
  }

  const leafletMap = mapRef.value?.leafletObject
  if (!leafletMap) {
    return
  }

  const mapCenter = leafletMap.getCenter()
  const zoom = leafletMap.getZoom()
  mapStore.setCenter([mapCenter.lat, mapCenter.lng])
  mapStore.setZoom(zoom)
}

const onMapReady = () => {
  const map = mapRef.value?.leafletObject
  if (!map) {
    return
  }

  if (!isMobile.value) {
    map.zoomControl.setPosition('bottomright')
  } else {
    map.removeControl(map.zoomControl)
  }
}

watch(
  () => mapStore.flyToTarget,
  (target) => {
    const leafletMap = mapRef.value?.leafletObject
    if (!target || !leafletMap) {
      return
    }

    if (target.bbox) {
      leafletMap.fitBounds(
        L.latLngBounds([target.bbox[1], target.bbox[0]], [target.bbox[3], target.bbox[2]]),
      )
    } else {
      leafletMap.flyTo(target.center, target.zoom ?? 12, {
        animate: true,
        duration: 2.5,
        easeLinearity: 0.1,
      })
    }

    mapStore.setZoom(target.zoom ?? 12)
    mapStore.setCenter(target.center ?? [0, 0])
    mapStore.clearFlyToTarget()
  },
)

onMounted(async () => {
  initializeLeaflet()

  try {
    const { latitude, longitude } = await getUserLocation()
    mapStore.setCenter([latitude, longitude])
    mapStore.setZoom(13)
  } catch {
    mapStore.setZoom(2)
  } finally {
    mapReady.value = true
  }

  await fetchCurrentWeather()
  connectRealtime()
})

onUnmounted(() => {
  disconnectRealtime()
})
</script>

<template>
  <div class="relative h-full w-full">
    <l-map
      v-if="mapReady"
      ref="mapRef"
      v-model:zoom="mapStore.zoom"
      :center="mapStore.center"
      @moveend="moveMapCenter"
      @ready="onMapReady"
    >
      <l-tile-layer :url="mapsList.carto" layer-type="base" name="map" />

      <l-marker
        v-for="city in markerList"
        :key="`marker-${city.cityKey}-${city.updatedAt}`"
        :lat-lng="[city.latitude, city.longitude]"
        :icon="createWeatherMarkerIcon(city)"
        @click="openCityPanel(city)"
      />
    </l-map>

    <div
      v-if="mapReady && selectedCity"
      class="absolute left-4 top-4 z-[1200] w-[20rem] rounded-lg border bg-white/95 shadow-xl"
      :class="isMobile ? 'w-[16rem]' : 'w-[20rem]'"
    >
      <div class="flex items-center justify-between border-b px-3 py-2">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">{{ selectedCity.cityName }}</h3>
          <p class="text-[10px] text-slate-500">MQTT: {{ mqttStatus }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="fetchCurrentWeather()"
          >
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
          <button
            class="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
            @click="closeCityPanel"
          >
            X
          </button>
        </div>
      </div>

      <div class="p-3">
        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        <p v-else-if="loading" class="text-xs text-slate-500">Loading weather from backend...</p>

        <div v-else class="space-y-3">
          <div class="rounded border border-slate-200 bg-slate-50 p-2">
            <p class="text-xs font-medium text-slate-900">{{ selectedCity.cityName }}</p>
            <p class="mt-1 text-[11px] text-slate-600">
              {{ selectedCity.temperatureC.toFixed(1) }}°C · code {{ selectedCity.weatherCode }} · clouds
              {{ selectedCity.cloudCover }}%
            </p>
            <p class="mt-1 text-[11px] text-slate-500">Observed: {{ formatDate(selectedCity.observedAtSource) }}</p>
          </div>

          <VideoDemoPanel />
        </div>

        <p v-if="lastFetchedAt" class="mt-3 text-[10px] text-slate-400">
          Last fetch: {{ formatDate(lastFetchedAt) }}
        </p>
      </div>
    </div>

    <div v-else class="flex h-full w-full items-center justify-center bg-background">
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
