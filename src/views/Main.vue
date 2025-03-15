<script setup lang="ts">
  import { ref } from 'vue';
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { useYoutube } from '../composables/useYouTube';
  import AppSidebar from '@/components/AppSidebar.vue'
  import { SidebarProvider } from '@/components/ui/sidebar'
  import type { GoToLocationOptions } from '../types/Map';

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const { videos, loading, error, fetchYoutubeVideos } = useYoutube();
  const currentMapPosition = ref<[number, number]>([47.41322, -1.219482]);
  const currentZoom = ref(2);
  const currentBbox = ref<[number, number, number, number]>([47.41322, -1.219482, 47.41322, -1.219482]);

  const handleMapCenterChanged = (position: [number, number], zoom: number) => {
    console.log('map change', 'new zoom', zoom);
    currentMapPosition.value = position;
    currentZoom.value = zoom;
  };

  const goToLocation = ({ coordinates, bbox, zoom }: GoToLocationOptions) => {
  console.log('go to location', coordinates, bbox, zoom)
  if (bbox) {
    console.log('Fitting to bounding box:', bbox);
    currentBbox.value = bbox;
  }
  if (zoom) {
    console.log('Zooming to level:', zoom);
    currentZoom.value = zoom;
  }
  currentMapPosition.value = coordinates;
};

</script>

<template>
  <SidebarProvider class="border-stone-700" style="--sidebar-width: 23rem;">
    <AppSidebar 
      @go-to-location="goToLocation"
      :videos="videos" />
    <div class="flex flex-col w-full">
      <SearchBar 
        @fetch-videos="fetchYoutubeVideos({ apiKey, currentMapPosition, currentZoom })"
        @go-to-location="goToLocation" />
      <WorldMap 
        :videos="videos" 
        :current-zoom="currentZoom"
        :current-box="currentBbox"
        :center="currentMapPosition"
        @map-center-changed="handleMapCenterChanged" 
      />
    </div>
  </SidebarProvider>
</template>
