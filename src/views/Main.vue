<script setup lang="ts">
  import { computed } from 'vue';
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { useYoutube } from '../composables/useYouTube';
  import { SidebarProvider } from '@/components/ui/sidebar'
  import { useMapStore } from '../store/mapStore';
  import VideoDialog from '../components/VideoDialog.vue';
  import VideoSidebar from '../components/VideoSidebar.vue';
  import { useFavorites } from '../composables/useFavorites';
  import { useAuth } from '../composables/useAuth';
  import type { center, zoom } from '../types/Map';
  import { Button } from '@/components/ui/button';
  import UserOptions from '../components/UserOptions.vue';
  import { useSearchSettings } from '../composables/useSearchSettings';
  import MobileOptions from '../components/MobileOptions.vue';
  import MobileMenu from '../components/MobileMenu.vue';
  import MobileVideoDetail from '../components/MobileVideoDetail.vue';
  import { useMobile } from '../composables/useMobile';
  import { Toaster } from '@/components/ui/toast';
  import strings from '../locales/en';

  const { iconMap } = useSearchSettings();
  const { isMobile } = useMobile();

  const mapStore = useMapStore();
  const { favorites } = useFavorites();
  const { user } = useAuth();

  const currentZoom = computed(() => mapStore.zoom);
  const currentMapPosition = computed(() => mapStore.center);

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, fetchYoutubeVideos } = useYoutube();

  const fetchVideos = (currentMapPosition: center, currentZoom: zoom) => {
    fetchYoutubeVideos({ apiKey, currentMapPosition, currentZoom, searchQuery: mapStore.searchQuery.value });
    mapStore.setShowSearchButton(false);
  }
</script>

<template>
  <SidebarProvider 
      :open="!isMobile && mapStore.selectedOption.expanded"
      :defaultOpen="false" 
      style="--sidebar-width: 35rem;">
   <VideoSidebar 
      :favorites="favorites"
      :videos="videos" />

    <UserOptions 
      :user="user" 
      class="z-9999" />
    <SearchBar @fetch-videos="fetchVideos(currentMapPosition, currentZoom)" />

    <div class="flex flex-col w-full">
        <WorldMap 
          :videos="mapStore.selectedOption.value === 'favorites' ? favorites : videos" 
          @fetch-videos="fetchVideos(currentMapPosition, currentZoom)"
          />
    </div>
    <VideoDialog
      v-if="!isMobile && mapStore.selectedPin && mapStore.dialogOpen"
      :open="mapStore.dialogOpen" />
    <MobileVideoDetail 
      v-if="isMobile && mapStore.showMobileVideoDetail"
      :open="mapStore.showMobileVideoDetail"
      @update:open="mapStore.setMobileVideoDetail(false)"
      />
    <MobileMenu 
      v-if="isMobile"
      :open="mapStore.selectedOption.expanded"
      @update:open="mapStore.setSelectedOption(mapStore.selectedOption.value, false)"
      :favorites="favorites"
      :videos="videos" />

        <!--Search Button este anda-->
    <Button 
      v-if="mapStore.showSearchButton"
      @click="fetchVideos(currentMapPosition, currentZoom)" 
      variant="secondary"
      class="absolute z-9999 left-1/2 top-24 transform -translate-x-1/2 border text-sm">
      <component 
        :is="iconMap[mapStore.searchQuery.icon as keyof typeof iconMap]" 
        class="w-2 h-2" /> 
      {{ strings.videos_in_area }}
    </Button>
  </SidebarProvider>
  <div v-if="isMobile" class="fixed bottom-0 p-2 w-full bg-gray-200 h-14 z-100001">
    <MobileOptions />
  </div>
  <Toaster />
</template>

<style>
  .is-mobile [data-state="open"].bg-black\/80 {
    background-color: transparent;
  }
div[role="dialog"][data-state="open"] {
    z-index: 100000 !important;
    position: fixed !important;
}
div[data-aria-hidden = true][data-state="open"] {
  z-index: 9999 !important;
}
</style>   
