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

  const mapStore = useMapStore();
  const selectedOption = ref('none');
  const { favorites } = useFavorites();

  const currentZoom = computed(() => mapStore.zoom);
  const currentMapPosition = computed(() => mapStore.center);

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();

  const sidebarOpen = ref(false);
  const handleSidebar = (open: boolean, option: string) => {  
    sidebarOpen.value = open;
    selectedOption.value = option;
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
    <div class="flex flex-col w-full">
      <SearchBar 
        @fetch-videos="fetchYoutubeVideos({ apiKey, currentMapPosition, currentZoom })" />
        <WorldMap 
          :videos="selectedOption === 'favorites' ? favorites : videos" />
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
