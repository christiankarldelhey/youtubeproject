<script setup lang="ts">
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
