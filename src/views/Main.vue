<script setup lang="ts">
  import { ref, computed } from 'vue';
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
  import { Search } from 'lucide-vue-next';
  import UserOptions from '../components/UserOptions.vue';

  const mapStore = useMapStore();
  const selectedOption = ref('none');
  const { favorites } = useFavorites();
  const { user } = useAuth();

  const currentZoom = computed(() => mapStore.zoom);
  const currentMapPosition = computed(() => mapStore.center);

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();

  const sidebarOpen = ref(false);
  const handleSidebar = (open: boolean, option: string) => {  
    sidebarOpen.value = open;
    selectedOption.value = option;
  }

  const fetchVideos = (currentMapPosition: center, currentZoom: zoom) => {
    fetchYoutubeVideos({ apiKey, currentMapPosition, currentZoom, searchQuery: mapStore.searchQuery });
    mapStore.setShowSearchButton(false);
  }
</script>

<template>
  <SidebarProvider 
    :open="sidebarOpen"
    :defaultOpen="false" 
    style="--sidebar-width: 35rem;">
   <VideoSidebar 
    @handle-sidebar="handleSidebar"
    :videos="videos" />
    <Button 
      v-if="mapStore.showSearchButton"
      @click="fetchVideos(currentMapPosition, currentZoom)" 
      variant="secondary"
      class="absolute z-9999 left-1/2 top-24 transform -translate-x-1/2 border text-sm">
      <Search class="w-2 h-2" /> Videos in this area
    </Button>
    <UserOptions 
      :user="user" 
      class="z-9999" />
    <SearchBar @fetch-videos="fetchVideos(currentMapPosition, currentZoom)" />
    <div class="flex flex-col w-full">
        <WorldMap 
          :videos="selectedOption === 'favorites' ? favorites : videos" 
          @fetch-videos="fetchVideos(currentMapPosition, currentZoom)"
          />
    </div>
    <VideoDialog
      v-if="mapStore.selectedPin && mapStore.dialogOpen"
      :open="mapStore.dialogOpen" />
  </SidebarProvider>
</template>

<style>
div[role="dialog"][data-state="open"] {
    z-index: 100000 !important;
    position: fixed !important;
}
div[data-aria-hidden = true][data-state="open"] {
  z-index: 9999 !important;
}
</style>   
