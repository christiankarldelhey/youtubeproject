<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { useYoutube } from '../composables/useYouTube';
  import { SidebarProvider } from '@/components/ui/sidebar'
  import { useMapStore } from '../store/mapStore';
  import VideoDialog from '../components/VideoDialog.vue';
  import VideoSidebar from '../components/VideoSidebar.vue';

  const mapStore = useMapStore();

  const currentZoom = computed(() => mapStore.zoom);
  const currentMapPosition = computed(() => mapStore.center);

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();

  const sidebarOpen = ref(false);

  watch(videos, (newVideos) => {
  if (newVideos.length > 0) {
    sidebarOpen.value = true;
  }
});
</script>

<template>
  <SidebarProvider 
    :open="sidebarOpen"
    :defaultOpen="false" 
    style="--sidebar-width: 25rem;">
   <VideoSidebar 
    @handle-sidebar="sidebarOpen = $event"
    :videos="videos" />
    <div class="flex flex-col w-full">
      <SearchBar 
        @fetch-videos="fetchYoutubeVideos({ apiKey, currentMapPosition, currentZoom })" />
      <WorldMap :videos="videos" />
    </div>
    <VideoDialog
      v-if="mapStore.selectedPin && mapStore.dialogOpen"
      :video="mapStore.selectedPin"
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
