<script setup lang="ts">
import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import 'leaflet.markercluster';
import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
import { ref, watch, onMounted } from 'vue';
import { useMap } from '../composables/useMap';
import { useMobile } from '../composables/useMobile';
import { useSidebarOffset } from '../composables/useSidebarOffset';
import { MapPin } from 'lucide-vue-next';
import Spinner from './Spinner.vue'
import type { VideoMarker } from '../types/Map';
import { useMapStore } from '../store/mapStore';

const props = defineProps<{
  videos: VideoMarker[],
  searchCenter?: [number, number] | null,
  searchRadiusKm?: number,
}>();

const emit = defineEmits(['fetch-videos', 'visual-center-changed']);
const { isMobile } = useMobile();

const mapStore = useMapStore();
const { initializeLeaflet, getUserLocation, mapsList, heartIcon, defaultIcon } = useMap();
const { adjustCenterForSidebar } = useSidebarOffset();
const mapRef = ref();
const mapReady = ref(false);
const searchCircle = ref<L.Circle | null>(null);


const moveMapCenter = () => {
  if (mapStore.flyToTarget) {
    return;
  } 
  if (mapRef.value?.leafletObject) {
    const map = mapRef.value.leafletObject;
    const mapCenter = map.getCenter();
    const zoom = map.getZoom();
    mapStore.setCenter([mapCenter.lat, mapCenter.lng]);
    mapStore.setZoom(zoom);

    // Calcular centro visual ajustado por el sidebar
    const visualCenter = adjustCenterForSidebar(map, mapCenter);
    
    emit('visual-center-changed', [visualCenter.lat, visualCenter.lng]);
    
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

    const map = mapRef.value.leafletObject;

    if (target?.bbox) {
      console.log('Using fitBounds');
      map.fitBounds(L.latLngBounds(
        [target.bbox[1], target.bbox[0]],
        [target.bbox[3], target.bbox[2]]
      ));
    } else {
      // Ajustar el centro para compensar el sidebar
      const targetLatLng = L.latLng(target.center[0], target.center[1]);
      const adjustedCenter = adjustCenterForSidebar(map, targetLatLng);
      
      // Volar al centro ajustado para que visualmente aparezca centrado
      map.flyTo([adjustedCenter.lat, adjustedCenter.lng], target.zoom ?? 12, 
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

const updateSearchCircle = () => {
  if (!mapRef.value?.leafletObject) return;
  
  const map = mapRef.value.leafletObject;
  
  // Remover círculo anterior si existe
  if (searchCircle.value) {
    map.removeLayer(searchCircle.value);
    searchCircle.value = null;
  }
  
  // Crear nuevo círculo si hay datos de búsqueda
  if (props.searchCenter && props.searchRadiusKm && props.searchRadiusKm > 0) {
    // Usar el centro de búsqueda original (ya viene ajustado desde el emit)
    searchCircle.value = L.circle(props.searchCenter, {
      radius: props.searchRadiusKm * 1000, // convertir km a metros
      color: '#999999',
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 1.5,
      opacity: 0.3,
      dashArray: '5, 10'
    }).addTo(map);
  }
};

watch(
  () => [props.searchCenter, props.searchRadiusKm],
  () => {
    updateSearchCircle();
  },
  { deep: true }
);

// Recalcular centro visual cuando cambia el estado del sidebar
watch(
  () => mapStore.selectedOption.expanded,
  () => {
    // Esperar un tick para que el DOM se actualice
    setTimeout(() => {
      moveMapCenter();
    }, 100);
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
      :url="mapsList.carto"
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
          class="relative cursor-pointer z-100001"> 
          <span class="z-9999 text-primary flex flex-row mb-2">
            <MapPin class="w-4 h-4 mr-1 z-10001" /> {{ marker.location?.toUpperCase() }}
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
