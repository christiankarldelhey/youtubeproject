<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { VideoItem, VideoMarker, center, zoom } from "../types/Map";
import { removeEmojis } from '@/utils/utils.ts';
import { useMapStore } from '../store/mapStore';

  const mapStore = useMapStore();

  const props = defineProps<{ videos: VideoMarker[] }>();
  const emit = defineEmits(['goToLocation']);

  const collapsedLocations = ref<Record<string, boolean>>({});

  const groupedVideoMarkers = computed(() => {
  const locationMap: Record<string, VideoMarker[]> = {};
  props.videos.forEach(video => {
    const location = video.location || 'Unknown';
    if (!locationMap[location]) {
      locationMap[location] = [];
    }
    locationMap[location].push(video);
  });

  return Object.entries(locationMap)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([location, videos]) => ({ location, videos }));
});

const toggleCollapse = (location: string) => {
  collapsedLocations.value[location] = !collapsedLocations.value[location];
};

const openVideo = (video: VideoMarker) => {
  mapStore.selectPin(video);
  mapStore.setDialogOpen(true);
};

</script>


<template>
    <Sidebar>
      <SidebarContent class="bg-background border-0">

        <div v-for="group in groupedVideoMarkers" :key="group.location">
          <div 
            class="cursor-pointer bg-foreground px-4 py-2 border-b text-primary flex justify-between items-center"
            @click="toggleCollapse(group.location)">
            <span>{{ group.location }} ({{ group.videos.length }})</span>
            <span>{{ collapsedLocations[group.location] ? '+' : '-' }}</span>
          </div>
          <div v-show="!collapsedLocations[group.location]" class="space-y-2">
            <Card 
              v-for="video in group.videos" 
              :key="video.videoId"
              class="cursor-pointer mx-4 my-2 border-foreground bg-foreground text-primary">
              
              <CardHeader>
                <p>{{ removeEmojis(video.title) }}</p>
              </CardHeader>
              
              <CardContent>
                <div class="flex flex-col" @click="openVideo(video)">
                  <div class="relative w-64 h-36 overflow-hidden rounded">
                    <img 
                      :src="video.thumbnail" 
                      alt="Video Thumbnail"
                      class="w-full h-full object-cover" />
                  </div>
                </div>
              </CardContent>

            </Card>
          </div>
        </div>
  
      </SidebarContent>
    </Sidebar>
  </template>
  