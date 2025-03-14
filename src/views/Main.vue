<script setup lang="ts">
  import { ref } from 'vue';
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { useYoutube } from '../composables/useYouTube';
  import AppSidebar from '@/components/AppSidebar.vue'
  import { SidebarProvider } from '@/components/ui/sidebar'

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();
  const currentMapPosition = ref<[number, number]>([47.41322, -1.219482]);
  const currentRadius = ref('1000km');
  const currentBbox = ref<[number, number, number, number]>([47.41322, -1.219482, 47.41322, -1.219482]);

  const handleMapCenterChanged = (position: [number, number], zoom: number) => {
    currentMapPosition.value = position;
    currentRadius.value = calculateRadiusFromZoom(zoom);
    console.log('new radius: ', currentRadius.value);
  };

  const goToLocation = (coordinates: [number, number], bbox?: [number, number, number, number]) => {
    currentMapPosition.value = coordinates;
    currentBbox.value = bbox || currentBbox.value;
  };

  const calculateRadiusFromZoom = (zoomLevel: number): string => {
    const radiusKm = 40075 / Math.pow(2, zoomLevel); 
    const limitedRadius = Math.min(Math.ceil(radiusKm), 1000);
    return `${limitedRadius}km`;
  };

  const handleLocationSearch = (location: [number, number]) => {
    currentMapPosition.value = location;
    fetchYoutubeVideos({ apiKey, currentMapPosition: location, currentRadius: currentRadius.value });
  };
</script>

<template>
  <SidebarProvider>
    <AppSidebar @fetch-videos="fetchYoutubeVideos({ apiKey, currentMapPosition, currentRadius })" />
    <div class="flex flex-col w-full">
      <SearchBar 
        @search-videos="handleLocationSearch" 
        @go-to-location="goToLocation" />
      <WorldMap 
        :videos="videos" 
        :current-box="currentBbox"
        :center="currentMapPosition"
        @map-center-changed="handleMapCenterChanged" 
      />
    </div>
  </SidebarProvider>
</template>
