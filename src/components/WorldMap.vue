<script setup lang="ts">
import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import 'leaflet.markercluster';
import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
import { ref, watch, onMounted } from 'vue';
import { useMap } from '../composables/useMap';
import { useMobile } from '../composables/useMobile';
import { MapPin } from 'lucide-vue-next';
import Spinner from './Spinner.vue'
import type { VideoMarker } from '../types/Map';
import { useMapStore } from '../store/mapStore';


const props = defineProps<{
  videos: VideoMarker[],
}>();

const emit = defineEmits(['fetch-videos']);
const { isMobile } = useMobile();

const mapStore = useMapStore();
const { initializeLeaflet, getUserLocation, mapsList, heartIcon, defaultIcon } = useMap();
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
    zoom >= 5 ? mapStore.setShowSearchButton(true) : mapStore.setShowSearchButton(false);
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
      console.log('Using fitBounds');
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

const selectVideo = (video: VideoMarker) => {
  mapStore.selectPin(video);
  console.log('isMobile', isMobile.value);
  console.log('selectedPin', mapStore.selectedPin);
  if (isMobile.value) mapStore.setMobileVideoDetail(true);
}

const openVideo = () => {
  mapRef.value?.leafletObject.closePopup();
  mapStore.setDialogOpen(true);
};

const getMarkerIcon = (marker: VideoMarker): L.Icon<L.IconOptions> => {
  return (marker.favorited ? heartIcon : defaultIcon) as L.Icon<L.IconOptions>;
};

onMounted(async () => {
  initializeLeaflet();
  try {
    const { latitude, longitude } = await getUserLocation();
    mapStore.setCenter([latitude, longitude]);
    mapStore.setZoom(13);
  } catch {
    mapStore.setZoom(2);
  } finally {
    emit('fetch-videos');
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
      :url="mapsList.cartoLight"
      layer-type="base"
      name="map"
    />
    
    <l-marker-cluster-group 
      :key="videos.length + JSON.stringify(videos.map(v => v.videoId))">
      <template v-if="isMobile">
        <l-marker 
          v-for="marker in props.videos"
          :key="marker.videoId"
          :lat-lng="marker.position ?? mapStore.center"
          :icon="getMarkerIcon(marker)"
          @click="selectVideo(marker)"
        ></l-marker>
      </template>
      <template v-else>
        <l-marker 
        v-for="marker in props.videos"
        :key="marker.videoId"
        :lat-lng="marker.position ?? mapStore.center"
        :icon="getMarkerIcon(marker)"
        @click="selectVideo(marker)">
        <l-popup 
          @click="openVideo()" 
          class="relative cursor-pointer z-9999"> 
          <span class="z-9999 text-primary flex flex-row mb-2">
            <MapPin class="w-4 h-4 mr-1" /> {{ marker.location?.toUpperCase() }}
          </span>
          <div class="relative w-64 h-36 overflow-hidden rounded">
            <img 
              :src="marker.thumbnail" 
              alt="Video Thumbnail"
              class="w-full h-full object-cover" />
          </div>
          <p>{{ marker.title }}</p>
        </l-popup>
      </l-marker>
      </template>
    </l-marker-cluster-group>

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
