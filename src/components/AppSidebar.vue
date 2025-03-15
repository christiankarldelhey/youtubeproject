<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { VideoItem, VideoMarker } from "../types/Map";
import { removeEmojis } from '@/utils/utils.ts';

const props = defineProps<{ videos: VideoItem[] }>();
const emit = defineEmits(['goToLocation']);

// State to track collapsed locations
const collapsedLocations = ref<Record<string, boolean>>({});

// Group and sort video markers by location frequency
const groupedVideoMarkers = computed(() => {
  const locationMap: Record<string, VideoMarker[]> = {};

  // Group videos by location
  props.videos.forEach(video => {
    const location = video.recordingDetails?.locationDescription || 'Unknown';
    if (!locationMap[location]) {
      locationMap[location] = [];
    }

    if (video.recordingDetails?.location) {
      locationMap[location].push({
        position: [
          video.recordingDetails.location.latitude,
          video.recordingDetails.location.longitude
        ],
        location,
        title: video.snippet.title,
        description: video.snippet.description,
        videoId: video.id.videoId,
        thumbnail: video.snippet.thumbnails.high.url
      });
    }
  });

  // Sort locations by frequency (descending)
  return Object.entries(locationMap)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([location, videos]) => ({ location, videos }));
});

// Toggle collapse state
const toggleCollapse = (location: string) => {
  collapsedLocations.value[location] = !collapsedLocations.value[location];
};
</script>


<template>
    <Sidebar class="border-stone-700">
      <SidebarContent class="bg-stone-700 border-0">

        <div v-for="group in groupedVideoMarkers" :key="group.location">
          <div 
            class="cursor-pointer bg-stone-800 px-4 py-2 border-stone-900 border-b text-gray-400 flex justify-between items-center"
            @click="toggleCollapse(group.location)">
            <span>{{ group.location }} ({{ group.videos.length }})</span>
            <span>{{ collapsedLocations[group.location] ? '+' : '-' }}</span>
          </div>
  
          <!-- Collapsible Content -->
          <div v-show="!collapsedLocations[group.location]" class="space-y-2">
            <Card 
              v-for="video in group.videos" 
              :key="video.videoId"
              @mouseover="emit('goToLocation', { coordinates: video.position, zoom: 12 })"
              class="cursor-pointer mx-4 my-2 bg-stone-800 border-stone-800 text-gray-400">
              
              <CardHeader>
                <p>{{ removeEmojis(video.title) }}</p>
              </CardHeader>
              
              <CardContent>
                <a class="flex flex-col" :href="`https://www.youtube.com/watch?v=${video.videoId}`" target="_blank">
                  <div class="relative w-64 h-36 overflow-hidden rounded">
                    <img 
                      :src="video.thumbnail" 
                      alt="Video Thumbnail"
                      class="w-full h-full object-cover" />
                  </div>
                </a>
              </CardContent>
              
            </Card>
          </div>
        </div>
  
      </SidebarContent>
    </Sidebar>
  </template>
  