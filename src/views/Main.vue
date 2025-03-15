<script setup lang="ts">
  import { computed } from 'vue';
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { useYoutube } from '../composables/useYouTube';
  import AppSidebar from '@/components/AppSidebar.vue'
  import { SidebarProvider } from '@/components/ui/sidebar'
  import { useMapStore } from '../store/mapStore';

  const mapStore = useMapStore();

  const currentZoom = computed(() => mapStore.zoom);
  const currentMapPosition = computed(() => mapStore.center);

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();
</script>

<template>
  <SidebarProvider class="border-stone-700" style="--sidebar-width: 23rem;">
    <AppSidebar 
      :videos="videos" />
    <div class="flex flex-col w-full">
      <SearchBar 
        @fetch-videos="fetchYoutubeVideos({ apiKey, currentMapPosition, currentZoom })" />
      <WorldMap :videos="videos" />
    </div>
  </SidebarProvider>
</template>
