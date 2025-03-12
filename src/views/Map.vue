<script setup lang="ts">
  import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
  import { ref } from 'vue';
  import { useMap } from '../composables/useMap';
  import SearchBar from '../components/SearchBar.vue';
  import { useYoutube } from '../composables/useYouTube';

    const { initializeLeaflet } = useMap();
    initializeLeaflet();
    const zoom = ref(2);

    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const { videos, loading, error, fetchYoutubeVideos } = useYoutube();
</script>

<template>
  <div class="relative w-full h-screen">
    <Button label="Fetch Videos" icon="pi pi-check" iconPos="right" @click="fetchYoutubeVideos({ apiKey })" />
    <SearchBar />
    <l-map 
      ref="map" 
      v-model:zoom="zoom" 
      :center="[47.41322, -1.219482]">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
    </l-map>
  </div>
</template>

<style>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
}
</style>