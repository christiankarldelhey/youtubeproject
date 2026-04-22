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
  videoIcon,
} from '@/entities/map'
import { getPoiTopicEmoji, getPoiTopicIcon } from '@/entities/poi'
import type { OverpassBbox, PoiMarker } from '@/entities/poi'
import type { VideoMarker } from '@/entities/youtube-video'
import { useSeePois } from '@/features/see-pois'
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
const { pois, loadingPois, poisError, fetchPoisByCurrentViewport, clearPois } = useSeePois()

const { favorites, fetchFavorites } = useYoutubeFavorites()
const { searchQuery } = useYoutubeSearchSettings()

const mapRef = ref<InstanceType<typeof LMap> | null>(null)
const mapReady = ref(false)

const videoMarkerList = computed<VideoMarker[]>(() => {
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

const poiMarkerList = computed<PoiMarker[]>(() => {
  if (selectedOption.value.value === 'favorites') {
    return []
  }

  return pois.value
})

const visibleError = computed(() => error.value ?? poisError.value)
const mapLoading = computed(() => loading.value || loadingPois.value)

const videoClusterOptions = {
  clusterPane: 'videoClustersPane',
  iconCreateFunction: (cluster: { getChildCount: () => number }) => {
    const count = cluster.getChildCount()

    return L.divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;gap:4px;width:48px;height:48px;border-radius:9999px;background:#ef4444;border:2px solid #ffffff;color:#ffffff;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.35);"><span style="font-size:14px;line-height:1">▶</span><span style="font-size:12px;line-height:1">${count}</span></div>`,
      className: 'custom-cluster-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })
  },
}

const poiClusterOptions = {
  clusterPane: 'poiClustersPane',
  iconCreateFunction: (cluster: { getChildCount: () => number }) => {
    const count = cluster.getChildCount()
    const iconLabel = getPoiTopicEmoji(searchQuery.value.value)

    return L.divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;gap:4px;width:48px;height:48px;border-radius:9999px;background:#6639de;border:2px solid #ffffff;color:#ffffff;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.35);"><span style="font-size:14px;line-height:1">${iconLabel}</span><span style="font-size:12px;line-height:1">${count}</span></div>`,
      className: 'custom-cluster-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })
  },
}

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

const getCurrentBbox = (): OverpassBbox | null => {
  const leafletMap = mapRef.value?.leafletObject
  if (!leafletMap) {
    return null
  }

  const bounds = leafletMap.getBounds()
  return [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()]
}

const researchInArea = async () => {
  const bbox = getCurrentBbox()

  await Promise.all([
    fetchYoutubeVideos({
      apiKey,
      currentMapPosition: mapStore.center,
      currentZoom: mapStore.zoom,
      searchQuery: searchQuery.value.value,
    }),
    bbox ? fetchPoisByCurrentViewport(bbox, searchQuery.value.value) : Promise.resolve(),
  ])

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

  const poiMarkersPane = map.createPane('poiMarkersPane')
  poiMarkersPane.style.zIndex = '520'

  const poiClustersPane = map.createPane('poiClustersPane')
  poiClustersPane.style.zIndex = '560'

  const videoMarkersPane = map.createPane('videoMarkersPane')
  videoMarkersPane.style.zIndex = '620'

  const videoClustersPane = map.createPane('videoClustersPane')
  videoClustersPane.style.zIndex = '660'

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
  return (video.favorited ? heartIcon : videoIcon) as unknown as L.Icon<L.IconOptions>
}

const getPoiMarkerIcon = (): L.Icon<L.IconOptions> => {
  return getPoiTopicIcon(searchQuery.value.value) as unknown as L.Icon<L.IconOptions>
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
  clearPois()

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

      <l-marker-cluster-group
        :options="poiClusterOptions"
        :key="
          poiMarkerList.length +
          JSON.stringify(poiMarkerList.map((item) => item.id))
        "
      >
        <template v-if="isMobile">
          <l-marker
            v-for="poi in poiMarkerList"
            :key="poi.id"
            :lat-lng="poi.position"
            :icon="getPoiMarkerIcon()"
            :options="{ pane: 'poiMarkersPane' }"
          >
            <l-popup class="relative z-100001">
              <span class="z-9999 mb-2 flex flex-row text-primary">
                <MapPin class="z-10001 mr-1 h-4 w-4" /> {{ poi.name.toUpperCase() }}
              </span>
              <p>{{ poi.description }}</p>
            </l-popup>
          </l-marker>
        </template>

        <template v-else>
          <l-marker
            v-for="poi in poiMarkerList"
            :key="poi.id"
            :lat-lng="poi.position"
            :icon="getPoiMarkerIcon()"
            :options="{ pane: 'poiMarkersPane' }"
          >
            <l-popup class="relative z-100001">
              <span class="z-9999 mb-2 flex flex-row text-primary">
                <MapPin class="z-10001 mr-1 h-4 w-4" /> {{ poi.name.toUpperCase() }}
              </span>
              <p>{{ poi.description }}</p>
            </l-popup>
          </l-marker>
        </template>
      </l-marker-cluster-group>

      <l-marker-cluster-group
        :options="videoClusterOptions"
        :key="videoMarkerList.length + JSON.stringify(videoMarkerList.map((item) => item.videoId))"
      >
        <template v-if="isMobile">
          <l-marker
            v-for="marker in videoMarkerList"
            :key="marker.videoId"
            :lat-lng="marker.position ?? mapStore.center"
            :icon="getMarkerIcon(marker)"
            :options="{ pane: 'videoMarkersPane' }"
            @click="selectMarker(marker)"
          />
        </template>

        <template v-else>
          <l-marker
            v-for="marker in videoMarkerList"
            :key="marker.videoId"
            :lat-lng="marker.position ?? mapStore.center"
            :icon="getMarkerIcon(marker)"
            :options="{ pane: 'videoMarkersPane' }"
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
        @click="researchInArea"
      >
        {{ $t('research_in_area') }}
      </Button>
    </div>

    <div v-if="visibleError" class="absolute left-1/2 top-36 z-9999 -translate-x-1/2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
      {{ visibleError }}
    </div>

    <div v-if="!mapReady || mapLoading" class="flex h-full w-full items-center justify-center bg-background">
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

:deep(.custom-cluster-icon) {
  background: transparent;
  border: none;
}
</style>
