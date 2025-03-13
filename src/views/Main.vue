<script setup lang="ts">
  import { ref } from 'vue';
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { useYoutube } from '../composables/useYouTube';
  import AppSidebar from '@/components/AppSidebar.vue'
  import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();
  const currentMapPosition = ref([47.41322, -1.219482]);
  const currentRadius = ref('1000km');

  const handleMapCenterChanged = (position: number[], zoom: number) => {
    currentMapPosition.value = [position[0], position[1]];
    currentRadius.value = calculateRadiusFromZoom(zoom);
    console.log('new radius: ', currentRadius.value);
  };

  const calculateRadiusFromZoom = (zoomLevel: number): string => {
    const radiusKm = 40075 / Math.pow(2, zoomLevel); 
    const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
    return `${limitedRadius}km`;
  };

</script>

<template>
  <SidebarProvider>
    <AppSidebar @fetch-videos="fetchYoutubeVideos({ apiKey, currentMapPosition, currentRadius })" />
    <div class="flex flex-col w-full">
      <SearchBar @search-videos="" />
      <WorldMap :videos="videos" @map-center-changed="handleMapCenterChanged" />
    </div>
  </SidebarProvider>
</template>
