<script setup lang="ts">
import L from 'leaflet'
import { LMap, LMarker, LPopup, LTileLayer } from '@vue-leaflet/vue-leaflet'
import { LMarkerClusterGroup } from 'vue-leaflet-markercluster'
import { computed, onMounted, ref, watch } from 'vue'
import 'leaflet.markercluster'
import { Spinner } from '@/shared/ui/spinner'
import { Button } from '@/shared/ui/shadcn/button'
import { MapPin } from 'lucide-vue-next'
import { useMobile } from '@/shared/composables/use-mobile'
import {
  useMapStore,
  initializeLeaflet,
  getUserLocation,
  mapsList,
  heartIcon,
  defaultIcon,
} from '@/entities/map'
import type { VideoMarker } from '@/entities/youtube-video'
import { useYoutubeVideos } from '@/features/youtube-videos'
import { useYoutubeFavorites } from '@/features/youtube-favorites'
import { useYoutubeSearchSettings } from '@/features/youtube-search-settings'

const { isMobile } = useMobile()
const mapStore = useMapStore()
const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

const {
  videos,
  loading,
  error,
  showSearchButton,
  selectedOption,
  fetchYoutubeVideos,
  setShowSearchButton,
  setSelectedOption,
  selectVideo,
} = useYoutubeVideos()

const { favorites, fetchFavorites } = useYoutubeFavorites()
const { searchQuery } = useYoutubeSearchSettings()

const mapRef = ref<InstanceType<typeof LMap> | null>(null)
const mapReady = ref(false)

const markerList = computed<VideoMarker[]>(() => {
  const favoriteIds = new Set(favorites.value.map((video) => video.videoId))
  const videosWithFavoriteState = videos.value.map((video) => ({
    ...video,
    favorited: favoriteIds.has(video.videoId),
  }))

  if (selectedOption.value.value === 'favorites') {
    return favorites.value
  }

  return videosWithFavoriteState
})

const fetchVideos = async () => {
  await fetchYoutubeVideos({
    apiKey,
    currentMapPosition: mapStore.center,
    currentZoom: mapStore.zoom,
    searchQuery: searchQuery.value.value,
  })

  setShowSearchButton(false)

  if (!isMobile.value) {
    setSelectedOption('search', true)
  }
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
  setShowSearchButton(zoom >= 5)
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

const openVideo = () => {
  mapRef.value?.leafletObject?.closePopup()
}

const selectMarker = (video: VideoMarker) => {
  selectVideo(video)
}

const getMarkerIcon = (video: VideoMarker): L.Icon<L.IconOptions> => {
  return (video.favorited ? heartIcon : defaultIcon) as L.Icon<L.IconOptions>
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
  await fetchFavorites()

  try {
    const { latitude, longitude } = await getUserLocation()
    mapStore.setCenter([latitude, longitude])
    mapStore.setZoom(13)
  } catch {
    mapStore.setZoom(2)
  } finally {
    mapReady.value = true
  }

  await fetchVideos()
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

      <l-marker-cluster-group :key="markerList.length + JSON.stringify(markerList.map((item) => item.videoId))">
        <template v-if="isMobile">
          <l-marker
            v-for="marker in markerList"
            :key="marker.videoId"
            :lat-lng="marker.position ?? mapStore.center"
            :icon="getMarkerIcon(marker)"
            @click="selectMarker(marker)"
          />
        </template>

        <template v-else>
          <l-marker
            v-for="marker in markerList"
            :key="marker.videoId"
            :lat-lng="marker.position ?? mapStore.center"
            :icon="getMarkerIcon(marker)"
            @click="selectMarker(marker)"
          >
            <l-popup class="relative z-100001 cursor-pointer" @click="openVideo()">
              <span class="z-9999 mb-2 flex flex-row text-primary">
                <MapPin class="z-10001 mr-1 h-4 w-4" /> {{ marker.location?.toUpperCase() }}
              </span>
              <div class="relative h-36 w-64 overflow-hidden rounded">
                <img :src="marker.thumbnail" alt="Video Thumbnail" class="h-full w-full object-cover" />
              </div>
              <p>{{ marker.title }}</p>
            </l-popup>
          </l-marker>
        </template>
      </l-marker-cluster-group>
    </l-map>

    <div class="absolute left-1/2 top-24 z-9999 flex -translate-x-1/2 transform gap-2">
      <Button
        v-if="showSearchButton"
        variant="secondary"
        class="border bg-background text-sm text-primary hover:bg-secondary"
        @click="fetchVideos"
      >
        {{ $t('videos_in_area') }}
      </Button>
    </div>

    <div v-if="error" class="absolute left-1/2 top-36 z-9999 -translate-x-1/2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
      {{ error }}
    </div>

    <div v-if="!mapReady || loading" class="flex h-full w-full items-center justify-center bg-background">
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
