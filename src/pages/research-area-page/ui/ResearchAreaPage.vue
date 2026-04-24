<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SidebarProvider } from '@/shared/ui/shadcn/sidebar'
import { SearchBar } from '@/widgets/search-bar'
import { MapPanel } from '@/widgets/map-panel'
import { UserControls } from '@/widgets/user-controls'
import { useAuthSession } from '@/features/auth'
import { useYoutubeFavorites } from '@/features/youtube-favorites'
import { useYoutubeVideos } from '@/features/youtube-videos'
import { MobileVideoDetail, VideoDialog } from '@/features/youtube-video-player'
import { useMobile } from '@/shared/composables/use-mobile'
import { MobileMenu, MobileOptions, VideoSidebar } from '@/widgets/youtube-sidebar'
import { getResearchAreaByIdApi } from '@/entities/research-area'
import { useMapStore } from '@/entities/map'
import { Button } from '@/shared/ui/shadcn/button'

const route = useRoute()
const router = useRouter()
const { user } = useAuthSession()
const {
  videos,
  selectedVideo,
  dialogOpen,
  mobileVideoDetail,
  selectedOption,
  setSelectedOption,
} = useYoutubeVideos()
const { favorites } = useYoutubeFavorites()
const { isMobile } = useMobile()
const mapStore = useMapStore()

const researchArea = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const id = route.params.id as string
    const area = await getResearchAreaByIdApi(id)
    researchArea.value = area

    // Set bbox restriction
    if (area.bbox) {
      mapStore.setBboxRestriction(area.bbox)
      mapStore.setCenter([
        (area.bbox[0] + area.bbox[2]) / 2,
        (area.bbox[1] + area.bbox[3]) / 2,
      ])
      mapStore.setZoom(area.zoomLevel || 12)

      // Set min zoom restriction to prevent zooming out beyond the research area zoom level
      if (area.zoomLevel) {
        mapStore.setMinZoom(area.zoomLevel)
      }
    }
  } catch (error) {
    console.error('Failed to load research area:', error)
    router.push('/')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  // Clear bbox and minZoom restrictions when leaving the page
  mapStore.clearBboxRestriction()
  mapStore.clearMinZoom()
})

const handleExitResearchArea = () => {
  router.push('/')
}
</script>

<template>
  <SidebarProvider
    :open="!isMobile && selectedOption.expanded"
    :defaultOpen="false"
    style="--sidebar-width: 35rem;"
  >
    <VideoSidebar :favorites="favorites" :videos="videos" />

    <UserControls :user="user" class="z-9999" />
    <SearchBar />

    <div class="flex w-full flex-col">
      <div class="flex items-center justify-between border-b bg-background p-2">
        <h1 class="text-lg font-semibold">
          {{ researchArea?.name || $t('research_area_title') }}
        </h1>
        <Button variant="outline" size="sm" @click="handleExitResearchArea">
          {{ $t('research_area_exit') }}
        </Button>
      </div>
      <MapPanel />
    </div>

    <VideoDialog v-if="!isMobile && selectedVideo && dialogOpen" />
    <MobileVideoDetail v-if="isMobile && mobileVideoDetail" />

    <MobileMenu
      v-if="isMobile"
      :open="selectedOption.expanded"
      :favorites="favorites"
      :videos="videos"
      @update:open="setSelectedOption(selectedOption.value, false)"
    />

    <div v-if="isMobile" class="fixed bottom-0 z-100001 h-14 w-full bg-gray-200 p-2">
      <MobileOptions />
    </div>
  </SidebarProvider>
</template>

<style>
.is-mobile [data-state="open"].bg-black\/80 {
  background-color: transparent;
}

div[role="dialog"][data-state="open"] {
  z-index: 100000 !important;
  position: fixed !important;
}

div[data-aria-hidden=true][data-state="open"] {
  z-index: 9999 !important;
}

ol,
li[role="alert"] {
  z-index: 100001 !important;
  color: black !important;
}
</style>
