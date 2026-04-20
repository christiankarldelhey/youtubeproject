<script setup lang="ts">
import L from 'leaflet';
import { LMap, LMarker, LTileLayer } from "@vue-leaflet/vue-leaflet";
import Hls from 'hls.js';
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
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
const selectedCity = ref<CityWeatherCurrent | null>(null);
const hlsVideoRef = ref<HTMLVideoElement | null>(null);
const hlsInstance = ref<Hls | null>(null);
const hlsError = ref<string | null>(null);
const hlsStreamIndex = ref(0);
const mjpegError = ref(false);
const mjpegLoading = ref(false);
const mjpegStreamIndex = ref(0);
let mjpegProbeTimer: ReturnType<typeof setTimeout> | null = null;

const HLS_DEMO_STREAMS = [
  {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    label: 'Mux public HLS test stream',
  },
  {
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    label: 'Akamai public live test stream',
  },
] as const;
const MJPEG_DEMO_SOURCE_LABEL = 'Public MotionJPEG test stream';
const MJPEG_DEMO_STREAMS = [
  'https://webcam.st-malo.com/axis-cgi/mjpg/video.cgi?resolution=640x360',
  'https://axis1.1000eyes.de/axis-cgi/mjpg/video.cgi?resolution=640x360',
];

const currentHlsStream = computed(() => HLS_DEMO_STREAMS[hlsStreamIndex.value] ?? HLS_DEMO_STREAMS[0]);
const currentMjpegStreamUrl = computed(() => MJPEG_DEMO_STREAMS[mjpegStreamIndex.value] ?? '');

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

const destroyHlsPlayer = (): void => {
  hlsInstance.value?.destroy();
  hlsInstance.value = null;
};

const tryPlayVideo = async (video: HTMLVideoElement): Promise<void> => {
  try {
    await video.play();
  } catch {
    hlsError.value = 'Autoplay was blocked. Press play to start the stream.';
  }
};

const clearMjpegProbeTimer = (): void => {
  if (!mjpegProbeTimer) {
    return;
  }

  clearTimeout(mjpegProbeTimer);
  mjpegProbeTimer = null;
};

const startMjpegProbe = (): void => {
  mjpegLoading.value = true;
  clearMjpegProbeTimer();
  mjpegProbeTimer = setTimeout(() => {
    if (mjpegLoading.value) {
      handleMjpegError();
    }
  }, 8000);
};

const resetMjpegState = (): void => {
  mjpegError.value = false;
  mjpegStreamIndex.value = 0;
  startMjpegProbe();
};

const handleMjpegLoad = (): void => {
  mjpegLoading.value = false;
  clearMjpegProbeTimer();
};

const tryNextMjpegStream = (): void => {
  if (mjpegStreamIndex.value < MJPEG_DEMO_STREAMS.length - 1) {
    mjpegStreamIndex.value += 1;
    mjpegError.value = false;
    startMjpegProbe();
    return;
  }

  mjpegLoading.value = false;
  mjpegError.value = true;
};

const setupHlsPlayer = (streamIndex = 0): void => {
  const video = hlsVideoRef.value;
  if (!video) {
    return;
  }

  hlsStreamIndex.value = streamIndex;
  hlsError.value = null;
  destroyHlsPlayer();

  const stream = HLS_DEMO_STREAMS[streamIndex];
  if (!stream) {
    hlsError.value = 'HLS stream is unavailable right now.';
    return;
  }

  const tryNextHlsStream = (): boolean => {
    const nextIndex = streamIndex + 1;
    if (nextIndex < HLS_DEMO_STREAMS.length) {
      setupHlsPlayer(nextIndex);
      return true;
    }

    return false;
  };

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = stream.url;
    video.addEventListener('loadedmetadata', async () => {
      await tryPlayVideo(video);
    }, { once: true });
    video.addEventListener('error', () => {
      if (!tryNextHlsStream()) {
        hlsError.value = 'HLS stream is unavailable right now.';
      }
    }, { once: true });
    video.load();
    return;
  }

  if (Hls.isSupported()) {
    const instance = new Hls();
    instance.loadSource(stream.url);
    instance.attachMedia(video);

    instance.on(Hls.Events.MANIFEST_PARSED, () => {
      void tryPlayVideo(video);
    });

    instance.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        destroyHlsPlayer();
        if (!tryNextHlsStream()) {
          hlsError.value = 'HLS stream is unavailable right now.';
        }
      }
    });

    hlsInstance.value = instance;
    return;
  }

  hlsError.value = 'HLS is not supported in this browser.';
};

const openCityPanel = async (city: CityWeatherCurrent): Promise<void> => {
  if (selectedCity.value?.cityKey === city.cityKey) {
    return;
  }

  selectedCity.value = city;
  resetMjpegState();

  await nextTick();
  setupHlsPlayer();
};

const closeCityPanel = (): void => {
  selectedCity.value = null;
  hlsError.value = null;
  mjpegLoading.value = false;
  clearMjpegProbeTimer();
  destroyHlsPlayer();

  if (hlsVideoRef.value) {
    hlsVideoRef.value.removeAttribute('src');
    hlsVideoRef.value.load();
  }
};

const handleMjpegError = (): void => {
  tryNextMjpegStream();
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
  clearMjpegProbeTimer();
  destroyHlsPlayer();
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
        @click="openCityPanel(city)"
      />
    </l-map>

    <div
      v-if="mapReady && selectedCity"
      class="absolute top-4 left-4 z-[1200] w-[20rem] rounded-lg border bg-white/95 shadow-xl"
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
            :disabled="loadingWeather"
            @click="fetchCurrentWeather()"
          >
            {{ loadingWeather ? 'Loading...' : 'Refresh' }}
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
        <p v-if="weatherError" class="text-xs text-red-600">{{ weatherError }}</p>
        <p v-else-if="loadingWeather" class="text-xs text-slate-500">Loading weather from backend...</p>

        <div v-else class="space-y-3">
          <div class="rounded border border-slate-200 bg-slate-50 p-2">
            <p class="text-xs font-medium text-slate-900">{{ selectedCity.cityName }}</p>
            <p class="mt-1 text-[11px] text-slate-600">
              {{ selectedCity.temperatureC.toFixed(1) }}°C · code {{ selectedCity.weatherCode }} · clouds {{ selectedCity.cloudCover }}%
            </p>
            <p class="mt-1 text-[11px] text-slate-500">Observed: {{ formatDate(selectedCity.observedAtSource) }}</p>
          </div>

          <div class="space-y-1">
            <p class="text-[11px] font-semibold text-slate-700">Live HLS feed</p>
            <video
              ref="hlsVideoRef"
              class="w-full rounded border border-slate-200 bg-black"
              controls
              autoplay
              muted
              playsinline
            />
            <p class="text-[10px] text-slate-500">Demo source: {{ currentHlsStream.label }}</p>
            <p v-if="hlsError" class="text-[10px] text-red-600">{{ hlsError }}</p>
          </div>

          <div class="space-y-1">
            <p class="text-[11px] font-semibold text-slate-700">Live MJPEG feed</p>
            <img
              v-if="!mjpegError"
              :key="currentMjpegStreamUrl"
              :src="currentMjpegStreamUrl"
              class="h-40 w-full rounded border border-slate-200 bg-black object-contain"
              alt="Live MJPEG demo stream"
              @load="handleMjpegLoad"
              @error="handleMjpegError"
            >
            <p class="text-[10px] text-slate-500">Demo source: {{ MJPEG_DEMO_SOURCE_LABEL }}</p>
            <p v-if="mjpegLoading && !mjpegError" class="text-[10px] text-slate-500">Trying MJPEG source {{ mjpegStreamIndex + 1 }}/{{ MJPEG_DEMO_STREAMS.length }}...</p>
            <p v-if="mjpegError" class="text-[10px] text-red-600">MJPEG stream is unavailable right now.</p>
            <button
              class="mt-1 rounded border border-slate-300 px-2 py-1 text-[10px] text-slate-700 hover:bg-slate-100"
              @click="tryNextMjpegStream"
            >
              Try another MJPEG source
            </button>
          </div>
        </div>

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
